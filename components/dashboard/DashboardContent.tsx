"use client";

import { useEffect, useState } from "react";
import DashboardMetrics from "@/components/dashboard/DashboardMetrics";
import HabitDecayChart from "@/components/dashboard/HabitDecayChart";
import AttentionNeededList from "@/components/dashboard/AttentionNeededList";

export interface DashboardMetricsData {
  atRiskCount: number;
  avgCommitmentScore: number;
  revenueAtRisk: number;
  revenueSaved: number;
  habitDecayTrend: Array<{
    date: string;
    dateLabel: string;
    avgCommitmentScore: number;
    memberCount: number;
  }>;
  attentionNeeded: Array<{
    id: string;
    name: string;
    riskLevel: string;
    riskScore: number;
    daysSinceLastVisit: number | null;
    lastVisitDate: string | null;
    monthlyRevenue: number;
  }>;
}

/**
 * Fetches dashboard metrics once and passes the same data to all dashboard sections.
 * Avoids three separate API calls (DashboardMetrics, HabitDecayChart, AttentionNeededList).
 */
export default function DashboardContent() {
  const [data, setData] = useState<DashboardMetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/dashboard/metrics");
        if (!response.ok) throw new Error("Failed to fetch metrics");
        const metrics = await response.json();
        if (!cancelled) setData(metrics);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="h-4 w-24 bg-gray-200 rounded mb-4" />
              <div className="h-8 w-16 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 h-64 animate-pulse rounded-lg border border-gray-200 bg-gray-50" />
          <div className="animate-pulse rounded-lg border border-gray-200 bg-white p-6">
            <div className="h-6 w-48 bg-gray-200 rounded mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <p className="text-sm text-red-800">{error || "Failed to load dashboard metrics"}</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <DashboardMetrics initialData={data} />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <HabitDecayChart initialData={data} />
        </div>
        <div className="lg:col-span-1">
          <AttentionNeededList initialData={data} />
        </div>
      </div>
    </>
  );
}
