/**
 * Supabase client for server-side use (service role for admin operations).
 * Never expose service role key to the client.
 * Uses https://gkeemcezdbfplwhocwzx.supabase.co — never dashboard URL.
 */
const { createClient } = require('@supabase/supabase-js');

const DEFAULT_SUPABASE_URL = 'https://gkeemcezdbfplwhocwzx.supabase.co';

function normalizeSupabaseUrl(val) {
  const u = (val || '').trim().replace(/\/$/, '');
  if (!u) return null;
  if (u.indexOf('supabase.com/dashboard') !== -1) return DEFAULT_SUPABASE_URL;
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(u)) return DEFAULT_SUPABASE_URL;
  return u;
}

const supabaseUrl = normalizeSupabaseUrl(process.env.SUPABASE_URL) || DEFAULT_SUPABASE_URL;
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
