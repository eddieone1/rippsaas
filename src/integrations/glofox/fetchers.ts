/**
 * Glofox API fetchers with pagination.
 * Endpoint paths from endpoints.ts; normalise different field names per tenant in mapper.
 */

import type { GlofoxClientInstance } from "./client";
import { GLOFOX_ENDPOINTS } from "./endpoints";
import {
  GlofoxMembersResponseSchema,
  GlofoxMembershipsResponseSchema,
  GlofoxAttendancesResponseSchema,
  GlofoxBookingsResponseSchema,
  GlofoxPaymentsResponseSchema,
} from "./types";

const DEFAULT_PAGE_SIZE = 100;

function pickList<T>(res: { data?: T[]; members?: T[] }): T[] {
  if (Array.isArray((res as { data?: T[] }).data) && (res as { data: T[] }).data.length > 0)
    return (res as { data: T[] }).data;
  if (Array.isArray((res as { members?: T[] }).members)) return (res as { members: T[] }).members;
  return [];
}

function pickListGeneric(
  res: Record<string, unknown>,
  keys: string[]
): unknown[] {
  for (const key of keys) {
    const arr = res[key];
    if (Array.isArray(arr)) return arr;
  }
  return [];
}

export interface FetchMembersOptions {
  limit?: number;
  offset?: number;
  since?: string;
}

export async function fetchMembers(
  client: GlofoxClientInstance,
  options: FetchMembersOptions = {}
) {
  const { limit = DEFAULT_PAGE_SIZE, offset = 0, since } = options;
  const searchParams: Record<string, string | number> = { limit, offset };
  if (since) searchParams.updated_after = since;
  const raw = await client.get<unknown>(GLOFOX_ENDPOINTS.MEMBERS, searchParams);
  const parsed = GlofoxMembersResponseSchema.parse(raw) as { data?: import("./types").GlofoxMember[]; members?: import("./types").GlofoxMember[] };
  const list = pickList<import("./types").GlofoxMember>(parsed);
  return { ...parsed, list };
}

export async function fetchAllMembers(
  client: GlofoxClientInstance,
  since?: string
): Promise<{ list: import("./types").GlofoxMember[] }> {
  const all: import("./types").GlofoxMember[] = [];
  let offset = 0;
  while (true) {
    const res = await fetchMembers(client, { limit: DEFAULT_PAGE_SIZE, offset, since });
    const list = res.list ?? [];
    all.push(...list);
    if (list.length < DEFAULT_PAGE_SIZE) break;
    offset += list.length;
  }
  return { list: all };
}

export interface FetchMembershipsOptions {
  limit?: number;
  offset?: number;
  since?: string;
}

export async function fetchMemberships(
  client: GlofoxClientInstance,
  options: FetchMembershipsOptions = {}
) {
  const { limit = DEFAULT_PAGE_SIZE, offset = 0, since } = options;
  const searchParams: Record<string, string | number> = { limit, offset };
  if (since) searchParams.updated_after = since;
  const raw = await client.get<unknown>(GLOFOX_ENDPOINTS.MEMBERSHIPS, searchParams);
  const parsed = GlofoxMembershipsResponseSchema.parse(raw) as Record<string, unknown>;
  const list = (pickListGeneric(parsed, ["data", "memberships"]) as import("./types").GlofoxMembership[]);
  return { ...parsed, list };
}

export async function fetchAllMemberships(
  client: GlofoxClientInstance,
  since?: string
) {
  const all: import("./types").GlofoxMembership[] = [];
  let offset = 0;
  while (true) {
    const res = await fetchMemberships(client, { limit: DEFAULT_PAGE_SIZE, offset, since });
    const list = res.list ?? [];
    all.push(...list);
    if (list.length < DEFAULT_PAGE_SIZE) break;
    offset += list.length;
  }
  return { list: all };
}

export interface FetchAttendancesOptions {
  limit?: number;
  offset?: number;
  since?: string;
}

