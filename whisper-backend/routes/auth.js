/**
 * Auth routes — session check and optional proxy to Supabase Auth.
 * Actual sign-up/sign-in with email, Google, Apple is done via Supabase client on the frontend.
 * These endpoints help the backend know the current user and track events.
 */
const express = require('express');
const { supabaseAnon, supabaseAdmin } = require('../config/supabase');
const { authMiddleware } = require('../middleware/authMiddleware');
const { trackEvent, EVENTS } = require('../utils/analytics');
const { sendWelcomeEmail, sendPasswordResetEmailAny, sendVerificationEmailViaResend } = require('../services/emailService');
const { authLimiter, forgotPasswordLimiter, resendVerificationLimiter } = require('../middleware/rateLimiters');

const router = express.Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
const PASSWORD_RE = /^(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const PASSWORD_MSG = 'Password must be at least 8 characters and include 1 number and 1 special character.';
const GENERIC_RESET_OK = { success: true, ok: true, message: 'If an account exists, a reset link has been sent.' };

function cleanText(value, max = 200) {
  return String(value || '')
    .normalize('NFKC')
    .replace(/[<>]/g, '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, max);
}

function cleanEmail(value) {
  return String(value || '').normalize('NFKC').trim().toLowerCase().slice(0, 320);
}

function getAllowedRedirectOrigins() {
  const configured = process.env.AUTH_REDIRECT_ALLOWLIST || process.env.FRONTEND_URL || 'https://www.whisperme.co,https://whisperme.co';
  const origins = configured
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);
  return origins.length ? origins : ['https://www.whisperme.co', 'https://whisperme.co'];
}

function getDefaultRedirect() {
  return getAllowedRedirectOrigins()[0] || 'https://www.whisperme.co';
}

function getSafeRedirect(rawRedirect) {
  const fallback = getDefaultRedirect().replace(/\/$/, '') + '/';
  if (!rawRedirect || typeof rawRedirect !== 'string') return fallback;
  try {
    const parsed = new URL(rawRedirect);
    const allowed = getAllowedRedirectOrigins();
    if (!allowed.includes(parsed.origin)) return fallback;
    parsed.hash = '';
    ['access_token', 'refresh_token', 'token_hash', 'code', 'type', 'error', 'error_description'].forEach((key) => {
      parsed.searchParams.delete(key);
    });
    return parsed.toString();
  } catch {
    return fallback;
  }
}

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
 * POST /api/auth/login — rate-limited email/password login proxy.
 * Body: { email, password }
 */
router.post('/login', authLimiter, async (req, res) => {
  const sendJson = (status, body) => {
    res.setHeader('Content-Type', 'application/json');
    res.status(status).json(body);
  };
  try {
    const email = cleanEmail(req.body?.email);
    const password = req.body?.password;

    if (!email || !EMAIL_RE.test(email) || !password || typeof password !== 'string') {
      return sendJson(400, { error: 'Invalid email or password.' });
    }
    if (!supabaseAnon) {
      console.error('[login] Supabase anon client not configured');
      return sendJson(503, { error: 'Auth not configured.' });
    }

    const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });
    if (error) {
      console.warn('[login] Supabase signIn error:', error.code || '', error.message || '');
      return sendJson(400, { error: 'Invalid email or password.' });
    }

    const token = data?.session?.access_token;
    if (data?.user?.id) {
      Promise.resolve()
        .then(() => trackEvent(EVENTS.LOGIN, data.user.id, {}))
        .catch((trackErr) => console.error('[login] trackEvent error:', trackErr));
    }
    return sendJson(200, { session: data.session, user: data.user, access_token: token });
  } catch (err) {
    console.error('[login] Unexpected error:', err.message, err.stack);
    return sendJson(500, { error: 'Something went wrong. Please try again.' });
  }
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
 * POST /api/auth/signup — Supabase signUp.
 * Body: { email, password, display_name?, full_name?, mood? }
 * Returns: { session?, user?, error? } — JSON only, never crashes.
 */
router.post('/signup', authLimiter, async (req, res) => {
  const sendJson = (status, body) => {
    res.setHeader('Content-Type', 'application/json');
    res.status(status).json(body);
  };
  try {
    const email = cleanEmail(req.body?.email);
    const password = req.body?.password;
    const displayName = cleanText(req.body?.display_name, 80);
    const fullName = cleanText(req.body?.full_name, 120);
    const mood = cleanText(req.body?.mood, 100);

    if (!email || !EMAIL_RE.test(email)) {
      return sendJson(400, { error: 'Please enter a valid email address.' });
    }
    if (!password || typeof password !== 'string') {
      return sendJson(400, { error: 'Password is required.' });
    }
    if (!PASSWORD_RE.test(password)) {
      return sendJson(400, { error: PASSWORD_MSG });
    }

    if (!supabaseAnon) {
      console.error('[signup] Supabase anon client not configured');
      return sendJson(503, { error: 'Auth not configured.' });
    }

    const { data, error } = await supabaseAnon.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, display_name: displayName || fullName, mood },
        emailRedirectTo: getDefaultRedirect().replace(/\/$/, '') + '/',
      },
    });

    const isEmailSendError = (error && (error.message || '').toLowerCase().includes('error sending') && (error.message || '').toLowerCase().includes('confirmation'));

    if (error && !isEmailSendError) {
      const msg = (error.message || '').toLowerCase();
      let userMsg = error.message || 'Sign up failed.';
      if (msg.includes('rate') || msg.includes('limit') || msg.includes('429')) {
        userMsg = 'Too many attempts. Please try again later.';
      } else if (msg.includes('already registered') || msg.includes('user already')) {
        userMsg = 'An account with this email already exists. Try signing in.';
      }
      console.error('[signup] Supabase signUp error:', error.code, error.message);
      return sendJson(400, { error: userMsg });
    }

    if (isEmailSendError) {
      console.warn('[signup] Supabase email failed, sending via our Gmail/Resend fallback');
    }

    const token = data?.session?.access_token;
    if (token) {
      return sendJson(200, { session: data.session, user: data.user, access_token: token });
    }
    // User created but needs email confirmation — send via our Gmail/Resend (Supabase SMTP often fails)
    const redirectTo = getDefaultRedirect();
    try {
      const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
        type: 'signup',
        email,
        options: { redirectTo: redirectTo ? redirectTo.replace(/\/$/, '') + '/' : undefined },
      });
      const link = linkData?.properties?.action_link || linkData?.action_link;
      if (!linkErr && link) {
        const sent = await sendVerificationEmailViaResend(email, link);
        if (sent.ok) {
          console.log('[signup] Verification email sent to', email);
        } else {
          console.warn('[signup] Verification email failed:', sent.error);
        }
      } else if (linkErr) {
        console.warn('[signup] generateLink error:', linkErr.message);
      }
    } catch (e) {
      console.warn('[signup] Verification email error:', e.message);
    }
    return sendJson(200, { ok: true, message: 'Please check your email to verify your account.', user: data?.user });
  } catch (err) {
    console.error('[signup] Unexpected error:', err.message, err.stack);
    return sendJson(500, { error: 'Something went wrong. Please try again.' });
  }
});

