/**
 * Auth routes — session check and optional proxy to Supabase Auth.
 * Actual sign-up/sign-in with email, Google, Apple is done via Supabase client on the frontend.
 * These endpoints help the backend know the current user and track events.
 */
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { authMiddleware } = require('../middleware/authMiddleware');
const { trackEvent, EVENTS } = require('../utils/analytics');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../services/emailService');
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
 * POST /api/auth/forgot-password — generate reset link via Supabase Admin, send via Resend.
 * Bypasses Supabase SMTP (which often fails). Body: { email, redirectTo?, captchaToken? }
 */
router.post('/forgot-password', forgotPasswordLimiter, async (req, res) => {
  const email = (req.body?.email || '').trim().toLowerCase();
  const emailRe = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
  if (!email || !emailRe.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
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

  // Prevent open redirect: only allow redirectTo from our domains (exact origin or subpath)
  const isAllowed = allowedOrigins.some((origin) => {
    const base = origin.replace(/\/$/, '');
    return redirectTo.startsWith(base + '/');
  });
  if (!isAllowed) redirectTo = frontendUrl.replace(/\/$/, '') + '/';

  if (!supabaseUrl || !serviceKey) {
    return res.status(503).json({ error: 'Auth not configured.' });
  }

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo },
  });

  if (error) {
    // Don't reveal if user exists (security) — Supabase may return "User with this email not found"
    const msg = error.message?.toLowerCase() || '';
    if (msg.includes('user not found') || msg.includes('email not found') || msg.includes('user with this email not found')) {
      return res.json({ ok: true });
    }
    console.error('generateLink error:', error.message);
    return res.status(400).json({ error: error.message || 'Failed to generate reset link.' });
  }

  const actionLink = data?.properties?.action_link || data?.action_link;
  if (!actionLink) {
    console.error('No action_link in generateLink response:', Object.keys(data || {}));
    return res.status(500).json({ error: 'Could not generate reset link.' });
  }

  const sendResult = await sendPasswordResetEmail(email, actionLink);
  if (!sendResult.ok) {
    return res.status(500).json({ error: sendResult.error || 'Email failed to send.' });
  }

  res.json({ ok: true });
});

module.exports = router;
