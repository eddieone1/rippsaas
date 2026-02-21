/**
 * Mindbody API fetchers with pagination and optional incremental sync (LastModifiedDateTime).
 */

import type { MindbodyClientInstance } from "./client";
import { MINDBODY_ENDPOINTS } from "./endpoints";
import {
  MindbodyClientsResponseSchema,
  MindbodyClientVisitsResponseSchema,
  MindbodyClassVisitsResponseSchema,
  MindbodyClientContractsResponseSchema,
  MindbodySalesResponseSchema,
} from "./types";

const DEFAULT_PAGE_SIZE = 200;

export interface FetchMembersOptions {
  limit?: number;
  offset?: number;
  since?: string; // ISO datetime for LastModifiedDateTime
}

export async function fetchMembers(
  client: MindbodyClientInstance,
  options: FetchMembersOptions = {}
) {
  const { limit = DEFAULT_PAGE_SIZE, offset = 0, since } = options;
  const searchParams: Record<string, string | number> = {
    limit,
    offset,
  };
  if (since) searchParams.updatedSince = since;
  const raw = await client.get<unknown>(MINDBODY_ENDPOINTS.CLIENTS, searchParams);
  return MindbodyClientsResponseSchema.parse(raw);
}

export async function fetchAllMembers(
  client: MindbodyClientInstance,
  since?: string
): Promise<{ Clients: import("./types").MindbodyClient[] }> {
  const all: import("./types").MindbodyClient[] = [];
  let offset = 0;
  while (true) {
    const res = await fetchMembers(client, { limit: DEFAULT_PAGE_SIZE, offset, since });
    const list = res.Clients ?? [];
    all.push(...list);
    if (list.length < DEFAULT_PAGE_SIZE) break;
    offset += list.length;
  }
  return { Clients: all };
}

export interface FetchVisitsOptions {
  limit?: number;
  offset?: number;
  since?: string;
  clientId?: number;
}

export async function fetchClientVisits(
  client: MindbodyClientInstance,
  options: FetchVisitsOptions = {}
) {
  const { limit = DEFAULT_PAGE_SIZE, offset = 0, since, clientId } = options;
  const searchParams: Record<string, string | number> = { limit, offset };
  if (since) searchParams.updatedSince = since;
  if (clientId !== undefined) searchParams.clientId = clientId;
  const raw = await client.get<unknown>(MINDBODY_ENDPOINTS.CLIENT_VISITS, searchParams);
  return MindbodyClientVisitsResponseSchema.parse(raw);
}

export async function fetchAllClientVisits(
  client: MindbodyClientInstance,
  since?: string
) {
  const all: import("./types").MindbodyClientVisit[] = [];
  let offset = 0;
  while (true) {
    const res = await fetchClientVisits(client, { limit: DEFAULT_PAGE_SIZE, offset, since });
    const list = res.Visits ?? [];
    all.push(...list);
    if (list.length < DEFAULT_PAGE_SIZE) break;
    offset += list.length;
  }
  return { Visits: all };
}

export async function fetchClassVisits(
  client: MindbodyClientInstance,
  options: { limit?: number; offset?: number; since?: string } = {}
) {
  const { limit = DEFAULT_PAGE_SIZE, offset = 0, since } = options;
  const searchParams: Record<string, string | number> = { limit, offset };
  if (since) searchParams.updatedSince = since;
  const raw = await client.get<unknown>(MINDBODY_ENDPOINTS.CLASS_VISITS, searchParams);
  return MindbodyClassVisitsResponseSchema.parse(raw);
}

export async function fetchAllClassVisits(
  client: MindbodyClientInstance,
  since?: string
) {
  const all: import("./types").MindbodyClassVisit[] = [];
  let offset = 0;
  while (true) {
    const res = await fetchClassVisits(client, { limit: DEFAULT_PAGE_SIZE, offset, since });
    const list = res.ClassVisits ?? [];
    all.push(...list);
    if (list.length < DEFAULT_PAGE_SIZE) break;
    offset += list.length;
  }
  return { ClassVisits: all };
}

export interface FetchContractsOptions {
  limit?: number;
  offset?: number;
  since?: string;
}

export async function fetchClientContracts(
  client: MindbodyClientInstance,
  options: FetchContractsOptions = {}
) {
  const { limit = DEFAULT_PAGE_SIZE, offset = 0, since } = options;
  const searchParams: Record<string, string | number> = { limit, offset };
  if (since) searchParams.updatedSince = since;
  const raw = await client.get<unknown>(MINDBODY_ENDPOINTS.CLIENT_CONTRACTS, searchParams);
  return MindbodyClientContractsResponseSchema.parse(raw);
}

export async function fetchAllClientContracts(
  client: MindbodyClientInstance,
  since?: string
) {
  const all: import("./types").MindbodyContractWithPrice[] = [];
  let offset = 0;
  while (true) {
    const res = await fetchClientContracts(client, { limit: DEFAULT_PAGE_SIZE, offset, since });
    const list = res.Contracts ?? [];
    all.push(...list);
    if (list.length < DEFAULT_PAGE_SIZE) break;
    offset += list.length;
  }
  return { Contracts: all };
}

export interface FetchSalesOptions {
  limit?: number;
  offset?: number;
  since?: string;
}

export async function fetchSales(
  client: MindbodyClientInstance,
  options: FetchSalesOptions = {}
) {
  const { limit = DEFAULT_PAGE_SIZE, offset = 0, since } = options;
  const searchParams: Record<string, string | number> = { limit, offset };
  if (since) searchParams.updatedSince = since;
  const raw = await client.get<unknown>(MINDBODY_ENDPOINTS.SALES, searchParams);
  return MindbodySalesResponseSchema.parse(raw);
}

export async function fetchAllSales(
  client: MindbodyClientInstance,
  since?: string
) {
  const all: import("./types").MindbodySaleWithClient[] = [];
  let offset = 0;
  while (true) {
    const res = await fetchSales(client, { limit: DEFAULT_PAGE_SIZE, offset, since });
    const list = res.Sales ?? [];
    all.push(...list);
    if (list.length < DEFAULT_PAGE_SIZE) break;
    offset += list.length;
  }
  return { Sales: all };
}
