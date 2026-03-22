/**
 * Google reCAPTCHA v3 — server-side verification.
 * Env: RECAPTCHA_SECRET_KEY (required in production if you enforce captcha)
 *      RECAPTCHA_MIN_SCORE (optional, default 0.5)
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
  if (remoteip) params.append('remoteip', String(remoteip).split(',')[0].trim());

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
    return {
      ok: false,
      error: 'verify_failed',
      codes: data && data['error-codes'],
    };
  }

  const score = typeof data.score === 'number' ? data.score : 0;
  const minScore = parseFloat(process.env.RECAPTCHA_MIN_SCORE || '0.5', 10);
  const threshold = Number.isFinite(minScore) ? minScore : 0.5;

  if (score < threshold) {
    return { ok: false, error: 'score_low', score };
  }

  return { ok: true, score };
}

module.exports = { verifyRecaptchaV3 };
