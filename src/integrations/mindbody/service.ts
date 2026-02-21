/**
 * Mindbody integration service: exposes getMembers, getMemberships, getVisits, getPayments
 * returning canonical models. Multi-tenant via tenantId in canonical ids.
 */

import { getMindbodyAuthFromEnv } from "./auth";
import { createMindbodyClient } from "./client";
import {
  fetchAllMembers,
  fetchAllClientVisits,
  fetchAllClassVisits,
  fetchAllClientContracts,
  fetchAllSales,
} from "./fetchers";
import {
  mapMindbodyClientsToCanonical,
  mapMindbodyContractsToCanonical,
  mapMindbodyClientVisitToCanonical,
  mapMindbodyClassVisitToCanonical,
  mapMindbodySalesToCanonicalPayments,
} from "./mapper";
import type { CanonicalMember, CanonicalMembership, CanonicalVisit, CanonicalPayment } from "../../models/canonical";

export interface MindbodyServiceConfig {
  apiKey: string;
  siteId: string;
  accessToken: string;
}

export function createMindbodyService(config?: MindbodyServiceConfig) {
  const auth = config ?? getMindbodyAuthFromEnv();
  const client = createMindbodyClient(auth);

  return {
    async getMembers(tenantId: string, since?: string): Promise<CanonicalMember[]> {
      const { Clients } = await fetchAllMembers(client, since);
      return mapMindbodyClientsToCanonical(Clients, tenantId);
    },

    async getMemberships(tenantId: string, since?: string): Promise<CanonicalMembership[]> {
      const { Contracts } = await fetchAllClientContracts(client, since);
      return mapMindbodyContractsToCanonical(Contracts, tenantId);
    },

    async getVisits(tenantId: string, since?: string): Promise<CanonicalVisit[]> {
      const [clientVisits, classVisits] = await Promise.all([
        fetchAllClientVisits(client, since),
        fetchAllClassVisits(client, since),
      ]);
      const gymVisits = (clientVisits.Visits ?? []).map((v) =>
        mapMindbodyClientVisitToCanonical(v, tenantId)
      );
      const classVisitsMapped = (classVisits.ClassVisits ?? []).map((v) =>
        mapMindbodyClassVisitToCanonical(v, tenantId)
      );
      return [...gymVisits, ...classVisitsMapped];
    },

    async getPayments(tenantId: string, since?: string): Promise<CanonicalPayment[]> {
      const { Sales } = await fetchAllSales(client, since);
      return mapMindbodySalesToCanonicalPayments(Sales, tenantId);
    },
  };
}

export type MindbodyService = ReturnType<typeof createMindbodyService>;
