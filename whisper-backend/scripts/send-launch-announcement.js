/**
 * Bulk-send the launch announcement email to everyone on the waitlist.
 *
 * Safety features:
 *   - --dry-run        Show recipients, send nothing. ALWAYS run this first.
 *   - --limit=N        Send to only the first N waitlist rows (oldest first).
 *   - --only=email     Send to a single email (must already be on the waitlist).
 *   - --force          Re-send even to emails already in .announcement-sent.log.
 *   - 250 ms throttle  Friendly to Resend rate limits and inbox providers.
 *   - Skip log         Successes are appended to whisper-backend/scripts/.announcement-sent.log.
 *                      Re-runs skip those addresses unless --force is used.
 *
 * Usage (from project root):
 *   node whisper-backend/scripts/send-launch-announcement.js --dry-run
 *   node whisper-backend/scripts/send-launch-announcement.js --limit=5
 *   node whisper-backend/scripts/send-launch-announcement.js --only=person@example.com
 *   node whisper-backend/scripts/send-launch-announcement.js              # send to all
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fs = require('fs');
const path = require('path');
const { supabaseAdmin } = require('../config/supabase');
const { sendLaunchAnnouncement } = require('../services/emailService');

const SKIP_LOG_PATH = path.join(__dirname, '.announcement-sent.log');
const THROTTLE_MS = 250;

const args = process.argv.slice(2);
const flag = (name) => args.includes('--' + name);
const value = (name) => {
  const a = args.find((x) => x.startsWith('--' + name + '='));
  return a ? a.split('=').slice(1).join('=') : null;
};

const isDryRun = flag('dry-run');
const isForce = flag('force');
const limit = value('limit') ? parseInt(value('limit'), 10) : null;
const onlyEmail = (value('only') || '').toLowerCase().trim();

function loadSkipList() {
  try {
    return new Set(
      fs.readFileSync(SKIP_LOG_PATH, 'utf8')
        .split('\n').map((l) => l.split('\t')[0].trim().toLowerCase())
        .filter(Boolean)
    );
  } catch { return new Set(); }
}

function appendSkipLog(email, id) {
  const line = `${email}\t${new Date().toISOString()}\t${id || ''}\n`;
  fs.appendFileSync(SKIP_LOG_PATH, line, 'utf8');
}

(async () => {
  console.log('--- WhisperMe launch announcement ---');
  console.log('mode:', isDryRun ? 'DRY-RUN (no send)' : 'LIVE (sending)');
  if (limit) console.log('limit:', limit);
  if (onlyEmail) console.log('only:', onlyEmail);
  if (isForce) console.log('force: re-sending to already-sent emails');

  const { data: rows, error } = await supabaseAdmin
    .from('waitlist')
    .select('id, name, email, mood, created_at')
    .order('created_at', { ascending: true });
  if (error) {
    console.error('[announcement] supabase error:', error.message || error);
    process.exit(1);
  }

  const all = (rows || []).filter((r) => r && r.email);
  const skipList = isForce ? new Set() : loadSkipList();

  let recipients = all;
  if (onlyEmail) recipients = recipients.filter((r) => r.email.toLowerCase() === onlyEmail);
  if (!isForce) recipients = recipients.filter((r) => !skipList.has(r.email.toLowerCase()));
  if (limit) recipients = recipients.slice(0, limit);

  console.log('total on waitlist:', all.length);
  console.log('will send to:    ', recipients.length, isForce ? '' : `(${skipList.size} skipped from log)`);
  console.log('');
  recipients.forEach((r, i) => {
    const idx = String(i + 1).padStart(3, ' ');
    console.log(`  ${idx}. ${r.email.padEnd(40)} ${(r.name || '').slice(0, 24)}`);
  });
  console.log('');

  if (recipients.length === 0) {
    console.log('[announcement] nothing to send.');
    process.exit(0);
  }

  if (isDryRun) {
    console.log('[announcement] DRY-RUN complete. Re-run without --dry-run to actually send.');
    process.exit(0);
  }

  let sent = 0;
  let failed = 0;
  const failures = [];
  for (let i = 0; i < recipients.length; i++) {
    const r = recipients[i];
    const idx = String(i + 1).padStart(3, ' ');
    try {
      const result = await sendLaunchAnnouncement(r.email, r.name || '');
      if (result.ok) {
        sent++;
        appendSkipLog(r.email.toLowerCase(), result.id);
        console.log(`  ${idx}. ✓  ${r.email}  (${result.id || ''})`);
      } else {
        failed++;
        failures.push({ email: r.email, error: result.error });
        console.log(`  ${idx}. ✗  ${r.email}  — ${result.error}`);
      }
    } catch (err) {
      failed++;
      failures.push({ email: r.email, error: err.message || String(err) });
      console.log(`  ${idx}. ✗  ${r.email}  — ${err.message || err}`);
    }
    if (i < recipients.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, THROTTLE_MS));
    }
  }

  console.log('');
  console.log(`[announcement] done.  sent=${sent}  failed=${failed}`);
  if (failures.length) {
    console.log('[announcement] failed addresses:');
    failures.forEach((f) => console.log(`  - ${f.email}: ${f.error}`));
  }
  process.exit(failed === 0 ? 0 : 2);
})();
