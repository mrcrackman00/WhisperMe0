# WhisperMe Production Deployment

## Frontend (Vercel)

The frontend uses `js/config.js` for the API base URL.

### Option 1: Edit config.js (simplest)

Before deploying, edit `js/config.js` and set `PRODUCTION_API_URL` to your backend URL:

```javascript
var PRODUCTION_API_URL = 'https://your-whisperme-api.onrender.com';
```

### Option 2: Vercel Environment Variables

1. Deploy the backend (e.g. Render, Railway) and get its URL
2. In Vercel Dashboard → Project → Settings → Environment Variables:
   - Add `API_BASE_URL` = `https://your-backend.onrender.com`
3. The `/api/config` serverless function will return this. The frontend fetches it automatically on vercel.app domains.

## Backend (Render / Railway / etc.)

1. Deploy `whisper-backend/` to your hosting provider
2. Set environment variables:
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - `FRONTEND_URL` = your Vercel URL (e.g. `https://whisper-me-flame.vercel.app`)
   - `RESEND_API_KEY`, `FROM_EMAIL` (for emails)
3. Add your Vercel URL to CORS (FRONTEND_URL)

## Supabase

- Add your production URLs to **Auth → URL Configuration → Redirect URLs**
- Add your Vercel URL to **Site URL**
