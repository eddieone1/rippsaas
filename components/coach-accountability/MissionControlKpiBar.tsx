"use client";

import { useState, useEffect, useRef } from "react";
import type { TeamMetrics } from "./mission-control-types";

interface MissionControlKpiBarProps {
  metrics: TeamMetrics;
  trend?: { revenueAtRisk?: number; membersAtRisk?: number; membersSaved?: number; retentionRate?: number };
}

function formatGBP(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 0 }).format(n);
}

export default function MissionControlKpiBar({ metrics, trend }: MissionControlKpiBarProps) {
  const [openCard, setOpenCard] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenCard(null);
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (openCard && popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpenCard(null);
      }
    };
    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openCard]);

  const cards = [
    {
      title: "Revenue at Risk",
      value: formatGBP(metrics.revenueAtRiskGBP),
      subtitle: "Monthly",
      variant: metrics.revenueAtRiskGBP > 500 ? "danger" : metrics.revenueAtRiskGBP > 200 ? "warning" : "default",
      trend: trend?.revenueAtRisk,
      tooltip: "Estimated monthly revenue from members currently flagged at risk. Lower is better. Trend shows change vs last 7 days.",
    },
    {
      title: "Members at Risk",
      value: metrics.membersAtRiskCount,
      subtitle: "Need attention",
      variant: metrics.membersAtRiskCount > 0 ? "warning" : "default",
      trend: trend?.membersAtRisk,
      tooltip: "Members needing coach attention due to low commitment, attendance gaps, or churn signals. Trend shows change vs last 7 days.",
    },
    {
      title: "Members Saved",
      value: metrics.membersSavedThisMonth,
      subtitle: "This month",
      variant: "success",
      trend: trend?.membersSaved,
      tooltip: "Members who returned to regular attendance after a coach touch or campaign this month. Higher is better. Trend vs last 7 days.",
    },
    {
      title: "Retention Rate",
      value: `${metrics.retentionRatePct}%`,
      subtitle: "Overall",
      variant: metrics.retentionRatePct >= 85 ? "success" : metrics.retentionRatePct >= 75 ? "default" : "warning",
      trend: trend?.retentionRate,
      tooltip: "Overall member retention rate across your gym. Higher is better. Trend shows change vs last 7 days.",
    },
  ];

  return (
    <div ref={popoverRef} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.title}
          className={`relative rounded-lg border bg-white p-4 shadow-sm ${
            c.variant === "danger"
              ? "border-red-300 bg-red-50/30"
              : c.variant === "warning"
                ? "border-yellow-300 bg-yellow-50/30"
                : c.variant === "success"
                  ? "border-green-300 bg-green-50/30"
                  : "border-gray-200"
          }`}
        >
          <p className="text-xs font-medium text-gray-800">{c.title}</p>
          <div className="mt-1 flex items-baseline gap-2">
            <p className="text-2xl font-bold text-gray-900">{c.value}</p>
            {c.trend != null && c.trend !== 0 && (
              <span className={`text-xs font-medium ${c.trend > 0 ? "text-green-600" : "text-red-600"}`}>
                {c.trend > 0 ? "↗" : "↘"}
                {Math.abs(c.trend)}%
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-gray-700">{c.subtitle}</p>
          {c.tooltip && (
            <div className="absolute right-2 top-2">
              <button
                type="button"
                onClick={() => setOpenCard(openCard === c.title ? null : c.title)}
                aria-label={`More info about ${c.title}`}
                aria-expanded={openCard === c.title}
                className="rounded-full p-1 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                ⓘ
              </button>
              {openCard === c.title && (
                <div
                  className="absolute right-0 top-full mt-1 z-50 w-64 rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-900 shadow-lg"
                  role="tooltip"
                >
                  {c.tooltip}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
