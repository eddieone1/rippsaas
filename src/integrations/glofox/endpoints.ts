/**
 * Glofox API endpoint paths. Configurable per tenant if needed.
 */

export const GLOFOX_ENDPOINTS = {
  MEMBERS: "/members",
  MEMBERSHIPS: "/memberships",
  ATTENDANCES: "/attendances",
  CLASSES: "/classes",
  BOOKINGS: "/bookings",
  PAYMENTS: "/payments",
  INVOICES: "/invoices",
} as const;
