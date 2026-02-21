/**
 * Sync entry functions: call the appropriate service and return normalized data sets.
 */

import type { CanonicalSyncResult } from "../models/canonical";
import { createMindbodyService } from "./mindbody/service";
import { createGlofoxService } from "./glofox/service";

export interface SyncMindbodyOptions {
  tenantId: string;
  since?: string; // ISO datetime for incremental sync (LastModifiedDateTime)
  config?: { apiKey: string; siteId: string; accessToken: string };
}

export async function syncMindbody(options: SyncMindbodyOptions): Promise<CanonicalSyncResult> {
  const { tenantId, since, config } = options;
  const service = createMindbodyService(config);
  const [members, memberships, visits, payments] = await Promise.all([
    service.getMembers(tenantId, since),
    service.getMemberships(tenantId, since),
    service.getVisits(tenantId, since),
    service.getPayments(tenantId, since),
  ]);
  return {
    members,
    memberships,
    visits,
    payments,
    events: [], // Mindbody events (freeze, cancellation, etc.) can be added when endpoints are available
  };
}

export interface SyncGlofoxOptions {
  tenantId: string;
  since?: string;
  config?: { accessToken: string; baseUrl?: string };
}

export async function syncGlofox(options: SyncGlofoxOptions): Promise<CanonicalSyncResult> {
  const { tenantId, since, config } = options;
  const service = createGlofoxService(config);
  const [members, memberships, visits, payments] = await Promise.all([
    service.getMembers(tenantId, since),
    service.getMemberships(tenantId, since),
    service.getVisits(tenantId, since),
    service.getPayments(tenantId, since),
  ]);
  return {
    members,
    memberships,
    visits,
    payments,
    events: [],
  };
}
