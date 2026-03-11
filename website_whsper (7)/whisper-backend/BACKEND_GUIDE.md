# WhisperMe Backend — Developer Handbook

A step-by-step guide to building and running the WhisperMe backend.

---

## 1. PROJECT OVERVIEW

**WhisperMe** is a **voice-first social platform** where users express their mood in their own voice and connect with others through short, authentic voice clips. The product centers on:

- **Voice expression** — Users record mood-based voice notes instead of text.
- **Mood-based discovery** — Connect with people who share or complement your current mood.
- **Privacy and authenticity** — Voice adds nuance and reduces performative posting.

The backend provides:

- **REST API** for auth, profiles, waitlist, and admin.
- **Supabase** for PostgreSQL database and authentication (email/password, Google, Apple).
- **Resend** for transactional email (welcome, verification, waitlist confirmation).
- **Security** — Helmet, rate limiting, CORS, and JWT verification.

---

## 2. PROJECT STRUCTURE

```
whisper-backend/
├── server.js              # Express app entry point
├── package.json
├── .env.example           # Template for environment variables
├── BACKEND_GUIDE.md       # This handbook
├── config/
│   └── supabase.js        # Supabase client
├── middleware/
│   └── authMiddleware.js  # JWT verification
├── routes/
│   ├── auth.js            # Auth proxy / session helpers
│   ├── waitlist.js        # Waitlist signup
│   ├── profile.js         # User profile CRUD
│   └── admin.js           # Admin dashboard APIs
├── services/
│   └── emailService.js    # Resend email sending
├── utils/
│   ├── analytics.js       # Event tracking to Supabase
│   └── logger.js         # Simple request logging
├── supabase/
│   └── schema.sql        # Table definitions
└── public/
    └── landing.html      # Static landing page
```

---

## 3. DEPENDENCY INSTALLATION

From the project root:

```bash
npm init -y
npm install express cors dotenv @supabase/supabase-js helmet express-rate-limit resend
```

Optional (recommended for validation and logging):

```bash
npm install express-validator
```

---

## 4. SERVER SETUP

`server.js` wires the app:

- Express, `express.json()`, CORS.
- Helmet for security headers.
- Rate limit: 100 requests per 15 minutes per IP.
- Static files from `public/`.
- API routes under `/api`.
- Central error handler and port from `process.env.PORT`.

See `server.js` in the repo for the full implementation.

---

## 5. DATABASE DESIGN (SUPABASE)

Run the SQL below in the Supabase SQL Editor (Dashboard → SQL Editor).

**Tables:**

| Table     | Purpose |
|----------|---------|
| `profiles` | User display name and mood (id = auth.users.id) |
| `waitlist` | Pre-launch signups (name, email, mood) |
| `events`   | Analytics (event_type, user_id, metadata) |

**Schema:** See `supabase/schema.sql`. Summary:

| Column         | Type        | Notes |
|----------------|-------------|--------|
| **profiles**   |             |       |
| id             | uuid        | PK, references auth.users(id) |
| display_name   | text        |       |
| mood           | text        |       |
| created_at     | timestamptz | default now() |
| updated_at     | timestamptz | default now() |
| **waitlist**   |             |       |
| id             | bigserial   | PK    |
| name           | text        |       |
| email          | text        | NOT NULL UNIQUE |
| mood           | text        |       |
| created_at     | timestamptz | default now() |
| **events**     |             |       |
| id             | bigserial   | PK    |
| event_type     | text        | NOT NULL (e.g. signup, login, waitlist_join) |
| user_id        | uuid        | nullable, FK auth.users |
| metadata       | jsonb       | nullable |
| created_at     | timestamptz | default now() |

The schema file also includes RLS policies, indexes, and an optional trigger to auto-create a profile row when a user signs up.

---

## 6. AUTHENTICATION

Auth is handled by **Supabase Auth**; the backend does not store passwords.

- **Email + password:** Use Supabase client `signUp` / `signInWithPassword` from the frontend.
- **Google OAuth:** Enable in Supabase Dashboard → Authentication → Providers.
- **Apple OAuth:** Enable in Supabase Dashboard and configure Apple Developer credentials.

Backend responsibilities:

- Verify JWTs via `authMiddleware` (using Supabase `getUser`).
- Optionally proxy auth endpoints in `routes/auth.js` if you need server-side sign-in (e.g. for server-rendered or legacy clients).

Frontend gets session/JWT from Supabase and sends `Authorization: Bearer <access_token>` to the API.

---

## 7. AUTH MIDDLEWARE

`middleware/authMiddleware.js`:

1. Reads `Authorization: Bearer <token>`.
2. Verifies the JWT with Supabase (`getUser(token)`).
3. Attaches `req.user` (id, email, etc.) and calls `next()`.
4. Returns 401 if missing or invalid.

Use this middleware on any route that requires a logged-in user (e.g. profile, admin).

