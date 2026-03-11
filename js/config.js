/**
 * API configuration for WhisperMe frontend.
 * - Local: http://localhost:3000
 * - Production: Uses PRODUCTION_API_URL below, or fetches from /api/config (Vercel env: API_BASE_URL)
 * - Override: Set window.__API_BASE_URL__ before this script loads to force a URL.
 */
(function() {
  var PRODUCTION_API_URL = 'https://whisperme0.onrender.com';
  var isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  window.API_BASE_URL = window.__API_BASE_URL__ || (isLocal ? 'http://localhost:3000' : PRODUCTION_API_URL);

  // On Vercel, fetch /api/config to get API_BASE_URL from env vars (optional)
  if (!isLocal && window.location.hostname.includes('vercel.app')) {
    fetch('/api/config').then(function(r) { return r.ok ? r.json() : null; }).then(function(d) {
      if (d && d.API_BASE_URL) window.API_BASE_URL = d.API_BASE_URL;
    }).catch(function() {});
  }

  // Warm up Render backend on page load (wakes free-tier server so forms work faster)
  if (!isLocal) {
    var api = window.API_BASE_URL || PRODUCTION_API_URL;
    fetch(api + '/api/health', { method: 'GET' }).catch(function() {});
  }
})();
