const rateLimit = require('express-rate-limit');

function emailOrRequestKey(req) {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (email) return email;
  return String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown')
    .split(',')[0]
    .trim()
    .toLowerCase();
}

/**
 * Strict rate limiter for sensitive authentication endpoints (signup, login tracking)
 * Limits: 5 requests per 15 minutes per IP
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again later.' },
});

/**
 * Rate limiter for the waitlist form
 * Limits: 3 requests per hour per IP
 */
const waitlistLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many submissions. Please try again later.' },
});

/**
 * Rate limiter for forgot-password (prevents abuse)
 * Limits: 3 requests per hour per email
 */
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  keyGenerator: emailOrRequestKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: true, ok: true },
});

/**
 * Rate limiter for resend verification email
 * Limits: 3 requests per hour per email
 */
const resendVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  keyGenerator: emailOrRequestKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: true, message: 'If that email is unverified, we sent a new verification link.' },
});

module.exports = {
  authLimiter,
  waitlistLimiter,
  forgotPasswordLimiter,
  resendVerificationLimiter,
};
