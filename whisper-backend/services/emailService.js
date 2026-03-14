/**
 * Email service — Nodemailer + Gmail for transactional emails.
 * Setup: Enable 2FA on your Google account, then create an App Password
 * at https://myaccount.google.com/apppasswords
 */
const nodemailer = require('nodemailer');

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

async function sendMail(to, subject, html) {
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

async function sendWaitlistConfirmation(to, name) {
  return sendMail(to, "You're on the WhisperMe waitlist", `
    <h1>You're in!</h1>
    <p>Hi ${name || 'there'},</p>
    <p>You're on the list. We'll notify you when WhisperMe launches.</p>
    <p>— The WhisperMe team</p>
  `);
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

module.exports = {
  sendWelcomeEmail,
  sendWaitlistConfirmation,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordResetEmailAny,
};
