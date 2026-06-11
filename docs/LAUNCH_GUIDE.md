# floCRM Launch Guide – Step-by-Step

This guide is **specific to this codebase**. It assumes you've read the [README](../README.md) and may have already done local dev setup. It focuses on production launch and what's unique to this project.

---

## Go to Market – Todo List

| # | Task | Notes |
|---|------|-------|
| 1 | Run migration 034 | `supabase/migrations/034_missing_schema_for_launch.sql` – required for gym address, campaign segments, member billing |
| 2 | Run any missing migrations 022–033 | If you only ran 000_all_migrations_combined (stops at 021), run 022–034 in order |
| 3 | Create Supabase project (if needed) | Run all migrations 001–034 |
| 4 | Configure Supabase custom SMTP | Resend SMTP for verification/password-reset emails – see [SUPABASE_EMAIL_CONFIG.md](./SUPABASE_EMAIL_CONFIG.md) |
| 5 | Set Supabase Site URL + redirect URLs | To your production domain |
| 6 | Create Stripe products + prices | Starter £49/mo + Growth £79/mo per location → `NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID`, `NEXT_PUBLIC_STRIPE_GROWTH_PRICE_ID` |
| 7 | Add Stripe webhook | `https://<your-domain>/api/webhooks/stripe` for checkout + subscription events |
| 8 | Set all env vars in Vercel | Supabase, Stripe, Resend, SUPPORT_EMAIL, CRON_SECRET (generate with `openssl rand -hex 32`) |
| 9 | Set `NEXT_PUBLIC_APP_URL` | Your production URL (e.g. `https://app.yourdomain.com`) |
| 10 | Add custom domain in Vercel | Point DNS to Vercel |
| 11 | Verify domain in Resend | For production sender (e.g. `noreply@yourdomain.com`) |
| 12 | (Optional) Configure Twilio | For SMS campaigns – `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` |

**Post-launch:** Sign up, complete onboarding, run a test campaign, upgrade via Stripe Checkout.

---

## Pre-flight: What's Already Done?

Before starting, check what you've already configured:

| Item | Where to check | Skip Phase if done |
|------|----------------|--------------------|
| Supabase project exists | Supabase Dashboard | 2.1 |
| Migrations applied | Supabase SQL Editor → run `SELECT * FROM gyms LIMIT 1` (if tables exist, some migrations ran) | 2.2 |
| `.env.local` has Supabase + Stripe + Resend | Local `.env.local` | 7.1 (copy to Vercel) |
| Stripe product/price created | Stripe Dashboard → Products | 4.1 |
| Stripe webhook configured | Stripe Dashboard → Webhooks | 4.3 |
| Vercel project connected | Vercel Dashboard | 8.1 |
| Custom SMTP in Supabase | Supabase → Project Settings → Auth → SMTP | 3.1 |

**Existing project docs to reference:**
- [SUPABASE_EMAIL_CONFIG.md](./SUPABASE_EMAIL_CONFIG.md) – Resend SMTP for auth emails
- [ALL_MIGRATIONS_CHECKLIST.md](../ALL_MIGRATIONS_CHECKLIST.md) – Migration list (note: stops at 021; migrations 022–034 exist)
- [src/integrations/README.md](../src/integrations/README.md) – Mindbody/Glofox integration layer (used by test script; member sync API not wired yet)

---

## Project-Specific Overview

| Integration | Platform (env) | Per-Gym (Settings) | Notes |
|-------------|---------------|---------------------|-------|
| **Supabase** | Required | — | Multi-tenant via `gym_id` |
| **Stripe** | Required | — | Checkout + webhook in `app/api/` |
| **Resend** | `RESEND_API_KEY` | Settings → **Email & SMS** (Resend key, sender email) | Fallback: `onboarding@resend.dev` |
| **Twilio** | `TWILIO_*` | Settings → **Email & SMS** (account, from number) | Optional |
| **Cron** | `CRON_SECRET` | — | Defined in `vercel.json` |
| **Support** | `SUPPORT_EMAIL` | — | Uses Resend |
| **Mindbody / Glofox** | — | Settings → **Studio** | Credentials stored per gym; member sync API returns "not implemented yet" |

