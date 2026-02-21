# Mindbody & Glofox API Integration Layer

This module connects to Mindbody and Glofox APIs, fetches members/memberships/visits/payments, and normalises data into a canonical schema. It does **not** implement churn scoring or business logic.

## Structure

- **`/mindbody/`** – Mindbody API (auth, client, fetchers, mapper, types)
- **`/glofox/`** – Glofox API (auth, client, fetchers, mapper, types)
- **`/../models/canonical.ts`** – Canonical types: `CanonicalMember`, `CanonicalMembership`, `CanonicalVisit`, `CanonicalPayment`, `CanonicalEvent`
- **`sync.ts`** – Entry functions: `syncMindbody(tenantId, since?)`, `syncGlofox(tenantId, since?)`

## Environment variables

**Mindbody**

- `MINDBODY_API_KEY`
- `MINDBODY_SITE_ID`
- `MINDBODY_ACCESS_TOKEN`

**Glofox**

- `GLOFOX_ACCESS_TOKEN`
- `GLOFOX_BASE_URL` (optional; tenant-specific base URL, default `https://api.glofox.com/v2`)

## Usage

```ts
import { syncMindbody, syncGlofox } from "@/src/integrations";

const mindbodyData = await syncMindbody({ tenantId: "gym-123", since: "2025-01-01T00:00:00Z" });
const glofoxData = await syncGlofox({ tenantId: "gym-456", since: "2025-01-01T00:00:00Z" });
```

Or use services directly for a single resource type:

```ts
import { createMindbodyService, createGlofoxService } from "@/src/integrations";

const mindbody = createMindbodyService();
const members = await mindbody.getMembers("gym-123", since);
```

## Test script

After `npm install`, run:

```bash
npm run test-integrations
```

Requires `tsx` (added as devDependency). Set the env vars above to test against real APIs; the script fetches the last 90 days and logs counts of members, memberships, visits, and payments.
