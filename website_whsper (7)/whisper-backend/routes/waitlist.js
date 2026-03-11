/**
 * Waitlist API — POST /api/waitlist to join; prevent duplicates; send confirmation email.
 */
const express = require('express');
const { supabaseAdmin } = require('../config/supabase');
const { trackEvent, EVENTS } = require('../utils/analytics');
const { sendWaitlistConfirmation } = require('../services/emailService');
const { waitlistLimiter } = require('../middleware/rateLimiters');
const { body, validationResult } = require('express-validator');

const router = express.Router();

const EMAIL_MAX = 320;
const NAME_MAX = 200;
const MOOD_MAX = 100;

function sanitize(str, maxLen) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLen);
}

function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  return trimmed.length <= EMAIL_MAX && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

/** POST /api/waitlist — add name, email, mood; prevent duplicates. */
router.post('/', waitlistLimiter, [
  body('email').isEmail().withMessage('Invalid email address').isLength({ max: EMAIL_MAX }).normalizeEmail(),
  body('name').optional({ checkFalsy: true }).isString().trim().isLength({ max: NAME_MAX }).escape(),
  body('mood').optional({ checkFalsy: true }).isString().trim().isLength({ max: MOOD_MAX }).escape(),
  body('a_password').optional() // Honeypot field for bot protection
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    // Bot protection: Reject if honeypot is filled, but fake success!
    if (req.body.a_password) {
      return res.status(201).json({ message: "You're on the list! We'll notify you when WhisperMe launches." });
    }

    const name = req.body.name || '';
    const email = req.body.email;
    const mood = req.body.mood || '';

    const { data: existing } = await supabaseAdmin
      .from('waitlist')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({
        error: 'This email is already on the waitlist.',
        code: 'DUPLICATE_EMAIL',
      });
    }

    const { error: insertErr } = await supabaseAdmin
      .from('waitlist')
      .insert({ name: name || null, email, mood: mood || null });

    if (insertErr) {
      if (insertErr.code === '23505') {
        return res.status(409).json({ error: 'This email is already on the waitlist.', code: 'DUPLICATE_EMAIL' });
      }
      console.error('Waitlist insert error:', insertErr);
      return res.status(500).json({ error: 'Could not join waitlist. Try again later.' });
    }

    await trackEvent(EVENTS.WAITLIST_JOIN, null, { email, mood: mood || null });
    await sendWaitlistConfirmation(email, name || 'there');

    res.status(201).json({
      message: "You're on the list! We'll notify you when WhisperMe launches.",
    });
  } catch (err) {
    console.error('Waitlist error:', err);
    res.status(500).json({ error: 'Something went wrong. Try again later.' });
  }
});

module.exports = router;
