/**
 * Supabase client for server-side use (service role for admin operations).
 * Never expose service role key to the client.
 */
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing SUPABASE_URL');
}

/** Service role client — full access; use only on server */
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
  auth: { persistSession: false },
});

/** Optional: anon client for RLS-tested operations */
const supabaseAnon = supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } })
  : supabaseAdmin;

module.exports = {
  supabaseAdmin,
  supabaseAnon,
};
