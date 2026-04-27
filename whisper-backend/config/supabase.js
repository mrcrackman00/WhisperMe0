/**
 * Supabase client for server-side use (service role for admin operations).
 * Never expose service role key to the client.
 * Set SUPABASE_URL in .env / Railway (never hardcode real project URLs in git).
 */
const { createClient } = require('@supabase/supabase-js');

function normalizeSupabaseUrl(val) {
  const u = (val || '').trim().replace(/\/$/, '');
  if (!u) return null;
  if (u.indexOf('supabase.com/dashboard') !== -1) return null;
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(u)) return null;
  return u;
}

const supabaseUrl = normalizeSupabaseUrl(process.env.SUPABASE_URL);
if (!supabaseUrl) {
  throw new Error(
    'Missing SUPABASE_URL. Copy whisper-backend/.env.example to .env and set your project URL (Settings → API in Supabase).'
  );
}
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim() || null;
const supabaseAnonKey = (process.env.SUPABASE_ANON_KEY || '').trim() || null;

if (!supabaseServiceKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
}


/** Service role client — full access; use only on server */
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

/** Optional: anon client for RLS-tested operations */
const supabaseAnon = supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } })
  : supabaseAdmin;

module.exports = {
  supabaseAdmin,
  supabaseAnon,
  supabaseUrl,
};
