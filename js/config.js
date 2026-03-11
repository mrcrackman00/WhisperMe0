/**
 * API configuration for WhisperMe frontend.
 * - Local: http://localhost:3000
 * - Production: https://whisperme0.onrender.com
 * - Override: Set window.__API_BASE_URL__ before this script loads to force a URL.
 */
(function() {
  var PRODUCTION_API_URL = 'https://whisperme0-production.up.railway.app';
  var isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  window.API_BASE_URL = window.__API_BASE_URL__ || (isLocal ? 'http://localhost:3000' : PRODUCTION_API_URL);

  // On Vercel, optionally override from env (only if non-empty)
  if (!isLocal && window.location.hostname.includes('vercel.app')) {
    fetch('/api/config').then(function(r) { return r.ok ? r.json() : null; }).then(function(d) {
      if (d && d.API_BASE_URL && String(d.API_BASE_URL).trim()) {
        window.API_BASE_URL = String(d.API_BASE_URL).trim();
      }
    }).catch(function() {});
  }
})();
