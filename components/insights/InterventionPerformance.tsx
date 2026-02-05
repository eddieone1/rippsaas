"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import TimeSeriesCharts from "./TimeSeriesCharts";

interface InterventionMetrics {
  template_id: string;
  template_name: string;
  campaign_name: string;
  channel: string;
  total_sent: number;
  total_re_engaged: number;
  total_no_response: number;
  total_cancelled: number;
  success_rate: number;
  avg_days_to_return: number | null;
}

interface Insights {
  fastest_to_bring_back: InterventionMetrics | null;
  highest_performing: InterventionMetrics | null;
}

export default function InterventionPerformance({
  timeRange: initialTimeRange = "all",
}: {
  timeRange?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [performance, setPerformance] = useState<InterventionMetrics[]>([]);
  const [insights, setInsights] = useState<Insights>({
    fastest_to_bring_back: null,
    highest_performing: null,
  });
  const [timeRange, setTimeRange] = useState(initialTimeRange);
  const [showMethodology, setShowMethodology] = useState(false);

  useEffect(() => {
    fetchPerformance();
  }, [timeRange]);

  const fetchPerformance = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (timeRange !== "all") {
        params.append("time_range", timeRange);
      }

      const response = await fetch(`/api/interventions/performance?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to load intervention performance");
        setLoading(false);
        return;
      }

      setPerformance(data.performance || []);
      setInsights(data.insights || { fastest_to_bring_back: null, highest_performing: null });
      setLoading(false);
    } catch (err) {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  const handleCalculateOutcomes = async () => {
    setCalculating(true);
    setError(null);

    try {
      const response = await fetch("/api/interventions/calculate-outcomes", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to calculate outcomes");
        setCalculating(false);
        return;
      }

      // Refresh performance data after calculation
      await fetchPerformance();
      setCalculating(false);
    } catch (err) {
      setError("An unexpected error occurred");
      setCalculating(false);
    }
  };

  const handleTimeRangeChange = (newRange: string) => {
    setTimeRange(newRange);
    const params = new URLSearchParams(searchParams.toString());
    if (newRange === "all") {
      params.delete("time_range");
    } else {
      params.set("time_range", newRange);
    }
    router.push(`/insights?${params.toString()}`);
  };

  // Calculate underperforming interventions
  const underperforming = performance
    .filter((p) => p.total_sent >= 5 && p.success_rate < 15)
    .sort((a, b) => a.success_rate - b.success_rate)[0];

  // Calculate channel comparison
  const channelStats = performance.reduce(
    (acc, p) => {
      if (!acc[p.channel]) {
        acc[p.channel] = { total: 0, avgDays: [] as number[] };
      }
      acc[p.channel].total++;
      if (p.avg_days_to_return !== null) {
        acc[p.channel].avgDays.push(p.avg_days_to_return);
      }
      return acc;
    },
    {} as Record<string, { total: number; avgDays: number[] }>
  );

  const fastestChannel = Object.entries(channelStats)
    .map(([channel, stats]) => ({
      channel,
      avgDays: stats.avgDays.length > 0
        ? Math.round(stats.avgDays.reduce((a, b) => a + b, 0) / stats.avgDays.length)
        : null,
    }))
    .filter((s) => s.avgDays !== null)
    .sort((a, b) => (a.avgDays || 999) - (b.avgDays || 999))[0];

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-600">Loading insights...</p>
      </div>
    );
  }

  // Empty state
  if (performance.length === 0) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            No insights yet — send your first intervention
          </h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Once you start messaging at-risk members, you'll see which interventions are most effective at getting people back through the door.
          </p>
          <Link
            href="/campaigns"
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Send your first message
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Top-Level Summary */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">
          What's working right now
        </h2>
        <p className="text-sm text-blue-800 mb-2">
          These insights are based on how members respond after receiving a message or offer.
          If someone returns within 14 days, we count that as a successful reengagement.
        </p>
        <p className="text-xs text-blue-700">
          Results are directional, not guaranteed — they help you make better decisions, faster.
        </p>
      </div>

      {/* Time Range Filters */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => handleTimeRangeChange("all")}
            className={`rounded-md px-4 py-2 text-sm font-medium ${
              timeRange === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All Time
          </button>
          <button
            onClick={() => handleTimeRangeChange("month")}
            className={`rounded-md px-4 py-2 text-sm font-medium ${
              timeRange === "month"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Last Month
          </button>
          <button
            onClick={() => handleTimeRangeChange("quarter")}
            className={`rounded-md px-4 py-2 text-sm font-medium ${
              timeRange === "quarter"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Last Quarter
          </button>
          <button
            onClick={() => handleTimeRangeChange("year")}
            className={`rounded-md px-4 py-2 text-sm font-medium ${
              timeRange === "year"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Last Year
          </button>
        </div>
        <button
          onClick={handleCalculateOutcomes}
          disabled={calculating}
          className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
        >
          {calculating ? "Calculating..." : "🔄 Recalculate"}
        </button>
      </div>

      {/* Time Series Charts */}
      <TimeSeriesCharts timeRange={timeRange} />

      {/* Insight Callouts */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {insights.highest_performing && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-6">
            <h3 className="text-sm font-medium text-green-900 mb-1">
              Best performer this period
            </h3>
            <p className="text-lg font-semibold text-green-900 mb-2">
              "{insights.highest_performing.template_name}"
            </p>
            <p className="text-sm text-green-800">
              Reengaged {insights.highest_performing.success_rate}% of members — your highest performing intervention.
            </p>
          </div>
        )}

        {fastestChannel && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
            <h3 className="text-sm font-medium text-blue-900 mb-1">
              Fastest return
            </h3>
            <p className="text-sm text-blue-800">
              Members who received {fastestChannel.channel.toUpperCase()} returned in an average of {fastestChannel.avgDays} days — faster than {fastestChannel.channel === "email" ? "SMS" : "email"}.
            </p>
          </div>
        )}

        {underperforming && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6 sm:col-span-2">
            <h3 className="text-sm font-medium text-yellow-900 mb-1">
              Needs attention
            </h3>
            <p className="text-sm text-yellow-800">
              "{underperforming.template_name}" has a {underperforming.success_rate}% response rate. Consider trying a more personal message or an offer.
            </p>
          </div>
        )}
      </div>

      {/* Intervention Performance Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
        <div className="px-4 py-5 sm:p-6">
          <div className="mb-4">
            <h2 className="text-lg font-medium text-gray-900 mb-1">
              Intervention performance
            </h2>
            <p className="text-sm text-gray-600">
              We track what happens after each message is sent and measure how often it brings members back.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Intervention
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Sent
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Reengaged
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Success rate
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Avg. days to return
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {performance.map((item) => (
                  <tr key={item.template_id}>
                    <td className="whitespace-nowrap px-4 py-4 text-sm">
                      <div className="font-medium text-gray-900">{item.template_name}</div>
                      <div className="text-xs text-gray-500">{item.campaign_name}</div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-900">
                      {item.total_sent}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-green-600 font-medium">
                      {item.total_re_engaged}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        item.success_rate >= 30
                          ? "bg-green-100 text-green-800"
                          : item.success_rate >= 15
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {item.success_rate}%
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-900">
                      {item.avg_days_to_return !== null ? `${item.avg_days_to_return} days` : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Methodology / Transparency */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <button
          onClick={() => setShowMethodology(!showMethodology)}
          className="flex w-full items-center justify-between text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          <span>How we calculate this</span>
          <span className="text-gray-500">{showMethodology ? "−" : "+"}</span>
        </button>
        {showMethodology && (
          <div className="mt-3 text-sm text-gray-600 space-y-2">
            <p>
              We track what happens after a message is sent.
              If a member returns, books, or replies within 14 days, we count it as a successful reengagement.
            </p>
            <p>
              This helps spot patterns — not make guarantees.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
