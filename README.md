# WhisperMe

WhisperMe is a voice-first social platform focused on authentic emotional expression and meaningful conversations.

## Features
- Voice based posts
- Emotion tagging
- Early access waitlist
- Secure authentication
- Privacy focused design

## Tech Stack
Frontend: HTML, CSS, JavaScript  
Backend: Node.js  
Auth: Supabase  
Email: Resend  
Security: Cloudflare Turnstile

## Status
In active development.

## Public repository & secrets

Secrets (Supabase **service role**, email API keys, etc.) **never** belong in git — use `.env` locally and your host’s env vars (e.g. Railway). See **[docs/PUBLIC-REPO-SECRETS.md](docs/PUBLIC-REPO-SECRETS.md)**. The frontend loads the public Supabase anon key at runtime from your backend’s `/api/public-config`, not from hardcoded values in this repo.
