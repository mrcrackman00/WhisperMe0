/**
 * Auth routes — session check and optional proxy to Supabase Auth.
 * Actual sign-up/sign-in with email, Google, Apple is done via Supabase client on the frontend.
 * These endpoints help the backend know the current user and track events.
 */
const express = require('express');
const { supabaseUrl: configSupabaseUrl, supabaseAnon } = require('../config/supabase');
const { authMiddleware } = require('../middleware/authMiddleware');
const { trackEvent, EVENTS } = require('../utils/analytics');
const { sendWelcomeEmail } = require('../services/emailService');
const { authLimiter, forgotPasswordLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

/** GET /api/auth/me — return current user if valid JWT (for session check). */
router.get('/me', authMiddleware, (req, res) => {
  const u = req.user;
  res.json({
    id: u.id,
    email: u.email,
    email_confirmed_at: u.email_confirmed_at,
  });
});

/**
 * POST /api/auth/track-login — call after frontend has logged in; tracks login event.
 * Body: none. User from JWT.
 */
router.post('/track-login', authMiddleware, authLimiter, async (req, res) => {
  await trackEvent(EVENTS.LOGIN, req.user.id, {});
  res.json({ ok: true });
});

/**
 * POST /api/auth/on-signup — call after frontend signup; track signup + send welcome email.
 * Body: { display_name? }. User from JWT.
 */
router.post('/on-signup', authMiddleware, authLimiter, async (req, res) => {
  const displayName = req.body?.display_name || '';
  await trackEvent(EVENTS.SIGNUP, req.user.id, { display_name: displayName });
  if (req.user?.email) {
    await sendWelcomeEmail(req.user.email, displayName || 'there');
  }
  res.json({ ok: true });
});

/**
 * POST /api/auth/forgot-password — uses supabase.auth.resetPasswordForEmail().
 * Body: { email, redirectTo?, captchaToken? }
 * Always returns JSON. For security, returns success even if user not found.
 */
router.post('/forgot-password', forgotPasswordLimiter, async (req, res) => {
  const sendJson = (status, body) => {
    res.setHeader('Content-Type', 'application/json');
    res.status(status).json(body);
  };
  try {
    const email = (req.body?.email || '').trim().toLowerCase();
    const emailRe = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    if (!email || !emailRe.test(email)) {
      return sendJson(400, { error: 'Please enter a valid email address.' });
    }

    const frontendUrl = process.env.FRONTEND_URL?.split(',')[0]?.trim() || 'https://whisper-me-flame.vercel.app';
    const allowedOrigins = (process.env.FRONTEND_URL || '')
      .split(',')
      .map((s) => s.trim().replace(/\/$/, ''))
      .filter(Boolean);
    if (!allowedOrigins.length) allowedOrigins.push('https://whisper-me-flame.vercel.app');

    let rawRedirect = req.body?.redirectTo;
    let redirectTo = (typeof rawRedirect === 'string' ? rawRedirect : frontendUrl)
      .trim()
      .replace(/\/index\.html\/?$/, '/');
    if (!redirectTo.endsWith('/')) redirectTo += '/';

    const isAllowed = allowedOrigins.some((origin) => {
      const base = origin.replace(/\/$/, '');
      return redirectTo.startsWith(base + '/') || redirectTo === base;
    });
    const finalRedirect = isAllowed ? redirectTo : frontendUrl.replace(/\/$/, '') + '/';

    if (!supabaseAnon) {
      console.error('[forgot-password] Supabase anon client not configured');
      return sendJson(503, { error: 'Auth not configured.' });
    }

    const { data, error } = await supabaseAnon.auth.resetPasswordForEmail(email, {
      redirectTo: finalRedirect,
      captchaToken: req.body?.captchaToken || undefined,
    });

    if (error) {
      const msg = (error.message || '').toLowerCase();
      if (msg.includes('user not found') || msg.includes('email not found') || msg.includes('user with this email not found')) {
        return sendJson(200, { success: true, ok: true });
      }
      // Supabase sometimes returns HTML (e.g. 502) — never forward HTML to client
      const safeMsg = msg.includes('<') || msg.includes('html') || msg.length > 200
        ? 'Failed to send reset link.'
        : (error.message || 'Failed to send reset link.');
      console.error('[forgot-password] resetPasswordForEmail error:', error.message);
      return sendJson(400, { error: safeMsg });
    }

    return sendJson(200, { success: true, ok: true });
  } catch (err) {
    const errMsg = (err?.message || String(err)).toLowerCase();
    const isHtml = errMsg.includes('<') || errMsg.includes('html');
    console.error('[forgot-password] Unexpected error:', isHtml ? 'Supabase returned non-JSON (possibly HTML)' : err.message || err, err.stack);
    return sendJson(500, { error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
