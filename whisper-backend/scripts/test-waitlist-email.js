/**
 * One-off smoke test: clears any existing waitlist rows for the verified Resend
 * test address, then sends a real email via the Resend API.
 *
 * Usage (from project root):
 *   node whisper-backend/scripts/test-waitlist-email.js <your-verified-email>
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { supabaseAdmin } = require('../config/supabase');
const { sendWaitlistConfirmation } = require('../services/emailService');

(async () => {
  const to = (process.argv[2] || '').trim();
  if (!to) {
    console.error('Usage: node whisper-backend/scripts/test-waitlist-email.js <email>');
    process.exit(1);
  }
  try {
    const { error: delErr } = await supabaseAdmin.from('waitlist').delete().eq('email', to.toLowerCase());
    if (delErr) console.warn('[smoke] delete warning:', delErr.message);
    else console.log('[smoke] cleared any existing waitlist row for', to);
  } catch (e) {
    console.warn('[smoke] delete exception:', e.message);
  }

  console.log('[smoke] sending Resend email to', to, '...');
  const result = await sendWaitlistConfirmation(to, 'Avinash');
  console.log('[smoke] result:', JSON.stringify(result));
  process.exit(result.ok ? 0 : 1);
})();
