"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Users, DollarSign } from "lucide-react";
import BeforeAfterChart from "./BeforeAfterChart";
import ROISummaryPanel from "./ROISummaryPanel";

interface ROIMetricsData {
  membersSaved: number;
  revenueRetained: number;
  churnReduction: number;
  roiMultiple: number;
  baselineChurnRate: number;
  currentChurnRate: number;
  softwareCost: number;
  totalCoachActions: number;
  interventionCost: number;
  avgMembershipValueUsed: number;
  sufficientData: boolean;
  hasInterventionData: boolean;
  firstInterventionAt: string | null;
  timeRange: string;
  monthlyTrend: Array<{
    month: string;
    membersAtStart: number;
    membersChurned: number;
    membersReengaged: number;
    revenueRetained: number;
  }>;
}

/**
 * Retention Impact Report — primary KPIs and chart.
 * Time range default = last 30 days. No black box math; calculations explainable.
 */
export default function ROIMetrics() {
  const [data, setData] = useState<ROIMetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState("30days");

  useEffect(() => {
    fetchMetrics();
  }, [timeRange]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/roi/metrics?time_range=${timeRange}`);
      if (!response.ok) {
        throw new Error("Failed to fetch ROI metrics");
      }
      const metrics = await response.json();
      setData(metrics);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load metrics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded bg-gray-200" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-xl border-2 border-gray-200 bg-white"
            />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-xl border border-gray-200 bg-gray-50" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border-2 border-red-200 bg-red-50 p-6">
        <p className="text-sm font-medium text-red-800">
          {error || "Failed to load ROI metrics"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time range: default last 30 days */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Primary metrics
        </h2>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="rounded-lg border-2 border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="30days">Last 30 days</option>
          <option value="90days">Last 90 days</option>
          <option value="6months">Last 6 months</option>
          <option value="year">Last year</option>
        </select>
      </div>

      {/* Not enough data yet — explain what's needed */}
      {data.sufficientData && !data.hasInterventionData && (
        <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">
            Not enough data yet
          </p>
          <p className="mt-1 text-sm text-amber-800">
            Complete coach actions or run campaigns to see your retention impact.
            Metrics below show zeros until you have intervention data.
          </p>
        </div>
      )}

      {/* Primary KPI cards: Revenue Saved, Members Retained, Churn Rate Reduction */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border-2 border-gray-900 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Revenue saved
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                £{data.revenueRetained.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-gray-600">
                From members re-engaged after intervention
              </p>
            </div>
            <div className="rounded-full bg-emerald-100 p-3">
              <DollarSign className="h-6 w-6 text-emerald-700" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border-2 border-gray-900 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Members retained
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {data.membersSaved}
              </p>
              <p className="mt-1 text-xs text-gray-600">
                Reengaged after campaign or coach action
              </p>
            </div>
            <div className="rounded-full bg-blue-100 p-3">
              <Users className="h-6 w-6 text-blue-700" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border-2 border-gray-900 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Churn rate reduction
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {data.churnReduction}%
              </p>
              <p className="mt-1 text-xs text-gray-600">
                {data.baselineChurnRate}% → {data.currentChurnRate}% (before → after)
              </p>
            </div>
            <div className="rounded-full bg-violet-100 p-3">
              <TrendingUp className="h-6 w-6 text-violet-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Before & After: churn comparison + inflection point */}
      <BeforeAfterChart
        monthlyTrend={data.monthlyTrend ?? []}
        baselineChurnRate={data.baselineChurnRate}
        currentChurnRate={data.currentChurnRate}
        firstInterventionAt={data.firstInterventionAt}
      />

      {/* ROI Summary Panel: coach actions, members saved, ROI multiple, assumptions */}
      <ROISummaryPanel
        totalCoachActions={data.totalCoachActions}
        membersSaved={data.membersSaved}
        roiMultiple={data.roiMultiple}
        revenueRetained={data.revenueRetained}
        interventionCost={data.interventionCost}
        softwareCost={data.softwareCost}
        avgMembershipValueUsed={data.avgMembershipValueUsed}
      />
    </div>
  );
}
