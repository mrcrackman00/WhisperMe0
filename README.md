# WhisperMe

**WhisperMe is an open-source reference implementation for a privacy-conscious, voice-first social platform.**

The project combines a static marketing site, an Express API, Supabase Auth, secure waitlist flows, transactional email, and production-oriented security controls. It is built as a practical example for founders and maintainers who want to study how a real early-stage social product handles authentication, waitlists, security headers, rate limiting, and public deployment hygiene.

Live site: [whisperme.co](https://www.whisperme.co)

## Why This Exists

Most social products are optimized around text, images, metrics, and performance. WhisperMe explores a different direction: short voice-first expression, mood-aware discovery, optional anonymity, and safer emotional spaces.

This repository is useful beyond the product itself because it documents and implements common production patterns for:

- Secure public waitlist collection
- Supabase authentication and password recovery
- Express API security middleware
- Static-site deployment with strict headers
- Secrets-safe public repository structure
- Privacy-first product thinking for social software

## Current Status

WhisperMe is in active private beta development. The repository currently focuses on the web presence, auth/waitlist backend, public pages, deployment configuration, and security foundation. Mobile and full app features are planned separately.

## Features

- Voice-first product landing experience
- Early access waitlist with mood selection
- Email/password authentication through Supabase
- Password reset and verification email flows
- Public profile route scaffolding
- Static pages for privacy, terms, accessibility, blog, press, and careers
- Security headers, rate limiting, input validation, and no hardcoded secrets
- Responsive mobile-first frontend

## Security Highlights

The project includes security controls that are intentionally visible in code:

- Rate limiting for auth, password reset, resend verification, and waitlist endpoints
- Origin validation for unsafe API requests
- CSRF protection for authenticated/sensitive routes
- Honeypot, reCAPTCHA support, validation, and rate limiting for public waitlist forms
- Content Security Policy, `X-Frame-Options`, `nosniff`, HSTS, and strict referrer policy
- Password policy requiring at least 8 characters, 1 number, and 1 special character
- Generic password reset responses to reduce user enumeration
- Runtime public Supabase config loading instead of committing keys
- Dedicated documentation for public repository secrets hygiene

See [SECURITY.md](SECURITY.md) for reporting and security guidance.

## Tech Stack

| Area | Technology |
| --- | --- |
| Frontend | HTML, CSS, JavaScript |
| Backend | Node.js, Express |
| Auth | Supabase Auth |
| Database | Supabase Postgres |
| Email | Resend / Nodemailer fallback |
| Security | Helmet, express-rate-limit, express-validator, CSP, CSRF, reCAPTCHA support |
| Hosting | Static frontend + Node API deployment |

## Project Structure

```text
.
├── index.html                     # Main marketing page and auth UI
├── css/                           # Page and component styles
├── js/                            # Frontend config, auth, and UI logic
├── pages/                         # Static content pages
├── whisper-backend/
│   ├── server.js                  # Express server and security middleware
│   ├── routes/                    # Auth, waitlist, profile, admin routes
│   ├── middleware/                # Rate limit and auth middleware
│   ├── services/                  # Email service helpers
│   └── config/                    # Supabase client config
├── docs/                          # Public repo and operations docs
├── vercel.json                    # Static deployment redirects, rewrites, headers
└── supabase-waitlist-pending.sql  # Waitlist verification table migration
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- A Supabase project
- Optional: Resend API key or Gmail app password for transactional email
- Optional: reCAPTCHA v3 key for waitlist bot protection

### Installation

```bash
npm install
```

### Environment Variables

Create `whisper-backend/.env` locally. Do not commit this file.

```env
PORT=3000
NODE_ENV=development

FRONTEND_URL=http://localhost:3000,https://www.whisperme.co,https://whisperme.co
PUBLIC_SITE_URL=https://www.whisperme.co
API_URL=https://your-api-host.example.com

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

RESEND_API_KEY=your_resend_key
FROM_EMAIL=WhisperMe <hello@yourdomain.com>

RECAPTCHA_SITE_KEY=your_recaptcha_site_key
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
CSRF_SECRET=replace_with_a_long_random_secret
```

For more detail, read [docs/PUBLIC-REPO-SECRETS.md](docs/PUBLIC-REPO-SECRETS.md).

### Run Locally

```bash
npm start
```

Then open:

```text
http://localhost:3000
```

## Database Setup

Run the waitlist verification migration in Supabase SQL Editor:

```sql
create table if not exists waitlist_pending (
  email text primary key,
  name text,
  mood text,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists waitlist_pending_expires_at_idx
  on waitlist_pending (expires_at);
```

The same SQL is stored in [supabase-waitlist-pending.sql](supabase-waitlist-pending.sql).

## Useful Scripts

```bash
npm start
```

This starts the Express backend and serves the static site.

Additional validation commands used during maintenance:

```bash
node --check whisper-backend/server.js
npx --yes htmlhint index.html pages/avinash-blog.html
```

## Open Source Maintenance

This project welcomes focused contributions that improve security, reliability, accessibility, documentation, and production readiness.

Good first contribution areas:

- Improve documentation and setup clarity
- Add tests for auth and waitlist routes
- Improve accessibility on public pages
- Harden security middleware and deployment headers
- Add safer error handling and observability
- Improve email templates and transactional email reliability

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

## Roadmap

- Add automated backend route tests
- Add accessibility audit fixes across static pages
- Add clearer deployment guides for Vercel/Render/Railway/AWS-style setups
- Improve waitlist analytics without invasive tracking
- Add stronger email delivery documentation
- Expand profile and app preview scaffolding
- Prepare mobile app architecture separately

## Responsible Use

WhisperMe touches sensitive areas: voice, emotion, identity, anonymity, and social interaction. Contributions should prioritize user safety, privacy, consent, moderation readiness, and clear failure modes over growth hacks or engagement dark patterns.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
