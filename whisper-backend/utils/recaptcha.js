/**
 * Google reCAPTCHA v3 — server-side verification.
 * Env: RECAPTCHA_SECRET_KEY (required in production if you enforce captcha)
 *      RECAPTCHA_MIN_SCORE (optional, default 0.4 — v3 can score legit users ~0.3–0.5)
 *      RECAPTCHA_SEND_REMOTEIP=1 — only if you need to pass client IP (often breaks behind Railway/Vercel proxies)
 *
 * If RECAPTCHA_SECRET_KEY is unset, verification is skipped (local dev).
 */

async function verifyRecaptchaV3(token, remoteip) {
  const secret = (process.env.RECAPTCHA_SECRET_KEY || '').trim();
  if (!secret) {
    return { ok: true, skipped: true };
  }

  if (!token || typeof token !== 'string' || !token.trim()) {
    return { ok: false, error: 'missing_token' };
  }

  const params = new URLSearchParams();
  params.append('secret', secret);
  params.append('response', token.trim());
  // Omitting remoteip avoids many false failures when Express sees the proxy IP, not the user IP.
  if (process.env.RECAPTCHA_SEND_REMOTEIP === '1' && remoteip) {
    params.append('remoteip', String(remoteip).split(',')[0].trim());
  }

  let data;
  try {
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    data = await res.json();
  } catch (e) {
    console.error('[recaptcha] siteverify request failed:', e.message || e);
    return { ok: false, error: 'verify_request_failed' };
  }

  if (!data || !data.success) {
    const codes = (data && data['error-codes']) || [];
    console.error('[recaptcha] siteverify not successful:', codes.join(', ') || 'unknown');
    return {
      ok: false,
      error: 'verify_failed',
      codes,
    };
  }

  const score = typeof data.score === 'number' ? data.score : 0;
  const minScore = parseFloat(String(process.env.RECAPTCHA_MIN_SCORE || '0.25').trim(), 10);
  const threshold = Number.isFinite(minScore) ? minScore : 0.25;

  if (score < threshold) {
    console.warn('[recaptcha] score below threshold:', { score, threshold });
    return { ok: false, error: 'score_low', score };
  }

  return { ok: true, score };
}

module.exports = { verifyRecaptchaV3 };
