import { getGymPlanAccess } from "@/lib/supabase/get-gym-plan";
import { type PlanFeature, planFeatureErrorMessage } from "@/lib/plan-features";
import { ApiAuthError } from "@/lib/auth/guards";

export async function requirePlanFeature(
  gymId: string,
  feature: PlanFeature
): Promise<void> {
  const access = await getGymPlanAccess(gymId);
  if (!access.features[feature]) {
    throw new ApiAuthError(planFeatureErrorMessage(feature), 403);
  }
}

/** CSV upload allowed during onboarding before subscription is active */
export async function requireCsvUploadAccess(
  gymId: string,
  userId: string
): Promise<void> {
  const access = await getGymPlanAccess(gymId);
  if (access.features.csv_upload) return;

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data: user } = await supabase
    .from("users")
    .select("onboarding_completed_at")
    .eq("id", userId)
    .single();

  if (!user?.onboarding_completed_at) return;

  throw new ApiAuthError(planFeatureErrorMessage("csv_upload"), 403);
}