**Settings structure** (from `SettingsNav`): Get started → Branding, Email & SMS | Retention → Auto outreach, Memberships, Members | Scale → Studio, Staff | Account → Subscription, Personal, Gym profile.

---

## Phase 1: Prerequisites

- [ ] Supabase, Stripe, Resend, Vercel accounts (README lists these)
- [ ] Twilio (optional, for SMS)
- [ ] Domain for production (e.g. `app.yourdomain.com`; code fallback is `rip.app`)

---

## Phase 2: Database Setup

### 2.1 Create Supabase Project (if not done)

Per README: create project, run `001_initial_schema.sql`. For full schema, run all migrations below.

### 2.2 Run Migrations

**Important:** `000_all_migrations_combined.sql` only includes migrations 001–021. It does **not** include 022–034. You must either:

- Run each migration file in order, or
- Run 000, then run 022, 023, …, 034 individually

**Full migration order** (with gaps – some numbers were skipped historically):

```
001, 005, 006, 007, 008, 009, 018, 019, 020, 021, 022, 023, 024, 025, 026, 027, 028, 029, 030, 031, 032, 033, 034, 035, 036, 037, 038
```

**034 is required for launch** – gym address, campaign `target_segment`/`include_cancelled`, member billing/geo. **035 is required** – adds `date_of_birth` and `distance_from_gym_km` for CSV upload and birthday features.

### 2.3 Get Supabase Keys

Project Settings → API → copy URL, anon key, service_role key.

---

## Phase 3: Supabase Auth & Email

Follow [SUPABASE_EMAIL_CONFIG.md](./SUPABASE_EMAIL_CONFIG.md). Configure custom SMTP (Resend) so verification and password-reset emails are reliable. Set Site URL and redirect URLs to your production domain.

---

## Phase 4: Stripe Setup

1. Create **Starter** (£49/month per location) and **Growth** (£79/month per location) recurring prices → `NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID`, `NEXT_PUBLIC_STRIPE_GROWTH_PRICE_ID`
2. Get publishable + secret keys
3. Webhook: `https://<your-domain>/api/webhooks/stripe` for `checkout.session.completed`, `customer.subscription.*`

---

## Phase 5: Resend (Email)

- **Platform:** `RESEND_API_KEY` – default for all gyms
- **Per-gym:** Settings → **Email & SMS** – Resend API key, sender email, sender name. Gyms can use their own domain if verified in Resend.
- Default sender when unset: `onboarding@resend.dev` (Resend test domain)

---

## Phase 6: Twilio (SMS) – Optional

- **Platform:** `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- **Per-gym:** Settings → **Email & SMS** – Twilio credentials, SMS from number

---

## Phase 7: Environment Variables

Copy from `.env.local.example`. Ensure:

- `CRON_SECRET` – generate with `openssl rand -hex 32`; required for Vercel cron
- `NEXT_PUBLIC_APP_URL` – production URL (e.g. `https://app.yourdomain.com`)
- All vars from `.env.local.example` (Supabase, Stripe, Resend, SUPPORT_EMAIL, CRON_SECRET, optional Twilio)

---

## Phase 8: Vercel Deployment

1. Connect repo, add env vars (same as Phase 7)
2. Set `NEXT_PUBLIC_APP_URL` for production
3. Add custom domain
4. Cron jobs in `vercel.json` – **Important:** Vercel Cron Jobs do not send `Authorization: Bearer <CRON_SECRET>` by default. See "Manual Steps" below for how to configure cron auth.

