/**
 * Email service — Nodemailer + Gmail for transactional emails.
 * Setup: Enable 2FA on your Google account, then create an App Password
 * at https://myaccount.google.com/apppasswords
 */
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const TEMPLATES_DIR = path.join(__dirname, '..', '..', 'email-templates');
const _templateCache = new Map();
function loadTemplate(name) {
  if (_templateCache.has(name)) return _templateCache.get(name);
  try {
    const html = fs.readFileSync(path.join(TEMPLATES_DIR, name), 'utf8');
    _templateCache.set(name, html);
    return html;
  } catch (err) {
    console.warn('[email] template missing:', name, err.message);
    return null;
  }
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderTemplate(html, vars) {
  if (!html) return '';
  return html.replace(/\{\{(\w+)\}\}/g, (m, k) => (vars && vars[k] != null ? String(vars[k]) : ''));
}

const gmailUser = process.env.GMAIL_USER;
const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
const fromEmail = process.env.FROM_EMAIL || (gmailUser ? `WhisperMe <${gmailUser}>` : 'WhisperMe <noreply@whisperme.app>');

let transporter = null;
if (gmailUser && gmailAppPassword) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  });
}

async function sendMail(to, subject, html, text) {
  if (!transporter) {
    console.warn('Email not configured; skipping email to', to);
    return { ok: false, skipped: true };
  }
  try {
    const info = await transporter.sendMail({
      from: fromEmail,
      to,
      subject,
      html,
      ...(text ? { text } : {}),
    });
    return { ok: true, id: info.messageId };
  } catch (error) {
    console.error('Email send error:', error.message);
    return { ok: false, error: error.message };
  }
}

async function sendWelcomeEmail(to, displayName = 'there') {
  return sendMail(to, 'Welcome to WhisperMe', `
    <h1>Welcome to WhisperMe</h1>
    <p>Hi ${displayName},</p>
    <p>Your voice matters. Start sharing your mood and connecting with others.</p>
    <p>— The WhisperMe team</p>
  `);
}

/** Plain-text fallback for clients that don't render HTML (better deliverability + accessibility). */
const WAITLIST_TEXT = (name) => `You're in.
The wait begins.

Hi ${name || 'there'},

Thank you for joining the WhisperMe waitlist. You're one of the early few who believe a softer, more intentional kind of social is possible.

EARLY ACCESS OPENS — JUNE 20
Save the date. Your invite arrives that morning.

What's coming:
1. Voice posts — speak instead of type. Your real voice, your real self.
2. Mood tagging — say how you feel without saying a word.
3. Intentional community — slow social, by design.

What happens next:
· On June 20, you'll receive your early-access link.
· Until then — no spam, no noise. Just one quiet update if there's something worth sharing.
· You can reply to this email any time. We read every word.

See you on launch day,
— The WhisperMe team

whisperme.co — Slow social, by design.
Instagram: https://www.instagram.com/whisperme.co
X (Twitter): https://x.com/buildwhisper

If this landed in spam, mark as "Not spam" so future emails reach your inbox.
You're receiving this because you signed up at whisperme.co.`;

/**
 * Send waitlist confirmation. Tries Resend first (HTTPS API ~200ms),
 * then Gmail SMTP fallback. Returns { ok, id?, via?, error?, skipped? }.
 */
async function sendWaitlistConfirmation(to, name) {
  const subject = "You're in — WhisperMe early access opens June 20";
  const safeName = escapeHtml(name || 'there').slice(0, 60);
  const assetBase = (process.env.EMAIL_ASSET_BASE || 'https://whisperme.co/assets/email').replace(/\/$/, '');
  const tpl = loadTemplate('waitlist-confirmation.html');
  const html = tpl
    ? renderTemplate(tpl, { NAME: safeName, ASSET_BASE: assetBase })
    : `<h1>You're in!</h1><p>Hi ${safeName}, you're on the WhisperMe waitlist. Early access opens June 20.</p>`;
  const text = WAITLIST_TEXT(name || 'there');

  const apiKey = (process.env.RESEND_API_KEY || '').trim();
  // Treat the placeholder "re_..." in .env.example as unset so we don't 401-loop.
  const resendKeyOk = apiKey && apiKey !== 're_...' && apiKey.length > 8;

  let resendError = null;
  if (resendKeyOk) {
    try {
      const { Resend } = require('resend');
      const resend = new Resend(apiKey);
      const from = process.env.FROM_EMAIL || 'WhisperMe <onboarding@resend.dev>';
      const { data, error } = await resend.emails.send({ from, to, subject, html, text });
      if (!error) return { ok: true, id: data?.id, via: 'resend' };
      resendError = error.message || String(error);
      const sandbox = /only send testing emails|verify a domain/i.test(resendError);
      console.warn('[waitlist email] Resend failed:', resendError);
      if (sandbox) {
        console.warn('[waitlist email] Resend is in sandbox mode. Verify a domain at https://resend.com/domains and set FROM_EMAIL=WhisperMe <hello@yourdomain.com> to send to anyone.');
      }
    } catch (err) {
      resendError = err.message || String(err);
      console.warn('[waitlist email] Resend error:', resendError);
    }
  }

  if (transporter) {
    const r = await sendMail(to, subject, html, text);
    return { ...r, via: r.ok ? 'gmail' : r.via };
  }

  if (!resendError) {
    console.warn('[waitlist email] No email backend configured. Set RESEND_API_KEY (recommended) or GMAIL_USER + GMAIL_APP_PASSWORD in whisper-backend/.env so confirmation emails actually send.');
  }
  return { ok: false, skipped: !resendError, error: resendError || 'Email not configured' };
}

