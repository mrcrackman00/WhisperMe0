/**
 * Single Supabase client for WhisperMe. Prevents "Multiple GoTrueClient instances" warning.
 * Depends on: config.js (getApiBase, apiFetch), Supabase CDN (window.supabase).
 * IMPORTANT: Uses project API URL (https://PROJECT_ID.supabase.co), never dashboard URL.
 */
(function() {
  /** No real keys in git — loaded from backend GET /api/public-config (see docs/PUBLIC-REPO-SECRETS.md) */

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
    if (!isValidSupabaseUrl(url) || !key) return null;
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

      var raw = {};
      try {
        var result = await (window.apiFetch ? window.apiFetch('/api/public-config') : Promise.resolve({ ok: false, data: null }));
        if (result && result.ok && result.data) raw = result.data;
      } catch (e) {}
      var c = getValidConfig(raw);
      if (!c) return null;

      supabase = window.supabase.createClient(c.supabaseUrl, c.supabaseAnonKey, {
        auth: {
          detectSessionInUrl: true,
          persistSession: true,
          autoRefreshToken: true
        }
      });

      // Email confirm / magic link: Supabase may redirect with ?code= (PKCE) instead of #access_token
      try {
        var search = window.location.search || '';
        var hash = window.location.hash || '';
        if (hash.indexOf('error=') !== -1 && typeof window.handleSupabaseAuthUrlErrors === 'function') {
          window.handleSupabaseAuthUrlErrors();
        }
        var codeMatch = search.match(/[?&]code=([^&]+)/);
        if (codeMatch && codeMatch[1] && typeof supabase.auth.exchangeCodeForSession === 'function') {
          var authCode = decodeURIComponent(codeMatch[1].replace(/\+/g, ' '));
          var ex = await supabase.auth.exchangeCodeForSession(authCode);
          if (ex && ex.error && console && console.warn) console.warn('[WM] exchangeCodeForSession:', ex.error.message);
        }
        // Give SDK a tick to parse hash fragments after client creation
        if (hash.indexOf('access_token') !== -1 || hash.indexOf('refresh_token') !== -1) {
          await supabase.auth.getSession();
          await new Promise(function(r) { setTimeout(r, 50); });
          await supabase.auth.getSession();
        }
      } catch (urlAuthErr) {
        if (console && console.warn) console.warn('[WM] URL auth handling:', urlAuthErr && urlAuthErr.message);
      }

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
              var h = window.location.hash || '';
              var s = window.location.search || '';
              if (h.indexOf('access_token') !== -1 || s.indexOf('code=') !== -1) {
                history.replaceState(null, document.title, window.location.pathname);
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
