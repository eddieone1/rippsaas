"use client";

import { useEffect, useState, useRef } from "react";
import type { DashboardMetricsData } from "@/components/dashboard/DashboardContent";

/**
 * Dashboard Metrics Component
 *
 * Displays key metrics in a clean, actionable format:
 * - At-risk member count
 * - Average commitment score
 * - Revenue at risk
 * - Revenue saved
 * When initialData is provided (e.g. from DashboardContent), no fetch is made.
 */
export default function DashboardMetrics({
  initialData,
}: {
  initialData?: DashboardMetricsData | null;
}) {
  const [data, setData] = useState<DashboardMetricsData | null>(initialData ?? null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData != null) {
      setData(initialData);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/dashboard/metrics");
        if (!response.ok) throw new Error("Failed to fetch metrics");
        const metrics = await response.json();
        if (!cancelled) setData(metrics);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load metrics");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [initialData]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="h-4 w-24 bg-gray-200 rounded mb-4"></div>
            <div className="h-8 w-16 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-800">
          {error || "Failed to load dashboard metrics"}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {/* Members at Risk */}
      <MetricCard
        title="Members at Risk"
        value={data.atRiskCount}
        subtitle="Need attention"
        icon="⚠️"
        variant={data.atRiskCount > 0 ? "warning" : "default"}
        trend={null}
        tooltip="Members flagged with low commitment or long gaps since their last visit. Use the list below to prioritise outreach and prevent churn."
      />

      {/* Average Commitment Score */}
      <MetricCard
        title="Avg Commitment Score"
        value={data.avgCommitmentScore}
        subtitle={`/100 ${getCommitmentLabel(data.avgCommitmentScore)}`}
        icon="📊"
        variant={data.avgCommitmentScore < 50 ? "warning" : "default"}
        trend={null}
        tooltip="Average of all members’ commitment scores (0–100). Higher means stronger engagement; below 50 suggests more members need attention."
      />

      {/* Revenue at Risk */}
      <MetricCard
        title="Revenue at Risk"
        value={`£${data.revenueAtRisk.toLocaleString()}`}
        subtitle="Monthly"
        icon="💰"
        variant={data.revenueAtRisk > 500 ? "danger" : data.revenueAtRisk > 200 ? "warning" : "default"}
        trend={null}
        tooltip="Estimated monthly revenue from members currently at risk. This is what you could lose if they churn without intervention."
      />

      {/* Revenue Saved */}
      <MetricCard
        title="Revenue Saved"
        value={`£${data.revenueSaved.toLocaleString()}`}
        subtitle="Last 90 days"
        icon="✅"
        variant="success"
        trend={null}
        tooltip="Revenue retained from members who reengaged after campaigns or coach actions in the last 90 days. See ROI for full breakdown."
      />
    </div>
  );
}

function getCommitmentLabel(score: number): string {
  if (score >= 80) return "High";
  if (score >= 60) return "Good";
  if (score >= 40) return "Moderate";
  return "Low";
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: string;
  variant: "default" | "warning" | "danger" | "success";
  trend: number | null;
  tooltip?: string;
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  variant,
  tooltip,
}: MetricCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<"top" | "bottom">("top");
  const cardRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showTooltip && tooltip && tooltipRef.current && cardRef.current) {
      const cardRect = cardRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      if (cardRect.top - tooltipRect.height < 12) {
        setTooltipPosition("bottom");
      } else {
        setTooltipPosition("top");
      }
    }
  }, [showTooltip, tooltip]);

  const variantStyles = {
    default: "border-gray-200",
    warning: "border-yellow-300 bg-yellow-50/30",
    danger: "border-red-300 bg-red-50/30",
    success: "border-green-300 bg-green-50/30",
  };

  return (
    <div
      ref={cardRef}
      className={`relative rounded-lg border ${variantStyles[variant]} bg-white p-6 shadow-sm`}
      onMouseEnter={() => tooltip && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>

      {tooltip && showTooltip && (
        <div
          ref={tooltipRef}
          className={`absolute left-1/2 z-[9999] w-64 -translate-x-1/2 px-1 pointer-events-none ${
            tooltipPosition === "top" ? "bottom-full mb-2" : "top-full mt-2"
          }`}
        >
          <div className="relative rounded-lg bg-gray-900 px-3 py-2.5 text-left text-sm font-normal leading-snug text-white shadow-lg">
            {tooltip}
            <span
              className={`absolute left-1/2 h-0 w-0 -translate-x-1/2 border-4 border-transparent ${
                tooltipPosition === "top"
                  ? "top-full -mt-px border-t-gray-900"
                  : "bottom-full -mb-px border-b-gray-900"
              }`}
              aria-hidden
            />
          </div>
        </div>
      )}
    </div>
  );
}
