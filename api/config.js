/**
 * Vercel Serverless Function: returns public config from environment variables.
 * Vercel → Settings → Environment Variables:
 *   API_BASE_URL = https://your-backend.example.com
 *   RECAPTCHA_SITE_KEY = your reCAPTCHA v3 site key (public)
 */
module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=60');
  const apiUrl = (process.env.API_BASE_URL || '').trim() || 'https://whisperme0-production.up.railway.app';
  const recaptchaSiteKey = (process.env.RECAPTCHA_SITE_KEY || '').trim();
  res.status(200).json({
    API_BASE_URL: apiUrl,
    RECAPTCHA_SITE_KEY: recaptchaSiteKey,
  });
};