---

## 8. WAITLIST API

**POST /api/waitlist**

- **Body:** `{ "name", "email", "mood" }` (all required; validate and sanitize).
- **Logic:** Insert into `waitlist`; enforce unique `email` (return friendly message if duplicate).
- **Response:** 201 with success message; optionally trigger Resend waitlist confirmation email.
- **Tracking:** Insert `events` row with `event_type: 'waitlist_join'`.

---

## 9. USER PROFILE API

**POST /api/profile** (authenticated)

- **Body:** `{ "display_name", "mood" }` (optional; validate length).
- **Logic:** Upsert `profiles` where `id = req.user.id` (from auth middleware).
- **Response:** 200 with updated profile.

**GET /api/profile** (authenticated)

- **Logic:** Return profile for `req.user.id`.
- **Response:** 200 with profile or 404.

---

## 10. EMAIL SYSTEM (RESEND)

`services/emailService.js` uses the Resend SDK:

- **Welcome email** — After signup (triggered by frontend or Supabase webhook).
- **Email verification** — Handled by Supabase; optional custom template via Resend if you use custom flows.
- **Waitlist confirmation** — After successful POST /api/waitlist.

Set `RESEND_API_KEY` and `FROM_EMAIL` in `.env`. Use Resend domains for production.

---

## 11. ADMIN DASHBOARD APIs

All under `/api/admin/*`; protect with auth middleware and an admin check (e.g. `req.user.email` in allowlist or `profiles.role = 'admin'`).

- **GET /api/admin/users** — Total users, recent signups (from `profiles` or Supabase Auth if exposed).
- **GET /api/admin/waitlist** — List waitlist entries, count.
- **GET /api/admin/analytics** — Aggregates: total users, waitlist count, signups per day, mood statistics (from `profiles` + `events`).

Return JSON suitable for dashboard charts and tables.

---

## 12. ANALYTICS TRACKING

`utils/analytics.js` exposes a function to insert into `events`:

- `event_type`: e.g. `signup`, `login`, `waitlist_join`
- `user_id`: optional (null for anonymous waitlist).
- `metadata`: optional JSON (e.g. mood, source).

Call this from:

- Auth routes (after signup/login).
- Waitlist route (after successful join).

Keeps all event data in Supabase for future analytics and admin analytics API.

---

## 13. SECURITY

- **Helmet** — Secure headers (X-Content-Type-Options, X-Frame-Options, etc.).
- **Rate limiting** — 100 requests per 15 minutes per IP (express-rate-limit).
- **CORS** — Restrict origin to your frontend (e.g. `process.env.FRONTEND_URL`).
- **Input validation** — Validate and sanitize all inputs (e.g. express-validator); reject oversized payloads.
- **Auth** — All sensitive routes behind auth middleware; admin routes behind admin check.

---

## 14. DEPLOYMENT

### Environment variables (set on the platform)

```env
NODE_ENV=production
PORT=3000
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # Server-only; never expose to client
RESEND_API_KEY=re_...
FROM_EMAIL=notifications@yourdomain.com
FRONTEND_URL=https://yourapp.com
ADMIN_EMAILS=admin@yourdomain.com
```

### Railway

1. Connect GitHub repo; root = `whisper-backend` (or set root in settings).
2. Add all env vars in Dashboard → Variables.
3. Build: `npm install`, Start: `node server.js` (or `npm start`).
4. Railway assigns a public URL; point your frontend to it.

### Render

1. New Web Service; connect repo; root directory = `whisper-backend`.
2. Build: `npm install`; Start: `node server.js`.
3. Add env vars in Environment tab.
4. Use the generated `.onrender.com` URL.

### Vercel (backend)

1. Install Vercel CLI; in `whisper-backend` run `vercel`.
2. Use a single serverless entry (e.g. `api/index.js` that imports Express and exports `app`) or split into serverless functions. For a single Express app, use `vercel.json` with `rewrites` to route all requests to one function.
3. Add env vars in Project Settings → Environment Variables.
4. Note: long-running requests may hit serverless limits; for heavy real-time or long jobs, Railway/Render may be simpler.

---

## 15. BEST PRACTICES

- **Environment variables** — Use `.env` locally and `.env.example` (no secrets) in git; validate required vars at startup.
- **Error handling** — Central error middleware; consistent JSON error shape (`{ error: string, code?: string }`); log stack traces only in non-production.
- **Logging** — Log request method, path, status, and duration (e.g. `utils/logger.js`); use structured logs if you add a logging service later.
- **Scalability** — Stateless API; store nothing in process memory; use Supabase (and optional queue) for background jobs; consider connection pooling if you add a direct DB driver later.
- **Health check** — Expose `GET /health` that returns 200 when the app and (optionally) Supabase are reachable.

---

You can now implement each part using the starter code in the repo. Start with schema, then server, then routes, middleware, and services.
