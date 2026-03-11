/**
 * Email service — Nodemailer + Gmail for transactional emails.
 * Setup: Enable 2FA on your Google account, then create an App Password
 * at https://myaccount.google.com/apppasswords
 */
const nodemailer = require('nodemailer');

const gmailUser = process.env.GMAIL_USER;
const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
const fromEmail = process.env.FROM_EMAIL || `WhisperMe <${gmailUser}>`;

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

module.exports = {
  sendWelcomeEmail,
  sendWaitlistConfirmation,
  sendVerificationEmail,
};