/**
 * POST /api/auth/resend-verification — resend verification email for unconfirmed signup.
 * Body: { email }
 * Always returns success (for security, don't reveal if user exists).
 */
router.post('/resend-verification', resendVerificationLimiter, async (req, res) => {
  const sendJson = (status, body) => {
    res.setHeader('Content-Type', 'application/json');
    res.status(status).json(body);
  };
  try {
    const email = cleanEmail(req.body?.email);
    if (!email || !EMAIL_RE.test(email)) {
      return sendJson(400, { error: 'Please enter a valid email address.' });
    }
    if (!supabaseAdmin) {
      return sendJson(503, { error: 'Service temporarily unavailable.' });
    }
    const redirectTo = getDefaultRedirect();
    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email,
      options: { redirectTo: redirectTo ? redirectTo.replace(/\/$/, '') + '/' : undefined },
    });
    const link = linkData?.properties?.action_link || linkData?.action_link;
    if (linkErr || !link) {
      return sendJson(200, { ok: true, message: 'If that email is unverified, we sent a new verification link. Check your inbox and spam folder.' });
    }
    const sent = await sendVerificationEmailViaResend(email, link);
    return sendJson(200, { ok: true, message: sent.ok ? 'Verification email sent. Check inbox and spam folder.' : 'If that email is unverified, we tried to send a link. Check spam folder.' });
  } catch (err) {
    console.error('[resend-verification] Error:', err.message);
    return sendJson(200, { ok: true, message: 'If that email is unverified, check your spam folder or try again later.' });
  }
});

