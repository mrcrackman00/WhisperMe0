/**
 * WhisperMe Backend — Express server
 * Voice-first social platform API
 */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const crypto = require('crypto');
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { supabaseUrl } = require('./config/supabase');
const authRoutes = require('./routes/auth');
const waitlistRoutes = require('./routes/waitlist');
const profileRoutes = require('./routes/profile');
const adminRoutes = require('./routes/admin');
const { requestLogger } = require('./utils/logger');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// ——— Trust proxy (required for rate limit behind Railway/Vercel/nginx) ———
app.set('trust proxy', 1);

// ——— CORS ——— (FRONTEND_URL adds to this list; both custom domain + Vercel URL stay allowed)
const CORS_DEFAULT_ORIGINS = [
  'https://whisper-me-flame.vercel.app',
  'https://whisperme.co',
  'https://www.whisperme.co',
  'https://whisperme0.onrender.com',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];
const fromEnv = (process.env.FRONTEND_URL || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
const CORS_ORIGINS = [...new Set([...fromEnv, ...CORS_DEFAULT_ORIGINS])];
const ALLOWED_ORIGINS = new Set(CORS_ORIGINS.map((origin) => origin.replace(/\/$/, '')));
const CSRF_COOKIE = 'wm_csrf';
const CSRF_TTL_MS = 2 * 60 * 60 * 1000;
const CSRF_SECRET = process.env.CSRF_SECRET
  || process.env.SUPABASE_SERVICE_ROLE_KEY
  || process.env.JWT_SECRET
  || 'whisperme-dev-csrf-secret';

function parseCookies(req) {
  return Object.fromEntries(String(req.headers.cookie || '')
    .split(';')
    .map((part) => part.trim().split('='))
    .filter((part) => part.length === 2 && part[0])
    .map(([key, value]) => [key, decodeURIComponent(value)]));
}

function requireHttps(req, res, next) {
  const host = req.headers.host || '';
  const proto = req.headers['x-forwarded-proto'] || req.protocol;
  if (process.env.NODE_ENV === 'production' && proto !== 'https') {
    return res.redirect(301, `https://${host}${req.originalUrl}`);
  }
  return next();
}

function validateOrigin(req, res, next) {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
  const origin = req.headers.origin;
  if (!origin) return res.status(403).json({ error: 'Missing origin.' });
  const normalized = origin.replace(/\/$/, '');
  if (!ALLOWED_ORIGINS.has(normalized)) return res.status(403).json({ error: 'Invalid origin.' });
  return next();
}

function signCsrfPayload(payload) {
  return crypto.createHmac('sha256', CSRF_SECRET).update(payload).digest('hex');
}

function createCsrfToken() {
  const expiresAt = Date.now() + CSRF_TTL_MS;
  const nonce = crypto.randomBytes(24).toString('hex');
  const payload = `${expiresAt}.${nonce}`;
  return `${payload}.${signCsrfPayload(payload)}`;
}

function isValidSignedCsrfToken(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return false;
  const [expiresAtRaw, nonce, signature] = parts;
  if (!/^\d+$/.test(expiresAtRaw) || !/^[a-f0-9]{48}$/i.test(nonce) || !/^[a-f0-9]{64}$/i.test(signature)) {
    return false;
  }
  if (Number(expiresAtRaw) < Date.now()) return false;

  const payload = `${expiresAtRaw}.${nonce}`;
  const expected = signCsrfPayload(payload);
  return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
}

function issueCsrfToken(req, res) {
  const token = createCsrfToken();
  res.cookie(CSRF_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: CSRF_TTL_MS,
    path: '/',
  });
  res.setHeader('Content-Type', 'application/json');
  res.json({ csrfToken: token });
}

function requireCsrf(req, res, next) {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
  const cookies = parseCookies(req);
  const cookieToken = cookies[CSRF_COOKIE];
  const headerToken = req.headers['x-csrf-token'];
  const hasMatchingCookieToken = cookieToken && headerToken && cookieToken === headerToken;
  const hasValidSignedToken = headerToken && isValidSignedCsrfToken(headerToken);
  if (!hasMatchingCookieToken && !hasValidSignedToken) {
    return res.status(403).json({ error: 'Invalid CSRF token.' });
  }
  return next();
}

