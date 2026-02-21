import { getGymContext } from "@/lib/supabase/get-gym-context";
import CoachAccountabilityMissionControl from "@/components/coach-accountability/CoachAccountabilityMissionControl";

export default async function CoachAccountabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }> | { view?: string };
}) {
  const { user, userProfile } = await getGymContext();
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
