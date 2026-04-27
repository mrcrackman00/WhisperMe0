/**
 * Profile API — GET/POST /api/profile; authenticated; upsert by user id.
 */
const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { supabaseAdmin } = require('../config/supabase');
const { body, validationResult } = require('express-validator');

const router = express.Router();
const DISPLAY_NAME_MAX = 100;
const MOOD_MAX = 200;

function sanitize(str, maxLen) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLen);
}

/** GET /api/profile — return current user's profile. */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, display_name, mood, created_at, updated_at')
      .eq('id', req.user.id)
      .maybeSingle();

    if (error) {
      console.error('Profile get error:', error);
      return res.status(500).json({ error: 'Could not load profile' });
    }
    if (!data) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json(data);
  } catch (err) {
    console.error('Profile get error:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

/** POST /api/profile — upsert display_name and mood for current user. */
router.post('/', authMiddleware, [
  body('display_name').optional({ checkFalsy: true }).isString().trim().isLength({ max: DISPLAY_NAME_MAX }).escape(),
  body('mood').optional({ checkFalsy: true }).isString().trim().isLength({ max: MOOD_MAX }).escape()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const displayName = req.body.display_name || '';
    const mood = req.body.mood || '';
    const id = req.user.id;

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .upsert(
        {
          id,
          display_name: displayName || null,
          mood: mood || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
      .select('id, display_name, mood, created_at, updated_at')
      .single();

    if (error) {
      console.error('Profile upsert error:', error);
      return res.status(500).json({ error: 'Could not save profile' });
    }
    res.json(data);
  } catch (err) {
    console.error('Profile post error:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;