export async function fetchAttendances(
  client: GlofoxClientInstance,
  options: FetchAttendancesOptions = {}
) {
  const { limit = DEFAULT_PAGE_SIZE, offset = 0, since } = options;
  const searchParams: Record<string, string | number> = { limit, offset };
  if (since) searchParams.updated_after = since;
  const raw = await client.get<unknown>(GLOFOX_ENDPOINTS.ATTENDANCES, searchParams);
  const parsed = GlofoxAttendancesResponseSchema.parse(raw) as Record<string, unknown>;
  const list = pickListGeneric(parsed, ["data", "attendances"]) as import("./types").GlofoxAttendance[];
  return { ...parsed, list };
}

export async function fetchAllAttendances(
  client: GlofoxClientInstance,
  since?: string
) {
  const all: import("./types").GlofoxAttendance[] = [];
  let offset = 0;
  while (true) {
    const res = await fetchAttendances(client, { limit: DEFAULT_PAGE_SIZE, offset, since });
    const list = res.list ?? [];
    all.push(...list);
    if (list.length < DEFAULT_PAGE_SIZE) break;
    offset += list.length;
  }
  return { list: all };
}

export interface FetchBookingsOptions {
  limit?: number;
  offset?: number;
  since?: string;
}

export async function fetchBookings(
  client: GlofoxClientInstance,
  options: FetchBookingsOptions = {}
) {
  const { limit = DEFAULT_PAGE_SIZE, offset = 0, since } = options;
  const searchParams: Record<string, string | number> = { limit, offset };
  if (since) searchParams.updated_after = since;
  const raw = await client.get<unknown>(GLOFOX_ENDPOINTS.BOOKINGS, searchParams);
  const parsed = GlofoxBookingsResponseSchema.parse(raw) as Record<string, unknown>;
  const list = pickListGeneric(parsed, ["data", "bookings"]) as import("./types").GlofoxBooking[];
  return { ...parsed, list };
}

export async function fetchAllBookings(
  client: GlofoxClientInstance,
  since?: string
) {
  const all: import("./types").GlofoxBooking[] = [];
  let offset = 0;
  while (true) {
    const res = await fetchBookings(client, { limit: DEFAULT_PAGE_SIZE, offset, since });
    const list = res.list ?? [];
    all.push(...list);
    if (list.length < DEFAULT_PAGE_SIZE) break;
    offset += list.length;
  }
  return { list: all };
}

export interface FetchPaymentsOptions {
  limit?: number;
  offset?: number;
  since?: string;
}

export async function fetchPayments(
  client: GlofoxClientInstance,
  options: FetchPaymentsOptions = {}
) {
  const { limit = DEFAULT_PAGE_SIZE, offset = 0, since } = options;
  const searchParams: Record<string, string | number> = { limit, offset };
  if (since) searchParams.updated_after = since;
  let raw: unknown;
  try {
    raw = await client.get<unknown>(GLOFOX_ENDPOINTS.PAYMENTS, searchParams);
  } catch {
    raw = await client.get<unknown>(GLOFOX_ENDPOINTS.INVOICES, searchParams);
  }
  const parsed = GlofoxPaymentsResponseSchema.parse(raw) as Record<string, unknown>;
  const list = (pickListGeneric(parsed, ["data", "payments", "invoices"]) as import("./types").GlofoxPayment[]);
  return { ...parsed, list };
}

export async function fetchAllPayments(
  client: GlofoxClientInstance,
  since?: string
) {
  const all: import("./types").GlofoxPayment[] = [];
  let offset = 0;
  while (true) {
    const res = await fetchPayments(client, { limit: DEFAULT_PAGE_SIZE, offset, since });
    const list = res.list ?? [];
    all.push(...list);
    if (list.length < DEFAULT_PAGE_SIZE) break;
    offset += list.length;
  }
  return { list: all };
}
