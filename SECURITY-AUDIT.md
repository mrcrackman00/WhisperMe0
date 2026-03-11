# WhisperMe Security Audit

**Date:** March 2025  
**Scope:** Full website + backend + bot protection

---

## ✅ Security Measures in Place

### Backend (whisper-backend)

| Layer | Implementation |
|-------|----------------|
| **Rate limiting** | Global: 100 req/15 min per IP |
| **Auth routes** | 5 req/15 min per IP (authLimiter) |
| **Waitlist** | 3 req/hour per IP (waitlistLimiter) |
| **Admin** | 30 req/15 min per IP (adminLimiter) |
| **CORS** | Only allowed origins (Vercel, localhost, FRONTEND_URL) |
| **Helmet** | X-Powered-By disabled, security headers |
| **Body limit** | 10kb max JSON payload (DoS prevention) |
| **JWT auth** | All protected routes verify Supabase JWT |
| **Admin** | requireAdmin checks ADMIN_EMAILS |
| **IDOR protection** | Profile uses req.user.id from JWT (no user ID in URL) |
| **Input validation** | express-validator on waitlist, profile |
| **SQL injection** | Supabase client uses parameterized queries |
| **Secrets** | .env in .gitignore, never committed |

### Bot Protection

| Form | Protection |
|------|-------------|
| **Sign Up** | hCaptcha + honeypot (a_password) |
| **Forgot Password** | hCaptcha |
| **Waitlist (Join Beta)** | Honeypot (a_password) |
| **Waitlist (h11 Get Early Access)** | hCaptcha + Honeypot (h11_a_password) |

### Frontend

| Layer | Implementation |
|-------|----------------|
| **CSP** | Content-Security-Policy meta tag |
| **HTTPS** | Vercel/Render enforce SSL |
| **Supabase** | Auth handled by Supabase (secure) |

---

## ⚠️ Recommendations

1. **hCaptcha on h11 form** — ✅ Added. Get Early Access now has hCaptcha + honeypot.
2. **ADMIN_EMAILS** — Set in Render env for admin routes.
3. **Supabase RLS** — Ensure Row Level Security on all tables.
4. **Cloudflare** — Add for DDoS/WAF if traffic grows.

---

## 🔒 Secrets Checklist

- [ ] SUPABASE_SERVICE_ROLE_KEY — Never in frontend
- [ ] RESEND_API_KEY — Backend only
- [ ] .env — In .gitignore
- [ ] ADMIN_EMAILS — Comma-separated admin emails
