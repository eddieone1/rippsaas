import { requireAuth } from "@/lib/auth/guards";
import ROIMetrics from "@/components/roi/ROIMetrics";
import MetricsExplanation from "@/components/roi/MetricsExplanation";

/**
 * Retention Impact / ROI Page
 * 
 * Purpose: Justify the software
 * 
 * Shows:
 * - Members saved
 * - Revenue retained
 * - Churn reduction %
 * - Before vs after chart
 * - ROI multiple
 */
export default async function ROIPage() {
  await requireAuth();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Retention Impact Report
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          What am I getting for what I'm paying? Financial proof-of-value — no
          black box math.
        </p>
      </div>

      {/* ROI Metrics (includes chart) */}
      <ROIMetrics />

      {/* Metrics Explanation */}
      <MetricsExplanation />
    </div>
  );
}
