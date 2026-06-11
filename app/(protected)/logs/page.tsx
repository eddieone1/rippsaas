import { requireAuth } from "@/lib/auth/guards";
import LogsPageClient from "./LogsPageClient";

/**
 * Logs page - intervention logs for the current gym.
 * Uses gymId as tenantId for consistent mapping with the intervention system.
 */
export default async function LogsPage() {
  const { gymId } = await requireAuth();
  return <LogsPageClient gymId={gymId} />;
}
