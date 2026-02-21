import { redirect, notFound } from "next/navigation";
import { getGymContext } from "@/lib/supabase/get-gym-context";
import { createClient } from "@/lib/supabase/server";
import MemberProfile from "@/components/members/MemberProfile";

/**
 * Member Profile Page
 * 
 * Purpose: This is where retention happens.
 * 
 * Shows:
 * - Commitment score gauge
 * - Habit decay timeline
 * - Engagement history
 * - Risk flags
 * - Past coach actions
 * - Recommended next action
 * - One-click coach assignment
 */
export default async function MemberDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }> | { id: string };
  searchParams: Promise<{ from?: string }> | { from?: string };
}) {
  const { gymId } = await getGymContext();

  if (!gymId) {
    redirect("/onboarding/gym-info");
  }

  const resolvedParams = await Promise.resolve(params);
  const resolvedSearch = await Promise.resolve(searchParams);
  const memberId = resolvedParams.id;
  const fromRaw = resolvedSearch?.from ?? "members";
  const backFrom =
    fromRaw === "dashboard" || fromRaw === "at-risk" ? fromRaw : "members";

  const supabase = await createClient();
  const { data: member, error } = await supabase
    .from("members")
    .select("id")
    .eq("id", memberId)
    .eq("gym_id", gymId)
    .single();

  if (error || !member) {
    notFound();
  }

  return <MemberProfile memberId={memberId} backFrom={backFrom} />;
}
