/**
 * Canonical data model for the integration layer.
 * All external systems (Mindbody, Glofox) map into these types.
 */

import { z } from "zod";

export const SOURCE_SYSTEM = z.enum(["mindbody", "glofox"]);
export type SourceSystem = z.infer<typeof SOURCE_SYSTEM>;

export const CanonicalMemberSchema = z.object({
  id: z.string(),
  externalId: z.string(),
  sourceSystem: SOURCE_SYSTEM,
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email().or(z.literal("")),
  joinDate: z.string().datetime().or(z.string()), // ISO date or date-only
  status: z.string(),
});
export type CanonicalMember = z.infer<typeof CanonicalMemberSchema>;

export const CanonicalMembershipSchema = z.object({
  id: z.string(),
  memberId: z.string(),
  type: z.string(),
  startDate: z.string(),
  endDate: z.string().nullable(),
  status: z.string(),
  price: z.number().nonnegative(),
});
export type CanonicalMembership = z.infer<typeof CanonicalMembershipSchema>;

export const VISIT_TYPE = z.enum(["gym", "class"]);
export type VisitType = z.infer<typeof VISIT_TYPE>;

export const CanonicalVisitSchema = z.object({
  id: z.string(),
  memberId: z.string(),
  timestamp: z.string(), // ISO datetime
  type: VISIT_TYPE,
  locationId: z.string().nullable(),
});
export type CanonicalVisit = z.infer<typeof CanonicalVisitSchema>;

export const PAYMENT_STATUS = z.enum(["paid", "failed", "refunded"]);
export type PaymentStatus = z.infer<typeof PAYMENT_STATUS>;

export const CanonicalPaymentSchema = z.object({
  id: z.string(),
  memberId: z.string(),
  amount: z.number(),
  status: PAYMENT_STATUS,
  date: z.string(), // ISO date or datetime
});
export type CanonicalPayment = z.infer<typeof CanonicalPaymentSchema>;

export const EVENT_TYPE = z.enum(["freeze", "cancellation_request", "downgrade"]);
export type EventType = z.infer<typeof EVENT_TYPE>;

export const CanonicalEventSchema = z.object({
  id: z.string(),
  memberId: z.string(),
  type: EVENT_TYPE,
  date: z.string(),
});
export type CanonicalEvent = z.infer<typeof CanonicalEventSchema>;

export interface CanonicalSyncResult {
  members: CanonicalMember[];
  memberships: CanonicalMembership[];
  visits: CanonicalVisit[];
  payments: CanonicalPayment[];
  events: CanonicalEvent[];
}