const VERIFICATION_HTML = (verificationLink) => `
  <h1>Verify your WhisperMe email</h1>
  <p>Click the link below to activate your account:</p>
  <p><a href="${verificationLink}" style="background:#7C5CBF;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block;">Verify Email</a></p>
  <p>Or copy this link: ${verificationLink}</p>
  <p>This link expires in 24 hours. If you didn't sign up, ignore this email.</p>
  <p><small>If this landed in spam, mark as "Not spam" so future emails reach your inbox.</small></p>
  <p>— The WhisperMe team</p>
`;

/** Send verification email via Resend, with Gmail fallback if Resend fails. */
async function sendVerificationEmailViaResend(to, verificationLink) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.FROM_EMAIL || 'WhisperMe <onboarding@resend.dev>';
  const html = VERIFICATION_HTML(verificationLink);

  if (apiKey) {
    try {
      const { Resend } = require('resend');
      const resend = new Resend(apiKey);
      const { data, error } = await resend.emails.send({
        from,
        to,
        subject: 'Verify your WhisperMe email',
        html,
      });
      if (!error) return { ok: true, id: data?.id };
      console.warn('[verification] Resend failed:', error.message);
    } catch (err) {
      console.warn('[verification] Resend error:', err.message);
    }
  } else {
    console.warn('[verification] RESEND_API_KEY not set');
  }

  if (transporter) {
    return sendMail(to, 'Verify your WhisperMe email', html);
  }
  console.warn('[verification] No email configured; set RESEND_API_KEY or GMAIL_USER+GMAIL_APP_PASSWORD');
  return { ok: false, error: 'Email not configured' };
}

async function sendVerificationEmail(to, verificationLink) {
  return sendMail(to, 'Verify your WhisperMe email', `
    <h1>Verify your email</h1>
    <p><a href="${verificationLink}">Click here to verify</a>.</p>
    <p>— The WhisperMe team</p>
  `);
}

const PASSWORD_RESET_HTML = (resetLink) => `
  <h1>Reset your password</h1>
  <p>Click the link below to set a new password:</p>
  <p><a href="${resetLink}" style="background:#000;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;display:inline-block;">Reset Password</a></p>
  <p>Or copy this link: ${resetLink}</p>
  <p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>
  <p><small>If this landed in spam, mark as "Not spam" so future emails reach your inbox.</small></p>
  <p>— The WhisperMe team</p>
`;

/**
 * Send password reset email via Resend (bypasses Supabase SMTP).
 * Uses RESEND_API_KEY and FROM_EMAIL from env.
 */
async function sendPasswordResetEmail(to, resetLink) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL || 'WhisperMe <onboarding@resend.dev>';
  const templateId = process.env.RESEND_PASSWORD_RESET_TEMPLATE_ID;
  if (!apiKey) {
    console.warn('RESEND_API_KEY not set; cannot send password reset email');
    return { ok: false, error: 'Email not configured' };
  }
  try {
    const { Resend } = require('resend');
    const resend = new Resend(apiKey);
    const payload = {
      from: fromEmail,
      to,
      subject: 'Reset your WhisperMe password',
    };
    if (templateId) {
      payload.template = { id: templateId, variables: { RESET_LINK: resetLink } };
    } else {
      payload.html = PASSWORD_RESET_HTML(resetLink);
    }
    const { data, error } = await resend.emails.send(payload);
    if (error) {
      console.error('Resend error:', error);
      return { ok: false, error: error.message };
    }
    return { ok: true, id: data?.id };
  } catch (err) {
    console.error('Password reset email error:', err.message);
    return { ok: false, error: err.message };
  }
}

