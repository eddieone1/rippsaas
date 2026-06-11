# Supabase Auth Email Configuration (Business Email)

To send verification, password reset, and magic link emails from your business domain (e.g. `noreply@yourdomain.com`), configure custom SMTP in Supabase.

## Steps

1. **Supabase Dashboard** → Your project → **Project Settings** (gear icon) → **Authentication**
2. Scroll to **SMTP Settings**
3. Enable **Custom SMTP**
4. Configure:

### Using Resend (recommended)

| Setting | Value |
|---------|-------|
| Sender email | `noreply@yourdomain.com` (must be verified in Resend) |
| Sender name | `Rip` |
| Host | `smtp.resend.com` |
| Port | `465` (SSL) or `587` (TLS) |
| Username | `resend` |
| Password | Your Resend API key |

### Using another SMTP provider

Use your provider's SMTP host, port, and credentials. The sender email should be from a domain you control (e.g. `onboarding@rip.app`).

## Verify your domain in Resend

1. Go to [Resend Dashboard](https://resend.com/domains)
2. Add your domain (e.g. `yourdomain.com`)
3. Add the DNS records Resend provides
4. Once verified, you can send from `noreply@yourdomain.com`, `hello@yourdomain.com`, etc.

## Email templates

Supabase also lets you customize the email templates (verification, password reset) under **Authentication** → **Email Templates**. You can adjust the subject, body, and branding.
