/**
 * Map Mindbody API responses to canonical models.
 */

import type { MindbodyClient, MindbodyClientVisit, MindbodyClassVisit, MindbodyContractWithPrice, MindbodySaleWithClient } from "./types";
import type { CanonicalMember, CanonicalMembership, CanonicalVisit, CanonicalPayment } from "../../models/canonical";
import { CanonicalMemberSchema, CanonicalMembershipSchema, CanonicalVisitSchema, CanonicalPaymentSchema } from "../../models/canonical";

const SOURCE = "mindbody" as const;

function toCanonicalDate(v: string | undefined | null): string {
  if (!v) return new Date().toISOString();
  if (v.includes("T")) return v;
  return `${v}T00:00:00.000Z`;
}

export function mapMindbodyClientToCanonical(c: MindbodyClient, tenantId: string): CanonicalMember {
  const id = `${tenantId}:mindbody:${c.Id}`;
  const member: CanonicalMember = {
    id,
    externalId: String(c.UniqueId ?? c.Id),
    sourceSystem: SOURCE,
    firstName: c.FirstName ?? "",
    lastName: c.LastName ?? "",
    email: c.Email ?? "",
    joinDate: toCanonicalDate(c.CreationDate ?? undefined),
    status: c.Status ?? "Active",
  };
  return CanonicalMemberSchema.parse(member);
}

export function mapMindbodyClientsToCanonical(
  clients: MindbodyClient[],
  tenantId: string
): CanonicalMember[] {
  return clients.map((c) => mapMindbodyClientToCanonical(c, tenantId));
}

export function mapMindbodyContractToCanonical(
  contract: MindbodyContractWithPrice,
  tenantId: string
): CanonicalMembership {
  const memberId = `${tenantId}:mindbody:${contract.ClientId}`;
  const id = `${tenantId}:mindbody:contract:${contract.Id}`;
  const price = contract.Price ?? contract.AmountPaid ?? 0;
  const membership: CanonicalMembership = {
    id,
    memberId,
    type: contract.ContractName ?? "Contract",
    startDate: toCanonicalDate(contract.StartDate),
    endDate: contract.EndDate ? toCanonicalDate(contract.EndDate) : null,
    status: contract.Status ?? "Active",
    price,
  };
  return CanonicalMembershipSchema.parse(membership);
}

export function mapMindbodyContractsToCanonical(
  contracts: MindbodyContractWithPrice[],
  tenantId: string
): CanonicalMembership[] {
  return contracts.map((c) => mapMindbodyContractToCanonical(c, tenantId));
}

export function mapMindbodyClientVisitToCanonical(
  v: MindbodyClientVisit,
  tenantId: string
): CanonicalVisit {
  const memberId = `${tenantId}:mindbody:${v.ClientId}`;
  const id = `${tenantId}:mindbody:visit:${v.Id ?? `${v.ClientId}-${v.StartDateTime}`}`;
  return CanonicalVisitSchema.parse({
    id,
    memberId,
    timestamp: toCanonicalDate(v.StartDateTime ?? v.EndDateTime),
    type: "gym",
    locationId: null,
  });
}

export function mapMindbodyClassVisitToCanonical(
  v: MindbodyClassVisit,
  tenantId: string
): CanonicalVisit {
  const clientId = typeof v.ClientId === "number" ? v.ClientId : parseInt(v.ClientId, 10);
  const memberId = `${tenantId}:mindbody:${clientId}`;
  const id = `${tenantId}:mindbody:classvisit:${v.Id ?? `${clientId}-${v.StartDateTime}`}`;
  return CanonicalVisitSchema.parse({
    id,
    memberId,
    timestamp: toCanonicalDate(v.StartDateTime),
    type: "class",
    locationId: v.ClassId != null ? String(v.ClassId) : null,
  });
}

function paymentStatusFromMindbody(sale: MindbodySaleWithClient): "paid" | "failed" | "refunded" {
  // TODO: Map Mindbody sale/payment status to canonical; may differ by account.
  const paid = (sale.AmountPaid ?? 0) >= (sale.AmountDue ?? 0);
  return paid ? "paid" : "failed";
}

export function mapMindbodySaleToCanonicalPayments(
  sale: MindbodySaleWithClient,
  tenantId: string
): CanonicalPayment[] {
  const memberId = sale.ClientId != null ? `${tenantId}:mindbody:${sale.ClientId}` : "";
  if (!memberId) return [];
  const payments = sale.Payments;
  if (payments && payments.length > 0) {
    return payments.map((p, i) => {
      const id = `${tenantId}:mindbody:sale:${sale.Id}:payment:${p.Id ?? i}`;
      return CanonicalPaymentSchema.parse({
        id,
        memberId,
        amount: p.Amount ?? sale.AmountPaid ?? 0,
        status: paymentStatusFromMindbody(sale),
        date: toCanonicalDate(sale.SaleDate),
      });
    });
  }
  const id = `${tenantId}:mindbody:sale:${sale.Id}`;
  return [
    CanonicalPaymentSchema.parse({
      id,
      memberId,
      amount: sale.AmountPaid ?? sale.AmountDue ?? 0,
      status: paymentStatusFromMindbody(sale),
      date: toCanonicalDate(sale.SaleDate),
    }),
  ];
}

export function mapMindbodySalesToCanonicalPayments(
  sales: MindbodySaleWithClient[],
  tenantId: string
): CanonicalPayment[] {
  return sales.flatMap((s) => mapMindbodySaleToCanonicalPayments(s, tenantId));
}
