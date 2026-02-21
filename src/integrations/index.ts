/**
 * Integration layer: Mindbody & Glofox APIs → canonical models.
 * Use syncMindbody / syncGlofox for full sync, or createMindbodyService / createGlofoxService for per-resource fetching.
 */

export { syncMindbody, syncGlofox } from "./sync";
export type { SyncMindbodyOptions, SyncGlofoxOptions } from "./sync";
export { createMindbodyService } from "./mindbody/service";
export type { MindbodyService, MindbodyServiceConfig } from "./mindbody/service";
export { createGlofoxService } from "./glofox/service";
export type { GlofoxService, GlofoxServiceConfig } from "./glofox/service";
export type { CanonicalSyncResult } from "../models/canonical";
export type {
  CanonicalMember,
  CanonicalMembership,
  CanonicalVisit,
  CanonicalPayment,
  CanonicalEvent,
  SourceSystem,
} from "../models/canonical";
