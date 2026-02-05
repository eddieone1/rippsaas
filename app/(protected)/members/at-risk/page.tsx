import { redirect } from "next/navigation";
import { getGymContext } from "@/lib/supabase/get-gym-context";
import AtRiskMembersTable from "@/components/members/AtRiskMembersTable";

/**
 * At Risk Members Page
 * 
 * Purpose: Focused view of members needing attention
 * 
 * Features:
 * - Table view with sortable columns
 * - Filter by risk level
 * - Shows assigned coach
 * - Direct CTA to view member details
 * - Performance optimized with pagination
 */
export default async function AtRiskMembersPage() {
  const { gymId } = await getGymContext();

  if (!gymId) {
    redirect("/onboarding/gym-info");
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">At Risk Members</h1>
        <p className="mt-2 text-sm text-gray-600">
          Members requiring attention based on engagement patterns
        </p>
      </div>

      {/* Table Component */}
      <AtRiskMembersTable />
    </div>
  );
}
