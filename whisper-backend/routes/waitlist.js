/**
 * Waitlist API — verify email before final waitlist insert.
 */
const crypto = require('crypto');
const express = require('express');
const { supabaseAdmin } = require('../config/supabase');
const { trackEvent, EVENTS } = require('../utils/analytics');
const { sendWaitlistVerifyEmail } = require('../services/emailService');
const { waitlistLimiter } = require('../middleware/rateLimiters');
const { body, validationResult } = require('express-validator');
const { verifyRecaptchaV3 } = require('../utils/recaptcha');

const router = express.Router();

const EMAIL_MAX = 320;
const NAME_MAX = 200;
const MOOD_MAX = 100;
const GENERIC_WAITLIST_OK = {
  success: true,
  message: 'If your email is valid, check your inbox to confirm your waitlist spot.',
};

function cleanText(value, maxLen) {
  return String(value || '')
    .normalize('NFKC')
    .replace(/[<>]/g, '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLen);
}

function cleanEmail(value) {
  return String(value || '').normalize('NFKC').trim().toLowerCase().slice(0, EMAIL_MAX);
}

function isValidEmail(email) {
  return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email || '') && email.length <= EMAIL_MAX;
}

function getSiteUrl() {
  const fromEnv = (process.env.PUBLIC_SITE_URL || process.env.FRONTEND_URL || 'https://www.whisperme.co')
    .split(',')[0]
    .trim()
    .replace(/\/$/, '');
  return fromEnv || 'https://www.whisperme.co';
}

function getApiUrl(req) {
  const fromEnv = (process.env.API_URL || process.env.PUBLIC_API_URL || '')
    .trim()
    .replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  return `${req.protocol}://${req.get('host')}`;
}

/** POST /api/waitlist — create a short-lived pending verification email. */
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
      return sendJson(200, GENERIC_WAITLIST_OK);
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

    const name = cleanText(req.body.name, NAME_MAX) || null;
    const email = cleanEmail(req.body.email);
    const mood = cleanText(req.body.mood, MOOD_MAX) || null;

    if (!isValidEmail(email)) {
      return sendJson(400, { error: 'Invalid email address' });
    }

    const { data: existing } = await supabaseAdmin
      .from('waitlist')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      return sendJson(200, GENERIC_WAITLIST_OK);
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const { error: pendingErr } = await supabaseAdmin
      .from('waitlist_pending')
      .upsert(
        { email, name, mood, token_hash: tokenHash, expires_at: expiresAt },
        { onConflict: 'email' }
      );

    if (pendingErr) {
      const msg = (pendingErr.message || '').toLowerCase();
      const isHtml = msg.includes('<') || msg.includes('html');
      console.error('[waitlist] Pending insert error:', isHtml ? 'Supabase returned non-JSON' : pendingErr.message, 'code:', pendingErr.code, 'details:', pendingErr.details);
      return sendJson(500, { error: 'Could not join waitlist. Try again later.' });
    }

    const verifyLink = `${getApiUrl(req)}/api/waitlist/verify/${token}`;
    setImmediate(() => {
      Promise.resolve()
        .then(() => sendWaitlistVerifyEmail(email, name || 'there', verifyLink))
        .then((result) => {
          if (result && result.ok) {
            console.log('[waitlist] verification email sent to', email, 'via', result.via || 'unknown', 'id=', result.id || '');
          } else {
            console.warn('[waitlist] verification email NOT sent to', email, '-', (result && (result.error || (result.skipped ? 'email not configured' : 'unknown'))) || 'no result');
          }
        })
        .catch((mailErr) => console.error('[waitlist] sendWaitlistVerifyEmail error:', mailErr));
    });

    return sendJson(200, GENERIC_WAITLIST_OK);
  } catch (err) {
    console.error('[waitlist] Unexpected error:', err.message || err, err.stack);
    return sendJson(500, { error: 'Could not join waitlist. Try again later.' });
  }
});

/** GET /api/waitlist/verify/:token — confirm a pending waitlist entry. */
router.get('/verify/:token', async (req, res) => {
  const redirectBase = getSiteUrl();
  try {
    const token = String(req.params.token || '').trim();
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      return res.redirect(`${redirectBase}/?waitlist=expired`);
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const { data: pending, error: selectErr } = await supabaseAdmin
      .from('waitlist_pending')
      .select('email,name,mood,expires_at')
      .eq('token_hash', tokenHash)
      .maybeSingle();

    if (selectErr) {
      console.error('[waitlist] Verify select error:', selectErr.message);
      return res.redirect(`${redirectBase}/?waitlist=error`);
    }

    if (!pending || new Date(pending.expires_at).getTime() < Date.now()) {
      return res.redirect(`${redirectBase}/?waitlist=expired`);
    }

    const { error: upsertErr } = await supabaseAdmin
      .from('waitlist')
      .upsert(
        { email: pending.email, name: pending.name, mood: pending.mood },
        { onConflict: 'email' }
      );

    if (upsertErr) {
      console.error('[waitlist] Verify upsert error:', upsertErr.message);
      return res.redirect(`${redirectBase}/?waitlist=error`);
    }

    await supabaseAdmin.from('waitlist_pending').delete().eq('email', pending.email);
    Promise.resolve()
      .then(() => trackEvent(EVENTS.WAITLIST_JOIN, null, { email: pending.email, mood: pending.mood }))
      .catch((trackErr) => console.error('[waitlist] trackEvent error:', trackErr));

    return res.redirect(`${redirectBase}/?waitlist=confirmed`);
  } catch (err) {
    console.error('[waitlist] Verify unexpected error:', err.message || err);
    return res.redirect(`${redirectBase}/?waitlist=error`);
  }
});

module.exports = router;
