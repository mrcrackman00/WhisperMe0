/**
 * WhisperMe Backend — Express server
 * Voice-first social platform API
 */
require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const waitlistRoutes = require('./routes/waitlist');
const profileRoutes = require('./routes/profile');
const adminRoutes = require('./routes/admin');
const { requestLogger } = require('./utils/logger');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
// ——— CORS ———
const CORS_ORIGINS = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(s => s.trim()).filter(Boolean)
  : [
      'https://whisper-me-flame.vercel.app',
      'http://localhost:5500',
    ];

// ——— Security: Helmet & Basics ———
app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: false, // relax if you need inline scripts for landing
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
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
}));

// ——— Body parsing: strict limit to prevent DOS ———
app.use(express.json({ limit: '10kb' }));

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
app.use(express.static(path.join(__dirname, 'public')));

// ——— Landing (optional) ———
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'landing.html'));
});

// ——— Public config (Supabase anon key + API URL for frontend) ———
app.get('/api/public-config', (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
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

// ——— Central error handler ———
app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }
  res.status(status).json({ error: message, code: err.code });
});

app.listen(PORT, () => {
  console.log(`WhisperMe API running at http://localhost:${PORT}`);
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('Warning: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set. DB and auth may fail.');
  }
});
