# Automated Intervention System

Plays, eligibility guardrails, approvals, sending (Email/SMS/WhatsApp), webhooks, and logging. Uses **Prisma + PostgreSQL** (separate from Supabase if you use it elsewhere).

## Tech stack

- Next.js App Router, TypeScript, Tailwind
- Prisma ORM + PostgreSQL
- zod for validation
- Provider adapters: Twilio (SMS/WhatsApp), Postmark (Email); stubbed when env not set

## Env vars

```bash
# Required for Prisma
DATABASE_URL="postgresql://user:pass@localhost:5432/gym_retention"

# Optional: demo tenant for API (default "demo-tenant")
INTERVENTIONS_DEMO_TENANT_ID=demo-tenant

# Optional: cron / daily job base URL (for links in docs)
APP_BASE_URL=https://your-app.vercel.app
DEFAULT_TIMEZONE=Europe/London

# Twilio (SMS + WhatsApp) – omit to stub
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_SMS=+1234567890
TWILIO_FROM_WHATSAPP=whatsapp:+1234567890

# Postmark (Email) – omit to stub
POSTMARK_SERVER_TOKEN=...
POSTMARK_FROM_EMAIL=noreply@yourdomain.com
```

## Setup

1. **PostgreSQL**  
   Create a DB (e.g. same as Supabase or a separate one) and set `DATABASE_URL`.

2. **Prisma**
   ```bash
   npm install
   npx prisma generate
   npx prisma migrate dev --name init_interventions
   npm run db:seed
   ```

3. **Seed**  
   Seed creates tenant `demo-tenant`, 10 members with risk snapshots, and 2 plays (14-day no visit SMS with approval, payment friction email auto-send). Run once:
   ```bash
   npm run db:seed
   ```

## Daily job (cron)

Run the batch that creates intervention candidates and sends (or queues for approval):

```bash
curl -X POST "https://your-app.vercel.app/api/interventions/run-daily?tenantId=demo-tenant"
```

- **Vercel Cron**: In `vercel.json` add:
  ```json
  {
    "crons": [{ "path": "/api/interventions/run-daily", "schedule": "0 9 * * *" }]
  }
  ```
  Then in the route read `tenantId` from query (or from auth) and call `runDailyForTenant(tenantId)`.

- **Manual / other scheduler**  
  Call `POST /api/interventions/run-daily?tenantId=...` at the desired time (e.g. 9:00 London).

Response shape: `{ created, scheduled, pendingApproval, sent, failed, skipped }`.

## Approvals

1. Open **Approvals** (`/approvals`): lists interventions with status `PENDING_APPROVAL`, grouped by play.
2. **Approve**: `POST /api/interventions/:id/approve` – sends now (or schedules to next allowed time if in quiet hours).
3. **Cancel**: `POST /api/interventions/:id/cancel` – sets status to `CANCELED`.

## Logs

- **Logs** page: `/logs` – filter by status, channel, optional member/date; shows intervention timeline and events.
- API: `GET /api/logs?tenantId=...&status=...&channel=...&limit=50&offset=0`.

## Webhooks

- **Twilio**: `POST /api/webhooks/twilio` – handle delivery/reply; update intervention status and create `MessageEvent`.  
  TODO: verify `X-Twilio-Signature` using `TWILIO_AUTH_TOKEN`.
- **Postmark**: `POST /api/webhooks/postmark` – handle delivery/bounce; map `MessageID` to intervention, update status, create event.

Configure in Twilio/Postmark dashboards:
- Twilio: Status callback URL = `{APP_BASE_URL}/api/webhooks/twilio`
- Postmark: Webhook URL = `{APP_BASE_URL}/api/webhooks/postmark`

## UI pages

- **Plays** `/plays` – list, enable/disable, link to create/edit.
- **New play** `/plays/new` – form: name, min risk, channels, requires approval, quiet hours, template body/subject.
- **Play detail** `/plays/[id]` – edit play.
- **Approvals** `/approvals` – pending interventions, approve/cancel, preview message.
- **Logs** `/logs` – filter by status/channel, view intervention and event list.

## Data model (summary)

- **Tenant** – id, name, timezone.
- **Member** – consent flags, doNotContact, contact info.
- **RiskSnapshot** – memberId, riskScore, primaryRiskReason (mock source for daily batch).
- **Play** – rules, channels, templates, guardrails (quiet hours, weekly cap, cooldown), requiresApproval.
- **Intervention** – play + member + channel, status (CANDIDATE → PENDING_APPROVAL / SCHEDULED / SENT / DELIVERED / FAILED / CANCELED), rendered body, providerMessageId.
- **MessageEvent** – QUEUED, SENT, DELIVERED, FAILED, REPLIED; payload JSON.
- **Outcome** – optional; type (CONTACTED, REPLIED, etc.), notes, occurredAt.

All under `lib/interventions/` (db, validate, time, guardrails, types, plays, engine, providers).
