/**
 * Glofox API response types and zod schemas.
 * Base URL configurable per tenant (GLOFOX_BASE_URL); default pattern: https://api.glofox.com/v2
 * TODO: Field names can differ across Glofox tenants; normalise in mapper where needed.
 */

import { z } from "zod";

// --- Pagination (common pattern) ---
export const GlofoxPaginationSchema = z.object({
  total: z.number().optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
  page: z.number().optional(),
}).passthrough();

// --- Members (GET /members) ---
export const GlofoxMemberSchema = z.object({
  id: z.string().or(z.number()).transform(String),
  _id: z.string().optional(),
  name: z.string().optional(),
  first_name: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().optional().default(""),
  created_at: z.string().optional(),
  join_date: z.string().optional(),
  status: z.string().optional().default("active"),
}).passthrough();
export type GlofoxMember = z.infer<typeof GlofoxMemberSchema>;

export const GlofoxMembersResponseSchema = z.object({
  data: z.array(GlofoxMemberSchema).optional().default([]),
  members: z.array(GlofoxMemberSchema).optional().default([]),
  pagination: GlofoxPaginationSchema.optional(),
}).passthrough();
export type GlofoxMembersResponse = z.infer<typeof GlofoxMembersResponseSchema>;

// --- Memberships (GET /memberships) ---
export const GlofoxMembershipSchema = z.object({
  id: z.string().or(z.number()).transform(String),
  _id: z.string().optional(),
  member_id: z.string().optional(),
  memberId: z.string().optional(),
  name: z.string().optional(),
  type: z.string().optional().default("membership"),
  start_date: z.string().optional(),
  end_date: z.string().optional().nullable(),
  status: z.string().optional().default("active"),
  price: z.number().optional(),
  amount: z.number().optional(),
}).passthrough();
export type GlofoxMembership = z.infer<typeof GlofoxMembershipSchema>;

export const GlofoxMembershipsResponseSchema = z.object({
  data: z.array(GlofoxMembershipSchema).optional().default([]),
  memberships: z.array(GlofoxMembershipSchema).optional().default([]),
  pagination: GlofoxPaginationSchema.optional(),
}).passthrough();
export type GlofoxMembershipsResponse = z.infer<typeof GlofoxMembershipsResponseSchema>;

// --- Attendances / visits (GET /attendances) ---
export const GlofoxAttendanceSchema = z.object({
  id: z.string().or(z.number()).optional(),
  member_id: z.string().optional(),
  memberId: z.string().optional(),
  date: z.string().optional(),
  timestamp: z.string().optional(),
  type: z.string().optional(),
  location_id: z.string().optional(),
  class_id: z.string().optional(),
}).passthrough();
export type GlofoxAttendance = z.infer<typeof GlofoxAttendanceSchema>;

export const GlofoxAttendancesResponseSchema = z.object({
  data: z.array(GlofoxAttendanceSchema).optional().default([]),
  attendances: z.array(GlofoxAttendanceSchema).optional().default([]),
  pagination: GlofoxPaginationSchema.optional(),
}).passthrough();
export type GlofoxAttendancesResponse = z.infer<typeof GlofoxAttendancesResponseSchema>;

// --- Bookings (GET /bookings) - can represent class visits ---
export const GlofoxBookingSchema = z.object({
  id: z.string().or(z.number()).optional(),
  member_id: z.string().optional(),
  memberId: z.string().optional(),
  class_id: z.string().optional(),
  date: z.string().optional(),
  checked_in: z.boolean().optional(),
}).passthrough();
export type GlofoxBooking = z.infer<typeof GlofoxBookingSchema>;

export const GlofoxBookingsResponseSchema = z.object({
  data: z.array(GlofoxBookingSchema).optional().default([]),
  bookings: z.array(GlofoxBookingSchema).optional().default([]),
  pagination: GlofoxPaginationSchema.optional(),
}).passthrough();
export type GlofoxBookingsResponse = z.infer<typeof GlofoxBookingsResponseSchema>;

// --- Payments (GET /payments or /invoices) ---
export const GlofoxPaymentSchema = z.object({
  id: z.string().or(z.number()).transform(String),
  member_id: z.string().optional(),
  memberId: z.string().optional(),
  amount: z.number(),
  status: z.string().optional(),
  date: z.string().optional(),
  created_at: z.string().optional(),
}).passthrough();
export type GlofoxPayment = z.infer<typeof GlofoxPaymentSchema>;

export const GlofoxPaymentsResponseSchema = z.object({
  data: z.array(GlofoxPaymentSchema).optional().default([]),
  payments: z.array(GlofoxPaymentSchema).optional().default([]),
  invoices: z.array(GlofoxPaymentSchema).optional().default([]),
  pagination: GlofoxPaginationSchema.optional(),
}).passthrough();
export type GlofoxPaymentsResponse = z.infer<typeof GlofoxPaymentsResponseSchema>;
