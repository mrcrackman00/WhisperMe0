# Resend Template Setup (Vercel — abhi domain nahi)

## 1. Resend Dashboard mein template banao

1. [Resend Dashboard](https://resend.com/emails) → **Templates** → **Create Template**
2. **From:** `WhisperMe <onboarding@resend.dev>` (Resend testing, no domain needed)
3. **Subject:** `Reset your WhisperMe password`
4. **Preview text:** `Click the link to set a new password`

## 2. HTML paste karo

`password-reset.html` file ka content copy karke Resend editor mein paste karo (Ctrl+V).

## 3. Variable add karo

Template mein `{{{RESET_LINK}}}` use hua hai. Resend mein:

- **Variable name:** `RESET_LINK`
- **Type:** string
- **Fallback:** (optional) `https://whisper-me-flame.vercel.app`

Editor mein `{{` type karo to variable add kar sakte ho.

## 4. Template publish karo

**Publish** → Template ID copy karo (e.g. `f3b9756c-f4f4-44da-bc00-9f7903c8a83f`)

## 5. Render env var add karo

`RESEND_PASSWORD_RESET_TEMPLATE_ID` = template ID

Ab backend is template ko use karega. Agar yeh env var set nahi hai, to default inline HTML use hoga.
