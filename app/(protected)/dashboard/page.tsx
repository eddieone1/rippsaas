import { redirect } from "next/navigation";
import { getGymContext } from "@/lib/supabase/get-gym-context";
import { createClient } from "@/lib/supabase/server";
import DashboardContent from "@/components/dashboard/DashboardContent";
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

  const primaryColor = gym?.brand_primary_color || "#2563EB";
  const secondaryColor = gym?.brand_secondary_color || "#1E40AF";

  // Check if user has completed the tour
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  let showTour = false;
  if (user) {
    const { data: userProfile } = await supabase
      .from("users")
      .select("has_completed_tour")
      .eq("id", user.id)
      .maybeSingle();

    if (userProfile) {
      showTour = userProfile.has_completed_tour === false || userProfile.has_completed_tour === null;
    } else {
      showTour = true;
    }
  }

  return (
    <>
      {showTour && user && <ProductTourWrapper userId={user.id} />}
      <div>
        {/* Header */}
        <div className="mb-8">
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
        <DashboardContent />
      </div>
    </>
  );
}
