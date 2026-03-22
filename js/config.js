/**
 * API configuration for WhisperMe frontend.
 * - Local: http://localhost:3000
 * - Production: https://whisperme0-production.up.railway.app
 * - Override: Set window.__API_BASE_URL__ before this script loads to force a URL.
 * - Debug: Add ?debug to URL to enable console logging.
 */
(function() {
  var PRODUCTION_API_URL = 'https://whisperme0-production.up.railway.app';
  var isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  window.API_BASE_URL = window.__API_BASE_URL__ || (isLocal ? 'http://localhost:3000' : PRODUCTION_API_URL);

  window._wmDebug = !!(window.location.search && window.location.search.includes('debug'));
  window._wmLog = function(msg, data) {
    if (window._wmDebug && console && console.log) {
      console.log('[WM]', msg, data !== undefined ? data : '');
    }
  };

  // On Vercel, optionally override from env (only if non-empty)
  if (!isLocal && window.location.hostname.includes('vercel.app')) {
    fetch('/api/config').then(function(r) { return r.ok ? r.json() : null; }).then(function(d) {
      if (d && d.API_BASE_URL && String(d.API_BASE_URL).trim()) {
        window.API_BASE_URL = String(d.API_BASE_URL).trim();
      }
    }).catch(function() {});
  }

  window.getApiBase = function() {
    var b = (window.API_BASE_URL && String(window.API_BASE_URL).trim()) || '';
    if (b) return b.replace(/\/$/, '');
    return isLocal ? 'http://localhost:3000' : PRODUCTION_API_URL;
  };

  function isLocalDevBase(base) {
    return isLocal && /localhost|127\.0\.0\.1/.test(String(base || ''));
  }

  window.apiFetch = async function(path, options) {
    var pathNorm = path.startsWith('/') ? path : '/' + path;

    async function doFetch(base) {
      var url = String(base || '').replace(/\/$/, '') + pathNorm;
      if (window._wmLog) window._wmLog('API request', path);
      var res = await fetch(url, options || {});
      var data = await res.json().catch(function() { return {}; });
      if (window._wmLog) window._wmLog('API response', path + ' ' + res.status);
      return { ok: res.ok, status: res.status, data: data };
    }

    try {
      return await doFetch(window.getApiBase());
    } catch (err) {
      /* Opening index.html from localhost without whisper-backend: connection refused */
      if (isLocalDevBase(window.getApiBase())) {
        try {
          if (!window._wmLocalApiFallbackWarned) {
            window._wmLocalApiFallbackWarned = true;
            console.warn(
              '[WhisperMe] Local API (port 3000) not reachable — using production API. Run `npm start` in whisper-backend/ for local API.'
            );
          }
          window.API_BASE_URL = PRODUCTION_API_URL;
          return await doFetch(PRODUCTION_API_URL);
        } catch (err2) {
          console.error('API fetch error:', err2);
          if (window._wmLog) window._wmLog('API error', path + ' ' + (err2.message || ''));
          return { ok: false, status: 0, data: { error: err2.message || 'Network error' } };
        }
      }
      console.error('API fetch error:', err);
      if (window._wmLog) window._wmLog('API error', path + ' ' + (err.message || ''));
      return { ok: false, status: 0, data: { error: err.message || 'Network error' } };
    }
  };
})();