/**
 * Send password reset email via Resend or Gmail (whichever is configured).
 * Used when Supabase's built-in email fails (e.g. "Error sending recovery email").
 */
async function sendPasswordResetEmailAny(to, resetLink) {
  if (process.env.RESEND_API_KEY) {
    const r = await sendPasswordResetEmail(to, resetLink);
    if (r.ok) return r;
  }
  if (transporter) {
    return sendMail(to, 'Reset your WhisperMe password', PASSWORD_RESET_HTML(resetLink));
  }
  return { ok: false, error: 'Email not configured. Set RESEND_API_KEY or GMAIL_USER+GMAIL_APP_PASSWORD.' };
}

/** Plain-text fallback for the launch announcement (deliverability + accessibility). */
const ANNOUNCEMENT_TEXT = (name) => `June 20. Then everything sounds different.

Hi ${name || 'there'},

For years, social has gotten louder. We're building it quieter — on purpose.

WhisperMe is the first social platform built around your voice. Not your face. Not your metrics. Not your performance. Just the way you actually sound when you stop performing.

EARLY ACCESS OPENS — JUNE 20
Save the date. Your invite arrives that morning.

What we've built:

01 / Voice posts
Up to 60 seconds. No filters, no faces, no performance theatre. Your real voice — louder than any caption.

02 / Mood as language
Tag every post with what you actually felt. Find the people feeling the same thing — right now.

03 / Quiet by design
No infinite scroll. No likes-as-numbers. No notification storms. Just the moments that matter, at the volume you set.

"Some thoughts deserve a voice, not a caption."

What's next:
JUN 20 — Early access opens for waitlist members
JUL    — iOS app rollout
LATER  — A few things we're not ready to spoil today

You were among the first to believe this was possible.
On June 20, we'll prove it.

— The WhisperMe team

whisperme.co — Slow social, by design.
Instagram: https://www.instagram.com/whisperme.co
X (Twitter): https://x.com/buildwhisper

You're receiving this because you joined the WhisperMe waitlist at whisperme.co.
If this landed in spam, mark as "Not spam" so future emails reach your inbox.`;

/**
 * Send the launch-announcement email (Apple-keynote style) to a single recipient.
 * Uses Resend (HTTPS API). Returns { ok, id?, via?, error? }.
 */
async function sendLaunchAnnouncement(to, name) {
  const subject = 'June 20. Then everything sounds different.';
  const safeName = escapeHtml(firstName(name) || 'there').slice(0, 60);
  const assetBase = (process.env.EMAIL_ASSET_BASE || 'https://whisperme.co/assets/email').replace(/\/$/, '');
  const tpl = loadTemplate('launch-announcement.html');
  const html = tpl
    ? renderTemplate(tpl, { NAME: safeName, ASSET_BASE: assetBase })
    : `<h1>WhisperMe opens June 20.</h1><p>Hi ${safeName},</p><p>Three weeks. Then everything sounds different.</p>`;
  const text = ANNOUNCEMENT_TEXT(firstName(name));

  const apiKey = (process.env.RESEND_API_KEY || '').trim();
  const resendKeyOk = apiKey && apiKey !== 're_...' && apiKey.length > 8;
  if (resendKeyOk) {
    try {
      const { Resend } = require('resend');
      const resend = new Resend(apiKey);
      const from = process.env.FROM_EMAIL || 'WhisperMe <onboarding@resend.dev>';
      const { data, error } = await resend.emails.send({ from, to, subject, html, text });
      if (!error) return { ok: true, id: data?.id, via: 'resend' };
      const msg = error.message || String(error);
      console.warn('[announcement] Resend failed for', to, '-', msg);
      return { ok: false, error: msg };
    } catch (err) {
      const msg = err.message || String(err);
      console.warn('[announcement] Resend error for', to, '-', msg);
      return { ok: false, error: msg };
    }
  }

  if (transporter) {
    const r = await sendMail(to, subject, html, text);
    return { ...r, via: r.ok ? 'gmail' : r.via };
  }

  return { ok: false, error: 'Email not configured. Set RESEND_API_KEY in whisper-backend/.env.' };
}

/** "Avinash Saini" -> "Avinash"; null/empty -> ''. */
function firstName(name) {
  if (!name) return '';
  const trimmed = String(name).trim();
  if (!trimmed) return '';
  return trimmed.split(/\s+/)[0].slice(0, 40);
}

module.exports = {
  sendWelcomeEmail,
  sendWaitlistConfirmation,
  sendVerificationEmail,
  sendVerificationEmailViaResend,
  sendPasswordResetEmail,
  sendPasswordResetEmailAny,
  sendLaunchAnnouncement,
};
