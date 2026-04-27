# Verification Email Setup

If signup verification emails are not arriving, check the following:

## 1. Railway Environment Variables

Ensure these are set in your Railway project:

| Variable | Purpose |
|----------|---------|
| `RESEND_API_KEY` | From [resend.com/api-keys](https://resend.com/api-keys) — primary email sender |
| `GMAIL_USER` | Gmail address (fallback if Resend fails) |
| `GMAIL_APP_PASSWORD` | App password from [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) |
| `FROM_EMAIL` | e.g. `WhisperMe <onboarding@resend.dev>` or your verified domain |

**At least one of these must work:**
- Resend: `RESEND_API_KEY` + `FROM_EMAIL`
- Gmail: `GMAIL_USER` + `GMAIL_APP_PASSWORD`

## 2. Spam Folder

Verification emails often land in **spam**. Ask users to:
- Check spam/junk folder
- Mark as "Not spam" so future emails reach inbox

## 3. Resend Domain (Production)

Resend's free `onboarding@resend.dev` works for testing but has lower deliverability. For production:
1. Add and verify your domain in Resend
2. Set `FROM_EMAIL=WhisperMe <notifications@yourdomain.com>`

## 4. Resend Verification Button

Users who didn't receive the email can tap **"Resend email"** on the verification pending screen. This calls `POST /api/auth/resend-verification` (rate limited: 3 per 15 min).
