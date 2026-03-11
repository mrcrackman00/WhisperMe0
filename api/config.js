/**
 * Vercel Serverless Function: returns API config from environment variables.
 * In Vercel Dashboard → Settings → Environment Variables, set:
 *   API_BASE_URL = https://your-backend.onrender.com
 */
module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=60');
  const apiUrl = (process.env.API_BASE_URL || '').trim() || 'https://whisperme0-production.up.railway.app';
  res.status(200).json({ API_BASE_URL: apiUrl });
};
