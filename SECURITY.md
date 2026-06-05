# Security Policy

WhisperMe is an early-stage project, but security and privacy are treated as core product requirements.

This document explains how to report vulnerabilities and what security expectations contributors should follow.

## Supported Scope

Security reports are welcome for the public repository and live web/API surfaces related to:

- Marketing site forms
- Waitlist API
- Authentication and password reset flows
- Supabase integration
- Public configuration loading
- Security headers and CSP
- Rate limiting
- Input validation and sanitization
- Email verification and transactional email flows

Mobile app code and full production social features may be handled separately if they are not present in this repository.

## Reporting a Vulnerability

Please do not create a public GitHub issue for a suspected vulnerability.

Send a private report to:

```text
avinash@whisperme.co
```

Include as much detail as possible:

- Affected URL, endpoint, file, or feature
- Steps to reproduce
- Expected vs actual behavior
- Security impact
- Screenshots, logs, or proof-of-concept code if safe to share
- Whether the issue is actively exploitable

I will try to acknowledge valid reports as quickly as possible and prioritize fixes based on severity and user impact.

## Please Do Not

- Access, modify, or delete data that is not yours
- Attempt social engineering
- Run destructive tests
- Spam forms or endpoints beyond what is needed to demonstrate a rate-limit issue
- Exfiltrate secrets or tokens
- Publicly disclose an unfixed vulnerability

## Security Controls in This Repository

The project currently includes:

- Helmet security headers
- Content Security Policy
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin`
- HTTPS enforcement in production
- API rate limiting
- Waitlist honeypot field
- reCAPTCHA support for public forms
- Input validation and sanitization
- Password complexity requirements
- Generic password reset responses to reduce user enumeration
- Supabase auth token URL cleanup
- Runtime public config loading instead of hardcoded keys
- Documentation for keeping secrets out of git

## Secrets Policy

Never commit:

- Supabase service role keys
- Resend API keys
- SMTP credentials
- reCAPTCHA secrets
- JWT secrets
- Production `.env` files
- Private database URLs

Use local `.env` files and production host environment variables. See `docs/PUBLIC-REPO-SECRETS.md`.

## Maintainer Security Checklist

Before deploying security-sensitive changes:

- Check JavaScript syntax with `node --check`
- Verify `vercel.json` parses
- Confirm auth routes still reject missing/invalid CSRF where required
- Confirm waitlist rate limiting still works
- Confirm password reset does not reveal whether an account exists
- Confirm no secrets appear in diffs
- Confirm security headers are present on production responses

## Disclosure

If a vulnerability affects users, the fix should be prioritized before public discussion. After a fix is deployed, a short public note may be added if it helps users or contributors understand the change.
