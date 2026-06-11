import { headers } from "next/headers";
import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { getGymPlanAccess } from "@/lib/supabase/get-gym-plan";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ThemeVars from "@/components/layout/ThemeVars";
import { PlanFeaturesProvider } from "@/components/plan/PlanFeaturesProvider";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { gymId } = await requireAuth();

  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || headersList.get("x-invoke-path") || "";
  const isSubscriptionRequiredPage = pathname.includes("/trial-expired");
  const isUpgradePage = pathname.includes("/settings");

  if (gymId && !isSubscriptionRequiredPage && !isUpgradePage) {
    const supabase = await createClient();
    const { data: gym } = await supabase
      .from("gyms")
      .select("subscription_status, trial_ends_at, plan_id")
      .eq("id", gymId)
      .single();

    // Free audit leads — no full dashboard access
    if (gym?.plan_id === "free_audit") {
      redirect("/trial-expired");
    }

    // Legacy pre-migration accounts still on expired trial
    const GRACE_HOURS = 48;
    const trialEndsAt = gym?.trial_ends_at ? new Date(gym.trial_ends_at) : null;
    const graceEndsAt = trialEndsAt
      ? new Date(trialEndsAt.getTime() + GRACE_HOURS * 60 * 60 * 1000)
      : null;
    const legacyTrialExpired =
      gym?.subscription_status === "trialing" &&
      graceEndsAt &&
      new Date() > graceEndsAt;

    if (legacyTrialExpired) {
      redirect("/trial-expired");
    }
  }

  const planAccess = await getGymPlanAccess(gymId);

  let brandPrimary: string | null = null;
  let brandSecondary: string | null = null;
  const supabase = await createClient();
  const { data: brandingGym } = await supabase
    .from("gyms")
    .select("brand_primary_color, brand_secondary_color")
    .eq("id", gymId)
    .single();
  brandPrimary = brandingGym?.brand_primary_color ?? null;
  brandSecondary = brandingGym?.brand_secondary_color ?? null;

  return (
    <PlanFeaturesProvider access={planAccess}>
      <div className="flex min-h-screen flex-col bg-gray-50">
        <ThemeVars primary={brandPrimary} secondary={brandSecondary} />
        <Navbar planAccess={planAccess} />
        <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <Footer />
      </div>
    </PlanFeaturesProvider>
  );
}
