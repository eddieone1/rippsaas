import { requireAuth } from "@/lib/auth/guards";
import ApprovalsPageClient from "./ApprovalsPageClient";

/**
 * Approvals page - interventions pending approval.
 * Uses gymId as tenantId for the interventions system.
 */
export default async function ApprovalsPage() {
  const { gymId } = await requireAuth();

  // Use gymId as tenantId for interventions. When Prisma has per-gym tenants,
  // this will show the correct data. Falls back to demo-tenant for development.
  const tenantId = gymId ?? process.env.INTERVENTIONS_DEMO_TENANT_ID ?? "demo-tenant";

  return <ApprovalsPageClient tenantId={tenantId} />;
}