/**
 * POST /api/auth/forgot-password — uses supabase.auth.resetPasswordForEmail().
 * Body: { email, redirectTo? }
 * Always returns JSON. For security, returns success even if user not found.
 */
router.post('/forgot-password', forgotPasswordLimiter, async (req, res) => {
  const sendJson = (status, body) => {
    res.setHeader('Content-Type', 'application/json');
    res.status(status).json(body);
  };
  try {
    const email = cleanEmail(req.body?.email);
    if (!email || !EMAIL_RE.test(email)) {
      return sendJson(400, { error: 'Please enter a valid email address.' });
    }

    const finalRedirect = getSafeRedirect(req.body?.redirectTo);

    if (!supabaseAnon) {
      console.error('[forgot-password] Supabase anon client not configured');
      return sendJson(503, { error: 'Auth not configured.' });
    }

    let { data, error } = await supabaseAnon.auth.resetPasswordForEmail(email, {
      redirectTo: finalRedirect,
    });

    if (error) {
      const msg = (error.message || '').toLowerCase();
      if (msg.includes('user not found') || msg.includes('email not found') || msg.includes('user with this email not found')) {
        return sendJson(200, GENERIC_RESET_OK);
      }
      // Supabase's built-in email often fails ("Error sending recovery email") when SMTP isn't configured.
      // Fallback: generate link via admin API and send via our own email (Resend/Gmail).
      const isEmailDeliveryError = msg.includes('error sending') || msg.includes('recovery email') || msg.includes('sending recovery') || msg.includes('failed to send');
      if (isEmailDeliveryError) {
        try {
          const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
            type: 'recovery',
            email,
            options: { redirectTo: finalRedirect },
          });
          if (linkErr) {
            if (linkErr.message?.toLowerCase().includes('user not found')) {
              return sendJson(200, GENERIC_RESET_OK);
            }
            console.error('[forgot-password] generateLink error:', linkErr.message);
            return sendJson(200, GENERIC_RESET_OK);
          }
          const actionLink = linkData?.properties?.action_link || linkData?.action_link;
          if (!actionLink) {
            console.error('[forgot-password] generateLink missing action_link:', Object.keys(linkData || {}));
            return sendJson(200, GENERIC_RESET_OK);
          }
          const sendResult = await sendPasswordResetEmailAny(email, actionLink);
          if (sendResult.ok) {
            return sendJson(200, GENERIC_RESET_OK);
          }
          console.error('[forgot-password] Custom email failed:', sendResult.error);
          return sendJson(200, GENERIC_RESET_OK);
        } catch (fallbackErr) {
          console.error('[forgot-password] Fallback error:', fallbackErr.message);
          return sendJson(200, GENERIC_RESET_OK);
        }
      }
      console.error('[forgot-password] resetPasswordForEmail error:', error.message);
      return sendJson(200, GENERIC_RESET_OK);
    }

    return sendJson(200, GENERIC_RESET_OK);
  } catch (err) {
    const errMsg = (err?.message || String(err)).toLowerCase();
    const isHtml = errMsg.includes('<') || errMsg.includes('html');
    console.error('[forgot-password] Unexpected error:', isHtml ? 'Supabase returned non-JSON (possibly HTML)' : err.message || err, err.stack);
    return sendJson(200, GENERIC_RESET_OK);
  }
});

module.exports = router;
