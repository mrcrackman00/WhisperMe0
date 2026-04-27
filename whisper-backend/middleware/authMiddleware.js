/**
 * Auth middleware — verify JWT via Supabase and attach user to request.
 * Expects: Authorization: Bearer <access_token>
 */
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  const token = authHeader.slice(7);
  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(503).json({ error: 'Auth not configured' });
  }
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });
  supabase.auth.getUser(token)
    .then(({ data, error }) => {
      const user = data?.user;
      if (error || !user) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
      req.user = user;
      next();
    })
    .catch(() => res.status(401).json({ error: 'Invalid or expired token' }));
}

/** Optional: require admin (e.g. email in ADMIN_EMAILS). */
function requireAdmin(req, res, next) {
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
  const email = (req.user?.email || '').toLowerCase();
  if (!adminEmails.length || !adminEmails.includes(email)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = { authMiddleware, requireAdmin };
