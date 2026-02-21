import { redirect } from "next/navigation";
import { getGymContext } from "@/lib/supabase/get-gym-context";
import { createClient } from "@/lib/supabase/server";
import DashboardContent from "@/components/dashboard/DashboardContent";
import DashboardGreeting from "@/components/dashboard/DashboardGreeting";
import ProductTourWrapper from "@/components/onboarding/ProductTourWrapper";

/**
 * Main Dashboard Page
 * 
 * Purpose: Instant clarity for owners
 * 
 * Shows:
 * - Key metrics (at-risk count, commitment score, revenue metrics)
 * - Habit decay trend chart
 * - "Who needs attention today" list
 * 
 * UX Principle: Clean, actionable, no clutter
 */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { imported?: string; updated?: string };
}) {
  const { gymId } = await getGymContext();

  if (!gymId) {
    redirect("/onboarding/gym-info");
  }

  // Fetch gym branding and check tour status
  const supabase = await createClient();
  const { data: gym } = await supabase
    .from("gyms")
    .select("name, logo_url, brand_primary_color, brand_secondary_color")
    .eq("id", gymId)
    .single();

  const primaryColor = gym?.brand_primary_color || "#84cc16";
  const secondaryColor = gym?.brand_secondary_color || "#65a30d";

  // Check user and profile
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: userProfile } = user
    ? await supabase
        .from("users")
        .select("full_name, has_completed_tour, role")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  const showTour =
    user && userProfile
      ? userProfile.has_completed_tour === false || userProfile.has_completed_tour === null
      : !!user;

  return (
    <>
      {showTour && user && <ProductTourWrapper userId={user.id} />}
      <div>
        {/* Header with greeting */}
        <div className="mb-8">
          <DashboardGreeting
            userName={userProfile?.full_name ?? user?.email?.split("@")[0] ?? null}
          />
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          {gym?.name && (
            <p className="mt-1 text-sm text-gray-600">{gym.name}</p>
          )}
        </div>

        {/* Success message (upload) */}
        {(searchParams.imported || searchParams.updated) && (
          <div className="mb-6 rounded-md bg-green-50 p-4">
            <p className="text-sm text-green-800">
              {searchParams.imported && searchParams.updated && (
                <>Successfully imported {searchParams.imported} members and updated {searchParams.updated} members.</>
              )}
              {searchParams.imported && !searchParams.updated && (
                <>Successfully imported {searchParams.imported} members!</>
              )}
              {searchParams.updated && !searchParams.imported && (
                <>Successfully updated {searchParams.updated} members.</>
              )}
            </p>
          </div>
        )}

        {/* Metrics, chart, and attention list — single fetch, shared data */}
        <DashboardContent userRole={(userProfile as { role?: "owner" | "admin" | "coach" } | null)?.role ?? null} />
      </div>
    </>
  );
}
