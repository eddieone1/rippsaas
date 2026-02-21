import { redirect } from "next/navigation";
import { getGymContext } from "@/lib/supabase/get-gym-context";
import InsightsDashboard from "@/components/insights/InsightsDashboard";

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; time_range?: string }>;
}) {
  const { gymId } = await getGymContext();

  if (!gymId) {
    redirect("/onboarding/gym-info");
  }

  const params = await searchParams;
  const tab = params.tab ?? "whats-working";
  const timeRange = params.time_range ?? "30d";

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Insights</h1>
        <p className="mt-2 text-sm text-gray-600">
          Engagement rates, churn trends, outreach performance and member stages
        </p>
      </div>
      <InsightsDashboard initialTab={tab} initialTimeRange={timeRange} />
    </div>
  );
}
