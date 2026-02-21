"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface PerformanceData {
  performance: Array<{
    template_name: string;
    success_rate: number;
    total_sent: number;
    total_re_engaged: number;
    avg_days_to_return: number | null;
  }>;
  insights: {
    fastest_to_bring_back: { template_name: string; avg_days_to_return: number } | null;
    highest_performing: { template_name: string; success_rate: number } | null;
  };
}

/**
 * Dashboard widget showing "what's working" – surfaces intervention effectiveness.
 * Rip's key differentiator: see which messages bring members back.
 */
export default function InterventionEffectivenessWidget() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/interventions/performance?time_range=month")
      .then((r) => r.json())
      .then((d) => {
        if (d.performance || d.insights) setData(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm animate-pulse">
        <div className="h-5 w-40 bg-gray-200 rounded mb-4" />
        <div className="h-16 bg-gray-100 rounded" />
      </div>
    );
  }

  if (!data || (data.performance?.length ?? 0) === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">What&apos;s working</h3>
        <p className="text-sm text-gray-500 mb-4">
          No outreach data yet. Send your first campaign to see which messages bring members back.
        </p>
        <Link
          href="/plays"
          className="text-sm font-medium text-lime-600 hover:text-lime-800"
        >
          Go to Plays →
        </Link>
      </div>
    );
  }

  const { insights } = data;
  const hasInsight = insights?.fastest_to_bring_back || insights?.highest_performing;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">What&apos;s working</h3>
        <Link
          href="/insights"
          className="text-xs font-medium text-lime-600 hover:text-lime-800"
        >
          View Insights →
        </Link>
      </div>
      {hasInsight ? (
        <div className="space-y-3 text-sm">
          {insights.fastest_to_bring_back && (
            <div className="rounded-lg bg-green-50 p-3">
              <p className="font-medium text-green-800">Fastest to bring back</p>
              <p className="text-green-700 truncate" title={insights.fastest_to_bring_back.template_name}>
                &ldquo;{insights.fastest_to_bring_back.template_name}&rdquo;
              </p>
              <p className="text-xs text-green-600 mt-1">
                Avg {insights.fastest_to_bring_back.avg_days_to_return} days to return
              </p>
            </div>
          )}
          {insights.highest_performing && insights.fastest_to_bring_back?.template_name !== insights.highest_performing.template_name && (
            <div className="rounded-lg bg-lime-50 p-3">
              <p className="font-medium text-lime-800">Highest success rate</p>
              <p className="text-lime-700 truncate" title={insights.highest_performing.template_name}>
                &ldquo;{insights.highest_performing.template_name}&rdquo;
              </p>
              <p className="text-xs text-lime-600 mt-1">
                {insights.highest_performing.success_rate}% re-engagement
              </p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          Send more outreach to see which messages perform best.
        </p>
      )}
    </div>
  );
}
