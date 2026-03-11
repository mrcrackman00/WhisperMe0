/**
 * Auth routes — session check and optional proxy to Supabase Auth.
 * Actual sign-up/sign-in with email, Google, Apple is done via Supabase client on the frontend.
 * These endpoints help the backend know the current user and track events.
 */
const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { trackEvent, EVENTS } = require('../utils/analytics');
const { sendWelcomeEmail } = require('../services/emailService');
const { authLimiter } = require('../middleware/rateLimiters');

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

module.exports = router;
