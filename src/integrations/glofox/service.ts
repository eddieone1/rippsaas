/**
 * Glofox integration service: exposes getMembers, getMemberships, getVisits, getPayments
 * returning canonical models. Multi-tenant via tenantId and configurable base URL.
 */

import { getGlofoxAuthFromEnv } from "./auth";
import { createGlofoxClient } from "./client";
import {
  fetchAllMembers,
  fetchAllMemberships,
  fetchAllAttendances,
  fetchAllBookings,
  fetchAllPayments,
} from "./fetchers";
import {
  mapGlofoxMembersToCanonical,
  mapGlofoxMembershipsToCanonical,
  mapGlofoxAttendanceToCanonical,
  mapGlofoxBookingToCanonical,
  mapGlofoxPaymentsToCanonical,
} from "./mapper";
import type { CanonicalMember, CanonicalMembership, CanonicalVisit, CanonicalPayment } from "../../models/canonical";

export interface GlofoxServiceConfig {
  accessToken: string;
  baseUrl?: string;
}

export function createGlofoxService(config?: GlofoxServiceConfig) {
  const auth = config ?? getGlofoxAuthFromEnv();
  const client = createGlofoxClient(auth);

  return {
    async getMembers(tenantId: string, since?: string): Promise<CanonicalMember[]> {
      const { list } = await fetchAllMembers(client, since);
      return mapGlofoxMembersToCanonical(list, tenantId);
    },

    async getMemberships(tenantId: string, since?: string): Promise<CanonicalMembership[]> {
      const { list } = await fetchAllMemberships(client, since);
      return mapGlofoxMembershipsToCanonical(list, tenantId);
    },

    async getVisits(tenantId: string, since?: string): Promise<CanonicalVisit[]> {
      const [attendances, bookings] = await Promise.all([
        fetchAllAttendances(client, since),
        fetchAllBookings(client, since),
      ]);
      const visitFromAttendances = (attendances.list ?? []).map((a) =>
        mapGlofoxAttendanceToCanonical(a, tenantId)
      );
      const visitFromBookings = (bookings.list ?? []).map((b) =>
        mapGlofoxBookingToCanonical(b, tenantId)
      );
      return [...visitFromAttendances, ...visitFromBookings];
    },

    async getPayments(tenantId: string, since?: string): Promise<CanonicalPayment[]> {
      const { list } = await fetchAllPayments(client, since);
      return mapGlofoxPaymentsToCanonical(list, tenantId);
    },
  };
}

export type GlofoxService = ReturnType<typeof createGlofoxService>;
