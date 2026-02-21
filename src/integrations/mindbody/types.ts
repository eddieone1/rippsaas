/**
 * Mindbody API response types and zod schemas for runtime validation.
 * API base: https://api.mindbodyonline.com/public/v6
 */

import { z } from "zod";

// --- Pagination (common pattern) ---
export const MindbodyPaginationSchema = z.object({
  RequestedLimit: z.number().optional(),
  RequestedOffset: z.number().optional(),
  PageSize: z.number().optional(),
  TotalResults: z.number().optional(),
});

// --- Clients (GET /client/clients) ---
export const MindbodyClientSchema = z.object({
  Id: z.number(),
  UniqueId: z.number().optional(),
  FirstName: z.string().optional().default(""),
  LastName: z.string().optional().default(""),
  Email: z.string().optional().default(""),
  CreationDate: z.string().optional().nullable(),
  Status: z.string().optional().default("Active"),
  LastModifiedDateTime: z.string().optional().nullable(),
}).passthrough();
export type MindbodyClient = z.infer<typeof MindbodyClientSchema>;

export const MindbodyClientsResponseSchema = z.object({
  PaginationResponse: MindbodyPaginationSchema.optional(),
  Clients: z.array(MindbodyClientSchema).optional().default([]),
});
export type MindbodyClientsResponse = z.infer<typeof MindbodyClientsResponseSchema>;

// --- Client visits (GET /client/clientvisits) ---
export const MindbodyClientVisitSchema = z.object({
  Id: z.number().optional(),
  ClientId: z.number(),
  StartDateTime: z.string().optional(),
  EndDateTime: z.string().optional(),
  LastModifiedDateTime: z.string().optional().nullable(),
}).passthrough();
export type MindbodyClientVisit = z.infer<typeof MindbodyClientVisitSchema>;

export const MindbodyClientVisitsResponseSchema = z.object({
  PaginationResponse: MindbodyPaginationSchema.optional(),
  Visits: z.array(MindbodyClientVisitSchema).optional().default([]),
});
export type MindbodyClientVisitsResponse = z.infer<typeof MindbodyClientVisitsResponseSchema>;

// --- Class visits (GET /class/classvisits) ---
export const MindbodyClassVisitSchema = z.object({
  Id: z.number().optional(),
  ClientId: z.string().or(z.number()),
  ClassId: z.number().optional(),
  StartDateTime: z.string().optional(),
  LastModifiedDateTime: z.string().optional().nullable(),
}).passthrough();
export type MindbodyClassVisit = z.infer<typeof MindbodyClassVisitSchema>;

export const MindbodyClassVisitsResponseSchema = z.object({
  PaginationResponse: MindbodyPaginationSchema.optional(),
  ClassVisits: z.array(MindbodyClassVisitSchema).optional().default([]),
});
export type MindbodyClassVisitsResponse = z.infer<typeof MindbodyClassVisitsResponseSchema>;

// --- Client contracts / memberships (GET /client/clientcontracts) ---
export const MindbodyContractSchema = z.object({
  Id: z.number(),
  ClientId: z.number(),
  ContractName: z.string().optional().default(""),
  StartDate: z.string().optional(),
  EndDate: z.string().optional().nullable(),
  Status: z.string().optional().default("Active"),
  LastModifiedDateTime: z.string().optional().nullable(),
}).passthrough();
export type MindbodyContract = z.infer<typeof MindbodyContractSchema>;

// TODO: Price may come from a different endpoint or nested object; field names can differ by account.
export const MindbodyContractWithPriceSchema = MindbodyContractSchema.extend({
  Price: z.number().optional(),
  AmountPaid: z.number().optional(),
});
export type MindbodyContractWithPrice = z.infer<typeof MindbodyContractWithPriceSchema>;

export const MindbodyClientContractsResponseSchema = z.object({
  PaginationResponse: MindbodyPaginationSchema.optional(),
  Contracts: z.array(MindbodyContractWithPriceSchema).optional().default([]),
});
export type MindbodyClientContractsResponse = z.infer<typeof MindbodyClientContractsResponseSchema>;

// --- Sales / payments (GET /sale/sales) ---
export const MindbodySaleSchema = z.object({
  Id: z.number(),
  SaleDate: z.string().optional(),
  LastModifiedDateTime: z.string().optional().nullable(),
}).passthrough();
export type MindbodySale = z.infer<typeof MindbodySaleSchema>;

// TODO: ClientId and Amount may be in Sale or in related Payments; structure can differ by site.
export const MindbodySaleWithClientSchema = MindbodySaleSchema.extend({
  ClientId: z.number().optional(),
  AmountPaid: z.number().optional(),
  AmountDue: z.number().optional(),
  Payments: z.array(z.object({
    Id: z.number().optional(),
    Amount: z.number().optional(),
    Type: z.string().optional(),
  }).passthrough()).optional().default([]),
}).passthrough();
export type MindbodySaleWithClient = z.infer<typeof MindbodySaleWithClientSchema>;

export const MindbodySalesResponseSchema = z.object({
  PaginationResponse: MindbodyPaginationSchema.optional(),
  Sales: z.array(MindbodySaleWithClientSchema).optional().default([]),
});
export type MindbodySalesResponse = z.infer<typeof MindbodySalesResponseSchema>;
