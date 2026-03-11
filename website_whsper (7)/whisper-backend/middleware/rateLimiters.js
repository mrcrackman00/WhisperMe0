const rateLimit = require('express-rate-limit');

/**
 * Strict rate limiter for sensitive authentication endpoints (signup, login tracking)
 * Limits: 5 requests per 15 minutes per IP
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts from this IP, please try again in 15 minutes.' },
});

/**
 * Strict rate limiter for the waitlist form
 * Limits: 3 requests per hour per IP
 */
const waitlistLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many waitlist submissions from this IP, please try again later.' },
});

module.exports = {
  authLimiter,
  waitlistLimiter
};
