/**
 * Send a single launch-announcement preview email to a verified address.
 * Does NOT touch the waitlist DB. Use this to review the design in your inbox
 * before running the bulk script.
 *
 * Usage:
 *   node whisper-backend/scripts/test-launch-announcement.js <email> [name]
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { sendLaunchAnnouncement } = require('../services/emailService');

(async () => {
  const to = (process.argv[2] || '').trim();
  const name = (process.argv[3] || 'Avinash').trim();
  if (!to) {
    console.error('Usage: node whisper-backend/scripts/test-launch-announcement.js <email> [name]');
    process.exit(1);
  }
  console.log('[announcement-test] sending preview to', to, 'as', name, '...');
  const result = await sendLaunchAnnouncement(to, name);
  console.log('[announcement-test] result:', JSON.stringify(result));
  process.exit(result.ok ? 0 : 1);
})();
