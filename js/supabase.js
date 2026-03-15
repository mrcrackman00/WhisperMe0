/**
 * Single Supabase client for WhisperMe. Prevents "Multiple GoTrueClient instances" warning.
 * Depends on: config.js (getApiBase, apiFetch), Supabase CDN (window.supabase).
 * IMPORTANT: Uses project API URL (https://PROJECT_ID.supabase.co), never dashboard URL.
 */
(function() {
  var FALLBACK_CONFIG = {
    supabaseUrl: 'https://gkeemcezdbfplwhocwzx.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdrZWVtY2V6ZGJmcGx3aG9jd3p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNDk3NjYsImV4cCI6MjA4ODgyNTc2Nn0.vCdI5ZEPvTP98VOM_-s1WY_qLmTnVD8BQvHrpQPuCvw'
  };

  function isValidSupabaseUrl(url) {
    if (!url || typeof url !== 'string') return false;
    var u = url.trim().replace(/\/$/, '');
    if (u.indexOf('supabase.com/dashboard') !== -1) return false;
    if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(u)) return false;
    return true;
  }

  function getValidConfig(c) {
    var url = (c && c.supabaseUrl && String(c.supabaseUrl).trim()) || '';
    var key = (c && c.supabaseAnonKey && String(c.supabaseAnonKey).trim()) || '';
    if (!isValidSupabaseUrl(url) || !key) return FALLBACK_CONFIG;
    return { supabaseUrl: url.replace(/\/$/, ''), supabaseAnonKey: key };
  }

  var supabase = null;
  var supabasePromise = null;

  async function getSupabase() {
    if (supabase) return supabase;
    if (supabasePromise) return supabasePromise;

    supabasePromise = (async function() {
      if (!window.supabase || !window.supabase.createClient) {
        console.error('Supabase SDK not loaded');
        return null;
      }

      var c = FALLBACK_CONFIG;
      try {
        var result = await (window.apiFetch ? window.apiFetch('/api/public-config') : Promise.resolve({ ok: false, data: null }));
        if (result && result.ok && result.data) c = getValidConfig(result.data);
        else c = FALLBACK_CONFIG;
      } catch (e) {
        c = FALLBACK_CONFIG;
      }
      if (!c.supabaseUrl || !c.supabaseAnonKey) return null;

      supabase = window.supabase.createClient(c.supabaseUrl, c.supabaseAnonKey);

      try {
        supabase.auth.onAuthStateChange(function(event, session) {
          try {
            if (event === 'PASSWORD_RECOVERY') {
              if (typeof openSetNewPasswordModal === 'function') openSetNewPasswordModal();
              return;
            }
            if (event === 'SIGNED_IN' && session) {
              var email = session.user && session.user.email;
              var name = session.user && session.user.user_metadata && session.user.user_metadata.display_name;
              if (typeof updateNavUser === 'function') updateNavUser(email, name);
              if (window.location.hash.includes('access_token')) {
                history.replaceState(null, document.title, window.location.pathname + window.location.search);
              }
            }
          } catch (authErr) {
            console.error('[WM] Auth state change error:', authErr);
          }
        });
      } catch (listenerErr) {
        console.error('[WM] Supabase auth listener error:', listenerErr);
      }

      return supabase;
    })();

    return supabasePromise;
  }

  window._getSupabaseClient = function() {
    try {
      return getSupabase();
    } catch (err) {
      console.error('[WM] Supabase client error:', err);
      return Promise.resolve(null);
    }
  };
})();
