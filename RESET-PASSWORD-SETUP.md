# Password Reset Email Fix

**WhisperMe now uses a custom backend flow** — reset emails are sent via Resend from our backend, bypassing Supabase SMTP entirely.

## Backend Setup (Required)

Ensure these env vars are set on **Render** (whisper-backend):

- `RESEND_API_KEY` — from [resend.com/api-keys](https://resend.com/api-keys)
- `FROM_EMAIL` — e.g. `WhisperMe <onboarding@resend.dev>` (Resend testing, no domain verification)
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — for generating reset links
- `FRONTEND_URL` — e.g. `https://whisper-me-flame.vercel.app`

## Supabase Redirect URLs (Required)

The reset link redirects users back to your app. Add these in:

**Supabase Dashboard → Authentication → URL Configuration → Redirect URLs**

- `https://whisper-me-flame.vercel.app`
- `https://whisper-me-flame.vercel.app/`
- `http://localhost:5500` (for local dev)

## Legacy: Supabase SMTP (Optional)

If you prefer Supabase to send emails directly, configure SMTP in Supabase Dashboard → Authentication → Emails → SMTP Settings. Our custom flow does not use this.
