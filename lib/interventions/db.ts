import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Returns a Supabase admin client (service role) for server-side DB access.
 * This replaces the previous Prisma client.
 */
export function getDb() {
  return createAdminClient();
}

/**
 * Generate a cuid-like unique id for new rows.
 * Uses crypto.randomUUID for simplicity.
 */
export function generateId(): string {
  return crypto.randomUUID();
}
