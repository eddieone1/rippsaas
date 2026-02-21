/**
 * Map Glofox API responses to canonical models.
 * TODO: Normalise different field names across Glofox tenants where needed.
 */

import type { GlofoxMember, GlofoxMembership, GlofoxAttendance, GlofoxBooking, GlofoxPayment } from "./types";
import type { CanonicalMember, CanonicalMembership, CanonicalVisit, CanonicalPayment } from "../../models/canonical";
import { CanonicalMemberSchema, CanonicalMembershipSchema, CanonicalVisitSchema, CanonicalPaymentSchema } from "../../models/canonical";

const SOURCE = "glofox" as const;

function toCanonicalDate(v: string | undefined | null): string {
  if (!v) return new Date().toISOString();
  if (v.includes("T")) return v;
  return `${v}T00:00:00.000Z`;
}

function normaliseGlofoxId(value: string | number): string {
  return String(value);
}

export function mapGlofoxMemberToCanonical(m: GlofoxMember, tenantId: string): CanonicalMember {
  const externalId = normaliseGlofoxId(m.id ?? m._id ?? "");
  const id = `${tenantId}:glofox:${externalId}`;
  const firstName = m.first_name ?? (m.name ? m.name.split(" ")[0] ?? "" : "") ?? "";
  const lastName = m.lastName ?? (m.name ? m.name.split(" ").slice(1).join(" ") : "") ?? "";
  const member: CanonicalMember = {
    id,
    externalId,
    sourceSystem: SOURCE,
    firstName,
    lastName,
    email: m.email ?? "",
    joinDate: toCanonicalDate(m.join_date ?? m.created_at),
    status: m.status ?? "active",
  };
  return CanonicalMemberSchema.parse(member);
}

export function mapGlofoxMembersToCanonical(
  members: GlofoxMember[],
  tenantId: string
): CanonicalMember[] {
  return members.map((m) => mapGlofoxMemberToCanonical(m, tenantId));
}

export function mapGlofoxMembershipToCanonical(
  m: GlofoxMembership,
  tenantId: string
): CanonicalMembership {
  const memberIdRef = m.member_id ?? m.memberId ?? "";
  const memberId = memberIdRef.includes(":") ? memberIdRef : `${tenantId}:glofox:${memberIdRef}`;
  const id = `${tenantId}:glofox:membership:${normaliseGlofoxId(m.id ?? m._id ?? "")}`;
  const price = m.price ?? m.amount ?? 0;
  return CanonicalMembershipSchema.parse({
    id,
    memberId,
    type: m.type ?? m.name ?? "membership",
    startDate: toCanonicalDate(m.start_date),
    endDate: m.end_date ? toCanonicalDate(m.end_date) : null,
    status: m.status ?? "active",
    price,
  });
}

export function mapGlofoxMembershipsToCanonical(
  memberships: GlofoxMembership[],
  tenantId: string
): CanonicalMembership[] {
  return memberships.map((m) => mapGlofoxMembershipToCanonical(m, tenantId));
}

export function mapGlofoxAttendanceToCanonical(
  a: GlofoxAttendance,
  tenantId: string
): CanonicalVisit {
  const memberIdRef = a.member_id ?? a.memberId ?? "";
  const memberId = memberIdRef.includes(":") ? memberIdRef : `${tenantId}:glofox:${memberIdRef}`;
  const id = `${tenantId}:glofox:attendance:${a.id ?? `${memberIdRef}-${a.date ?? a.timestamp}`}`;
  const type = (a.type?.toLowerCase().includes("class") || a.class_id) ? "class" : "gym";
  return CanonicalVisitSchema.parse({
    id,
    memberId,
    timestamp: toCanonicalDate(a.timestamp ?? a.date),
    type,
    locationId: a.location_id ?? a.class_id ?? null,
  });
}

export function mapGlofoxBookingToCanonical(
  b: GlofoxBooking,
  tenantId: string
): CanonicalVisit {
  const memberIdRef = b.member_id ?? b.memberId ?? "";
  const memberId = memberIdRef.includes(":") ? memberIdRef : `${tenantId}:glofox:${memberIdRef}`;
  const id = `${tenantId}:glofox:booking:${b.id ?? `${memberIdRef}-${b.date}`}`;
  return CanonicalVisitSchema.parse({
    id,
    memberId,
    timestamp: toCanonicalDate(b.date),
    type: "class",
    locationId: b.class_id ?? null,
  });
}

function paymentStatusFromGlofox(s: string | undefined): "paid" | "failed" | "refunded" {
  const lower = (s ?? "").toLowerCase();
  if (lower.includes("refund")) return "refunded";
  if (lower.includes("fail") || lower.includes("unpaid")) return "failed";
  return "paid";
}

export function mapGlofoxPaymentToCanonical(
  p: GlofoxPayment,
  tenantId: string
): CanonicalPayment {
  const memberIdRef = p.member_id ?? p.memberId ?? "";
  const memberId = memberIdRef.includes(":") ? memberIdRef : `${tenantId}:glofox:${memberIdRef}`;
  const id = `${tenantId}:glofox:payment:${normaliseGlofoxId(p.id)}`;
  return CanonicalPaymentSchema.parse({
    id,
    memberId,
    amount: p.amount,
    status: paymentStatusFromGlofox(p.status),
    date: toCanonicalDate(p.date ?? p.created_at),
  });
}

export function mapGlofoxPaymentsToCanonical(
  payments: GlofoxPayment[],
  tenantId: string
): CanonicalPayment[] {
  return payments.map((p) => mapGlofoxPaymentToCanonical(p, tenantId));
}