// ——— Security: Helmet & Basics ———
app.disable('x-powered-by');
app.use(requireHttps);
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net', 'https://www.google.com', 'https://www.gstatic.com'],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", ...CORS_ORIGINS, 'https://*.supabase.co', 'https://www.google.com', 'https://www.gstatic.com'],
      frameSrc: ['https://www.google.com', 'https://www.gstatic.com'],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin' },
  crossOriginEmbedderPolicy: false,
}));

// ——— Rate limiting: 100 requests per 15 minutes per IP ———
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Try again later.' },
});
app.use(limiter);

app.use(cors({
  origin: CORS_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  optionsSuccessStatus: 204,
}));

// ——— Body parsing: strict limit to prevent DOS ———
app.use(express.json({ limit: '10kb' }));

// ——— JSON parse error handler (prevents HTML error pages) ———
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('[server] Invalid JSON body:', err.message);
    res.setHeader('Content-Type', 'application/json');
    return res.status(400).json({ error: 'Invalid JSON in request body.' });
  }
  next(err);
});

app.get('/api/csrf-token', issueCsrfToken);
app.use('/api', validateOrigin, requireCsrf);

// ——— Request logging ———
app.use(requestLogger);

// ——— Health check (before static; support GET + HEAD for UptimeRobot) ———
function healthOk(req, res) {
  res.status(200).json({ status: 'ok', service: 'whisper-backend' });
}
app.get('/health', healthOk);
app.head('/health', (req, res) => res.status(200).end());
app.get('/api/health', healthOk);
app.head('/api/health', (req, res) => res.status(200).end());

// ——— Static files ———
app.use(express.static(path.join(__dirname, '..')));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/sitemap.xml', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'sitemap.xml'));
});

// ——— Email preview (dev only — render the waitlist HTML in a browser) ———
// Visit /preview/waitlist-email?name=Avinash to see the email design with the local logo.
if (process.env.NODE_ENV !== 'production') {
  const fs = require('fs');
  function renderEmailPreview(file) {
    return (req, res) => {
      try {
        const tplPath = path.join(__dirname, 'email-templates', file);
        const tpl = fs.readFileSync(tplPath, 'utf8');
        const rawName = String(req.query.name || 'Avinash').slice(0, 60);
        const name = rawName.split(/\s+/)[0]
          .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const assetBase = `${req.protocol}://${req.get('host')}/email`;
        const html = tpl
          .replace(/\{\{NAME\}\}/g, name)
          .replace(/\{\{ASSET_BASE\}\}/g, assetBase);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
      } catch (err) {
        res.status(500).send('Preview error: ' + err.message);
      }
    };
  }
  app.get('/preview/waitlist-email', renderEmailPreview('waitlist-confirmation.html'));
  app.get('/preview/launch-announcement', renderEmailPreview('launch-announcement.html'));
}

// ——— Landing (optional) ———
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'landing.html'));
});

app.get('/blog/avinash', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'pages', 'avinash-blog.html'));
});

// ——— Public config (Supabase anon key + API URL for frontend) ———
app.get('/api/public-config', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json({
    supabaseUrl,
    supabaseAnonKey: (process.env.SUPABASE_ANON_KEY || '').trim() || '',
    apiUrl: process.env.API_URL || `http://localhost:${PORT}`,
  });
});

// ——— API routes ———
app.use('/api/auth', authRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);

// ——— 404 ———
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ——— Central error handler — always JSON ———
app.use((err, req, res, next) => {
  const status = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';
  console.error('[server] Error:', message, err.stack || '');
  res.setHeader('Content-Type', 'application/json');
  res.status(status).json({ error: message, code: err.code });
});

app.listen(PORT, () => {
  console.log(`[WhisperMe] API running at http://localhost:${PORT}`);
  console.log('[WhisperMe] trust proxy: enabled');
  const sbUrl = (process.env.SUPABASE_URL || '').trim();
  if (sbUrl && sbUrl.indexOf('dashboard') === -1) {
    console.log('[WhisperMe] Supabase URL:', sbUrl.replace(/\/$/, ''));
  } else if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('[WhisperMe] Warning: SUPABASE_SERVICE_ROLE_KEY not set. Auth and DB may fail.');
  }
});
