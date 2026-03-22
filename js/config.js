/**
 * API configuration for WhisperMe frontend.
 * - Local: http://localhost:3000
 * - Production: https://whisperme0-production.up.railway.app
 * - Override: Set window.__API_BASE_URL__ before this script loads to force a URL.
 * - reCAPTCHA v3: Set window.__RECAPTCHA_SITE_KEY__ before this script, or RECAPTCHA_SITE_KEY on Vercel (/api/config).
 * - Debug: Add ?debug to URL to enable console logging.
 */
(function() {
  var PRODUCTION_API_URL = 'https://whisperme0-production.up.railway.app';
  var isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  window.API_BASE_URL = window.__API_BASE_URL__ || (isLocal ? 'http://localhost:3000' : PRODUCTION_API_URL);
  window.RECAPTCHA_SITE_KEY = (window.__RECAPTCHA_SITE_KEY__ && String(window.__RECAPTCHA_SITE_KEY__).trim()) || '';

  window._wmDebug = !!(window.location.search && window.location.search.includes('debug'));
  window._wmLog = function(msg, data) {
    if (window._wmDebug && console && console.log) {
      console.log('[WM]', msg, data !== undefined ? data : '');
    }
  };

  // Preload reCAPTCHA v3 as soon as site key is known (so first click isn't racing the script).
  function wmPreloadRecaptcha(siteKey) {
    if (!siteKey || document.querySelector('script[data-wm-recaptcha="1"]')) return;
    var s = document.createElement('script');
    s.src = 'https://www.google.com/recaptcha/api.js?render=' + encodeURIComponent(siteKey);
    s.async = true;
    s.defer = true;
    s.setAttribute('data-wm-recaptcha', '1');
    document.head.appendChild(s);
  }

  // Production (Vercel + custom domain): optional API URL from serverless /api/config
  if (!isLocal) {
    fetch('/api/config').then(function(r) { return r.ok ? r.json() : null; }).then(function(d) {
      if (d && d.API_BASE_URL && String(d.API_BASE_URL).trim()) {
        window.API_BASE_URL = String(d.API_BASE_URL).trim();
      }
      if (d && d.RECAPTCHA_SITE_KEY && String(d.RECAPTCHA_SITE_KEY).trim()) {
        window.RECAPTCHA_SITE_KEY = String(d.RECAPTCHA_SITE_KEY).trim();
        wmPreloadRecaptcha(window.RECAPTCHA_SITE_KEY);
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
    var fetchOpts = Object.assign({ credentials: 'omit', mode: 'cors' }, options || {});

    async function doFetch(base) {
      var url = String(base || '').replace(/\/$/, '') + pathNorm;
      if (window._wmLog) window._wmLog('API request', path);
      var res = await fetch(url, fetchOpts);
      var data = await res.json().catch(function() { return {}; });
      if (window._wmLog) window._wmLog('API response', path + ' ' + res.status);
      return { ok: res.ok, status: res.status, data: data };
    }

    /** Mobile / flaky networks often drop the first cross-origin request to Railway; 502/503 during cold start. */
    function isTransientFailure(result, err) {
      if (err) return true;
      if (!result || !result.ok) {
        var s = result && result.status;
        if (s >= 502 && s <= 504) return true;
      }
      return false;
    }

    async function fetchWithRetries(baseGetter) {
      var useRetries = !isLocal || !isLocalDevBase(baseGetter());
      var maxAttempts = useRetries ? 3 : 1;
      var delays = [0, 650, 1600];
      var lastResult = null;
      var lastErr = null;
      for (var i = 0; i < maxAttempts; i++) {
        if (i > 0) {
          await new Promise(function(r) { setTimeout(r, delays[i] || 2000); });
        }
        try {
          lastResult = await doFetch(baseGetter());
          lastErr = null;
          if (lastResult.ok || !isTransientFailure(lastResult, null)) {
            return lastResult;
          }
        } catch (e) {
          lastErr = e;
          lastResult = null;
          if (!isTransientFailure(null, e) || i === maxAttempts - 1) {
            break;
          }
        }
      }
      if (lastResult) return lastResult;
      throw lastErr || new Error('Network error');
    }

    try {
      return await fetchWithRetries(function() { return window.getApiBase(); });
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
