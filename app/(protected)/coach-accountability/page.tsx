import { getGymContext } from "@/lib/supabase/get-gym-context";
import { getGymPlanAccess } from "@/lib/supabase/get-gym-plan";
import CoachAccountabilityMissionControl from "@/components/coach-accountability/CoachAccountabilityMissionControl";
import PlanUpgradePanel from "@/components/plan/PlanUpgradePanel";

export default async function CoachAccountabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }> | { view?: string };
}) {
  const { user, userProfile, gymId } = await getGymContext();
  const planAccess = gymId ? await getGymPlanAccess(gymId) : null;

  if (!planAccess?.features.coach_tasks) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center py-12">
        <PlanUpgradePanel
          featureLabel="Growth"
          title="Coach task assignment"
          description="Assign retention tasks to coaches, track touches, and manage your mission control inbox. Available on the Growth plan."
        />
      </div>
    );
  }

  const currentCoachId = user?.id ?? "";
  const userRole = (userProfile?.role as string) ?? "member";
  const resolved = await Promise.resolve(searchParams);
  const initialView = resolved?.view === "today" ? "today" : "inbox";

  return (
    <CoachAccountabilityMissionControl
      currentCoachId={currentCoachId}
      userRole={userRole}
      initialLeftView={initialView}
    />
  );
}
