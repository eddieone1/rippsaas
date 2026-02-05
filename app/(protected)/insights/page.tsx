import { redirect } from "next/navigation";
import { getGymContext } from "@/lib/supabase/get-gym-context";
import InsightsDashboard from "@/components/insights/InsightsDashboard";

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: { time_range?: string };
}) {
  const { gymId } = await getGymContext();

  if (!gymId) {
    redirect("/onboarding/gym-info");
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Insights</h1>
        <p className="mt-2 text-sm text-gray-600">
          Are we winning? See whether retention efforts are working over time.
        </p>
      </div>

      <InsightsDashboard />
    </div>
  );
}
