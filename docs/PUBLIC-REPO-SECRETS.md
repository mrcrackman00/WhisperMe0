# Public repository — what stays private

This repo is safe to make **public** if you follow these rules:

## Never commit

| Item | Where it lives |
|------|----------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Railway / `.env` only — **server-only**, full DB access |
| `RESEND_API_KEY`, Gmail app passwords | Railway / `.env` |
| Any `.env` file | Gitignored — use `whisper-backend/.env.example` as template |

## Intentionally public (by design)

| Item | Notes |
|------|--------|
| `SUPABASE_ANON_KEY` | Meant for browsers; **RLS** protects your data. Still loaded at runtime from `/api/public-config`, not hardcoded in git. |
| `SUPABASE_URL` | Project URL only; not a secret. Set via env on the server. |

## Local development

1. Copy `whisper-backend/.env.example` → `whisper-backend/.env`
2. Fill Supabase + optional email keys from your [Supabase dashboard](https://supabase.com/dashboard) → Project Settings → API

## Production

Set the same variables in **Railway** (or your host). The frontend loads Supabase config from your backend’s `/api/public-config` endpoint.
