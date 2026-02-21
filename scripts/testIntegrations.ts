/**
 * Development script: connect to Mindbody and Glofox using env credentials,
 * fetch sample data (last 30–90 days), log counts of members, memberships, visits, payments.
 *
 * Usage:
 *   MINDBODY_API_KEY=... MINDBODY_SITE_ID=... MINDBODY_ACCESS_TOKEN=... \
 *   GLOFOX_ACCESS_TOKEN=... [GLOFOX_BASE_URL=...] \
 *   npx tsx scripts/testIntegrations.ts
 */

import { syncMindbody } from "../src/integrations/sync";
import { syncGlofox } from "../src/integrations/sync";

const TENANT_ID = process.env.TEST_TENANT_ID ?? "test-tenant-1";

function sinceDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

async function main() {
  console.log("--- Integration test (sample data, last 30–90 days) ---\n");

  const since = sinceDaysAgo(90);

  if (process.env.MINDBODY_ACCESS_TOKEN) {
    console.log("Mindbody:");
    try {
      const result = await syncMindbody({ tenantId: TENANT_ID, since });
      console.log("  members:", result.members.length);
      console.log("  memberships:", result.memberships.length);
      console.log("  visits:", result.visits.length);
      console.log("  payments:", result.payments.length);
    } catch (err) {
      console.error("  error:", err instanceof Error ? err.message : err);
    }
    console.log("");
  } else {
    console.log("Mindbody: skipped (set MINDBODY_API_KEY, MINDBODY_SITE_ID, MINDBODY_ACCESS_TOKEN to run)\n");
  }

  if (process.env.GLOFOX_ACCESS_TOKEN) {
    console.log("Glofox:");
    try {
      const result = await syncGlofox({ tenantId: TENANT_ID, since });
      console.log("  members:", result.members.length);
      console.log("  memberships:", result.memberships.length);
      console.log("  visits:", result.visits.length);
      console.log("  payments:", result.payments.length);
    } catch (err) {
      console.error("  error:", err instanceof Error ? err.message : err);
    }
    console.log("");
  } else {
    console.log("Glofox: skipped (set GLOFOX_ACCESS_TOKEN to run)\n");
  }

  console.log("Done.");
}

main();
