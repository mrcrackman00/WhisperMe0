/**
 * Waitlist API — POST /api/waitlist to join; prevent duplicates; send confirmation email.
 */
const express = require('express');
const { supabaseAdmin } = require('../config/supabase');
const { trackEvent, EVENTS } = require('../utils/analytics');
const { sendWaitlistConfirmation } = require('../services/emailService');
const { waitlistLimiter } = require('../middleware/rateLimiters');
const { body, validationResult } = require('express-validator');
const { verifyRecaptchaV3 } = require('../utils/recaptcha');

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

/** POST /api/waitlist — add name, email, mood; prevent duplicates. Always returns JSON. */
router.post('/', waitlistLimiter, [
  body('email').isEmail().withMessage('Invalid email address').isLength({ max: EMAIL_MAX }).normalizeEmail(),
  body('name').optional({ checkFalsy: true }).isString().trim().isLength({ max: NAME_MAX }).escape(),
  body('mood').optional({ checkFalsy: true }).isString().trim().isLength({ max: MOOD_MAX }).escape(),
  body('a_password').optional(), // Honeypot field for bot protection
  body('recaptchaToken').optional().isString().isLength({ max: 8192 }),
], async (req, res) => {
  const sendJson = (status, body) => {
    res.setHeader('Content-Type', 'application/json');
    res.status(status).json(body);
  };
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendJson(400, { error: errors.array()[0].msg });
    }

    if (req.body.a_password) {
      return sendJson(201, { success: true, message: "You're on the list! We'll notify you when WhisperMe launches." });
    }

    // Emergency: set WAITLIST_SKIP_RECAPTCHA=1 on Railway if reCAPTCHA blocks real users (spam risk — remove when fixed).
    const skipRecaptcha = process.env.WAITLIST_SKIP_RECAPTCHA === '1';

    const clientIp = req.ip || (req.headers['x-forwarded-for'] || '').toString().split(',')[0].trim() || '';
    let captcha = { ok: true, skipped: true };
    if (!skipRecaptcha) {
      captcha = await verifyRecaptchaV3(req.body.recaptchaToken, clientIp);
    }
    if (!captcha.skipped && !captcha.ok) {
      console.warn('[waitlist] recaptcha failed:', captcha.error, captcha.score != null ? 'score=' + captcha.score : '', captcha.codes ? 'codes=' + JSON.stringify(captcha.codes) : '');
      if (captcha.error === 'missing_token') {
        return sendJson(400, {
          error: 'Security check did not load. Disable ad blockers for this site or try another browser.',
          code: 'RECAPTCHA_MISSING',
        });
      }
      if (captcha.error === 'score_low') {
        return sendJson(400, {
          error: 'Security check was uncertain. Please try again in a few seconds.',
          code: 'RECAPTCHA_LOW_SCORE',
        });
      }
      return sendJson(400, {
        error: 'Security check failed. Confirm reCAPTCHA keys in Google Admin match whisperme.co and your Railway secret.',
        code: 'RECAPTCHA_INVALID',
      });
    }

    const name = (req.body.name || '').trim().slice(0, NAME_MAX) || null;
    const email = (req.body.email || '').trim().toLowerCase();
    const mood = (req.body.mood || '').trim().slice(0, MOOD_MAX) || null;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return sendJson(400, { error: 'Invalid email address' });
    }

    const { data: existing } = await supabaseAdmin
      .from('waitlist')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      return sendJson(409, { error: 'This email is already on the waitlist.', code: 'DUPLICATE_EMAIL' });
    }

    const { error: insertErr } = await supabaseAdmin
      .from('waitlist')
      .insert({ name, email, mood });

    if (insertErr) {
      if (insertErr.code === '23505') {
        return sendJson(409, { error: 'This email is already on the waitlist.', code: 'DUPLICATE_EMAIL' });
      }
      const msg = (insertErr.message || '').toLowerCase();
      const isHtml = msg.includes('<') || msg.includes('html');
      console.error('[waitlist] Insert error:', isHtml ? 'Supabase returned non-JSON' : insertErr.message, 'code:', insertErr.code, 'details:', insertErr.details);
      return sendJson(500, { error: 'Could not join waitlist. Try again later.' });
    }

    // Respond first; analytics + email run in the background so the user sees instant success
    // (Gmail SMTP / Resend can take 1–5s and shouldn't block the UI).
    setImmediate(() => {
      Promise.resolve()
        .then(() => trackEvent(EVENTS.WAITLIST_JOIN, null, { email, mood }))
        .catch((trackErr) => console.error('[waitlist] trackEvent error:', trackErr));
      Promise.resolve()
        .then(() => sendWaitlistConfirmation(email, name || 'there'))
        .then((result) => {
          if (result && result.ok) {
            console.log('[waitlist] confirmation email sent to', email, 'via', result.via || 'unknown', 'id=', result.id || '');
          } else {
            console.warn('[waitlist] confirmation email NOT sent to', email, '-', (result && (result.error || (result.skipped ? 'email not configured' : 'unknown'))) || 'no result');
          }
        })
        .catch((mailErr) => console.error('[waitlist] sendWaitlistConfirmation error:', mailErr));
    });

    return sendJson(201, { success: true, message: "You're on the list! We'll notify you when WhisperMe launches." });
  } catch (err) {
    console.error('[waitlist] Unexpected error:', err.message || err, err.stack);
    return sendJson(500, { error: 'Could not join waitlist. Try again later.' });
  }
});

module.exports = router;
