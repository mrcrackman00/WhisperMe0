/**
 * Admin API — users, waitlist list, analytics. Protected by auth + requireAdmin.
 */
const express = require('express');
const rateLimit = require('express-rate-limit');
const { authMiddleware, requireAdmin } = require('../middleware/authMiddleware');
const { supabaseAdmin } = require('../config/supabase');

const router = express.Router();

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many admin requests. Try again later.' },
});
router.use(adminLimiter);
router.use(authMiddleware);
router.use(requireAdmin);

/** GET /api/admin/users — total users (profiles) + recent signups. */
router.get('/users', async (req, res) => {
  try {
    const { count: totalUsers, error: countErr } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    if (countErr) throw countErr;

    const { data: recent, error: recentErr } = await supabaseAdmin
      .from('profiles')
      .select('id, display_name, mood, created_at')
      .order('created_at', { ascending: false })
      .limit(20);
    if (recentErr) throw recentErr;

    res.json({
      total_users: totalUsers ?? 0,
      recent_signups: recent ?? [],
    });
  } catch (err) {
    console.error('Admin users error:', err);
    res.status(500).json({ error: 'Could not fetch users' });
  }
});

/** GET /api/admin/waitlist — list and count waitlist entries. */
router.get('/waitlist', async (req, res) => {
  try {
    const { data: list, error } = await supabaseAdmin
      .from('waitlist')
      .select('id, name, email, mood, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;

    res.json({
      waitlist_count: (list || []).length,
      entries: list || [],
    });
  } catch (err) {
    console.error('Admin waitlist error:', err);
    res.status(500).json({ error: 'Could not fetch waitlist' });
  }
});

/** GET /api/admin/analytics — signup stats per day, mood stats, waitlist count. */
router.get('/analytics', async (req, res) => {
  try {
    const { count: waitlistCount, error: wErr } = await supabaseAdmin
      .from('waitlist')
      .select('*', { count: 'exact', head: true });
    if (wErr) throw wErr;

    const { count: totalUsers } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('mood, created_at');

    const moodStats = {};
    const signupsByDay = {};
    const now = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      signupsByDay[key] = 0;
    }
    (profiles || []).forEach((p) => {
      const mood = (p.mood || 'unknown').trim() || 'unknown';
      moodStats[mood] = (moodStats[mood] || 0) + 1;
      const day = (p.created_at || '').slice(0, 10);
      if (signupsByDay[day] !== undefined) signupsByDay[day]++;
    });

    const signup_stats_per_day = Object.entries(signupsByDay)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }));

    res.json({
      total_users: totalUsers ?? 0,
      waitlist_count: waitlistCount ?? 0,
      signup_stats_per_day,
      mood_statistics: moodStats,
    });
  } catch (err) {
    console.error('Admin analytics error:', err);
    res.status(500).json({ error: 'Could not fetch analytics' });
  }
});

module.exports = router;