| Job | Path | Schedule (UTC) |
|-----|------|----------------|
| Commitment scores | `/api/cron/commitment-scores` | 02:00 |
| At-risk detection | `/api/cron/at-risk-detection` | 03:00 |
| Coach actions | `/api/cron/coach-actions` | 04:00 |
| Interventions | `/api/cron/interventions` | 09:00 |
| Subscription nudges (audit + subscribe) | `/api/cron/subscription-nudges` | 10:00 |

---

## Phase 9: Post-Deploy Verification

- [ ] Sign up → verification email
- [ ] Onboarding: welcome → gym info (UK address lookup) → choose plan (Starter/Growth or free audit) → upload
- [ ] Dashboard, members, campaigns
- [ ] Settings → Gym profile (address), Subscription (Upgrade → Stripe Checkout)
- [ ] Run email campaign
- [ ] Subscription nurture emails (audit day-1, subscribe day-3/7) via `/api/cron/subscription-nudges`
- [ ] Free audit form at `/audit` persists to `audit_requests` (migration 038)

---

## Phase 10: Studio Integrations (Mindbody / Glofox)

**Settings → Studio** – gyms can add Mindbody (API key, Site ID, access token) and Glofox (access token, optional base URL). Credentials are stored per gym.

**Current state:** `/api/sync/members` returns "Member sync integrations are not implemented yet." The `src/integrations` layer exists and can be tested with `npm run test-integrations` (uses env vars). Per-gym credentials are saved but the sync API is not wired to use them yet.

---

## Quick Reference: Env Vars

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role |
| `NEXT_PUBLIC_APP_URL` | Yes | App URL |
| `STRIPE_SECRET_KEY` | Yes | Stripe secret |
| `STRIPE_PUBLISHABLE_KEY` | Yes | Stripe publishable |
| `STRIPE_WEBHOOK_SECRET` | Yes | Webhook signing secret |
| `NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID` | Yes | Starter plan Stripe price |
| `NEXT_PUBLIC_STRIPE_GROWTH_PRICE_ID` | Yes | Growth plan Stripe price |
| `RESEND_API_KEY` | Yes | Default for campaigns |
| `SUPPORT_EMAIL` | Yes | Support form recipient |
| `CRON_SECRET` | Yes | Cron job auth |
| `TWILIO_*` | No | SMS (optional) |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Billing is not configured" | Set `NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID` and/or `NEXT_PUBLIC_STRIPE_GROWTH_PRICE_ID` |
| "No billing account found. Subscribe first." | Non-subscribers use Upgrade (Checkout), not Billing Portal |
| Nurture emails not sending | Run migration `038_plan_id_nurture_audit.sql`; set `CRON_SECRET`; check Resend |
| Gym info / campaign create fails | Run migration `034_missing_schema_for_launch.sql` |
| Emails not sending | Check `RESEND_API_KEY`; gym sender in Settings → Email & SMS |
| Cron not running | Set `CRON_SECRET` in Vercel; check cron logs |

---

## Manual Steps (You Must Do These)

### Vercel Cron Auth

All cron routes require `Authorization: Bearer <CRON_SECRET>`. Vercel Cron Jobs do **not** send this header automatically.

**Option A – External cron (recommended):** Use [cron-job.org](https://cron-job.org) or similar:

1. Create a cron job for each endpoint (e.g. `https://your-domain.com/api/cron/interventions`)
2. Set schedule (e.g. daily at 9:00 UTC)
3. Add custom header: `Authorization: Bearer YOUR_CRON_SECRET`
4. Disable the corresponding job in Vercel if it would run without the header

**Option B – Vercel Cron:** If your Vercel plan supports custom headers for cron, configure `Authorization: Bearer ${CRON_SECRET}` in the cron job settings.

### Member Sync (Mindbody / Glofox)

The `/api/sync/members` route is not implemented. To enable it:

1. In `app/api/sync/members/route.ts`, read the gym's credentials from `gym_studio_integrations`
2. Call the adapters in `src/integrations/` (Mindbody, Glofox)
3. Map the response to your `members` table and upsert

The integration layer exists (`npm run test-integrations`); it needs to be wired to the sync API.
