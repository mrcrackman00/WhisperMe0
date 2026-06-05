# Contributing to WhisperMe

Thank you for your interest in contributing to WhisperMe.

WhisperMe is an early-stage, voice-first social platform and an open-source reference for secure Express/Supabase marketing, auth, and waitlist workflows. Contributions should improve reliability, safety, privacy, accessibility, documentation, or maintainability.

## What We Welcome

- Security hardening
- Bug fixes
- Accessibility improvements
- Documentation improvements
- Test coverage for backend routes and frontend flows
- Safer authentication, waitlist, and email handling
- Performance improvements that do not reduce clarity
- Better deployment documentation

## Before You Start

Please open an issue before making large changes. For small documentation fixes, typo fixes, or obvious bug fixes, a pull request is fine.

Do not submit changes that:

- Add secrets, API keys, tokens, credentials, or private URLs
- Weaken authentication, authorization, rate limits, security headers, or validation
- Add invasive tracking or dark patterns
- Introduce large dependencies without a clear reason
- Refactor unrelated files in the same pull request

## Local Setup

Install dependencies:

```bash
npm install
```

Create `whisper-backend/.env` locally using the variables described in `README.md`.

Run the project:

```bash
npm start
```

Open:

```text
http://localhost:3000
```

## Development Guidelines

- Keep changes focused and reviewable.
- Follow the existing plain JavaScript, Express, HTML, and CSS style.
- Prefer simple, explicit code over clever abstractions.
- Keep public pages responsive and accessible.
- Validate all user input on the server.
- Avoid leaking account existence in auth and reset flows.
- Keep security controls easy to audit.

## Security-Sensitive Areas

Take extra care when editing:

- `whisper-backend/server.js`
- `whisper-backend/routes/auth.js`
- `whisper-backend/routes/waitlist.js`
- `whisper-backend/middleware/rateLimiters.js`
- `js/config.js`
- `js/supabase.js`
- `vercel.json`

If your change touches one of these areas, explain the security impact in the pull request.

## Validation Checklist

Before opening a pull request, run relevant checks:

```bash
node --check whisper-backend/server.js
node --check whisper-backend/routes/auth.js
node --check whisper-backend/routes/waitlist.js
node --check js/config.js
node --check js/script.js
npx --yes htmlhint index.html
```

If you cannot run a check, mention that in the pull request.

## Pull Request Checklist

Please include:

- What changed
- Why it changed
- How you tested it
- Screenshots for UI changes
- Any security or privacy impact
- Any follow-up work needed

## Responsible Product Principles

WhisperMe deals with voice, emotion, identity, and social expression. Contributions should respect:

- User consent
- Privacy by default
- Clear safety boundaries
- Accessible interfaces
- No manipulative engagement loops
- No unnecessary collection of sensitive data

## Reporting Security Issues

Please do not open public issues for vulnerabilities. Follow the process in `SECURITY.md`.
