# Password Reset Email Fix

"Error sending recovery email" usually means Supabase SMTP (Resend) config needs adjustment.

## 1. Sender Email (most common fix)

**Supabase Dashboard → Authentication → Emails → SMTP Settings**

- **Sender email:** Use `onboarding@resend.dev` for testing (no domain verification needed)
- If you have a verified domain in Resend, use e.g. `noreply@yourdomain.com`

## 2. Redirect URLs

**Supabase Dashboard → Authentication → URL Configuration → Redirect URLs**

Add:
- `http://localhost:5500`
- `http://localhost:5500/`
- Your production URL when you deploy (e.g. `https://whisperme.co`)

## 3. Resend SMTP Credentials

In Supabase SMTP settings:
- **Host:** `smtp.resend.com`
- **Port:** `465`
- **Username:** `resend`
- **Password:** Your Resend API key (from [resend.com/api-keys](https://resend.com/api-keys))

## 4. Domain Verification (for production)

To send from your own domain (e.g. `noreply@whisperme.com`):
1. Go to [Resend Domains](https://resend.com/domains)
2. Add and verify your domain (add DNS records)
3. Use that email as sender in Supabase
