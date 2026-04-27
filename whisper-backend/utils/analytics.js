/**
 * Analytics — store events in Supabase `events` table.
 */
const { supabaseAdmin } = require('../config/supabase');

const EVENTS = {
  SIGNUP: 'signup',
  LOGIN: 'login',
  WAITLIST_JOIN: 'waitlist_join',
};

/**
 * Track an event.
 * @param {string} eventType - One of EVENTS
 * @param {string|null} userId - auth user id or null for anonymous
 * @param {object} [metadata] - optional extra data (e.g. mood, source)
 */
async function trackEvent(eventType, userId = null, metadata = {}) {
  try {
    const { error } = await supabaseAdmin
      .from('events')
      .insert({
        event_type: eventType,
        user_id: userId,
        metadata: Object.keys(metadata).length ? metadata : null,
      });
    if (error) console.error('Analytics insert error:', error.message);
  } catch (err) {
    console.error('Analytics trackEvent error:', err.message);
  }
}

module.exports = { trackEvent, EVENTS };
