import { createClient } from "@/lib/supabase/server";
import { buildPlanAccess, type PlanAccess } from "@/lib/plan-features";

export async function getGymPlanAccess(gymId: string): Promise<PlanAccess> {
  const supabase = await createClient();
  const { data: gym } = await supabase
    .from("gyms")
    .select("subscription_status, plan_id")
    .eq("id", gymId)
    .single();

  if (!gym) {
    return buildPlanAccess({ subscription_status: "canceled", plan_id: null });
  }

  return buildPlanAccess({
    subscription_status: gym.subscription_status,
    plan_id: gym.plan_id,
  });
}
