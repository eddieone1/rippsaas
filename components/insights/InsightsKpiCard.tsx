"use client";

import type { ReactNode } from "react";

interface InsightsKpiCardProps {
  title: string;
  value: string | number;
  sub?: string | number;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  accent?: boolean;
  children?: ReactNode;
}

export default function InsightsKpiCard({
  title,
  value,
  sub,
  trend,
  trendLabel,
  accent,
  children,
}: InsightsKpiCardProps) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#2F3131] p-4 shadow-lg">
      <p className="text-xs font-medium text-white/65">{title}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className={`text-2xl font-bold ${accent ? "text-[#9EFF00]" : "text-white"}`}>
          {value}
        </span>
        {trend === "up" && (
          <span className="text-xs font-medium text-[#9EFF00]">↑ {trendLabel ?? ""}</span>
        )}
        {trend === "down" && (
          <span className="text-xs font-medium text-red-400">↓ {trendLabel ?? ""}</span>
        )}
      </div>
      {sub != null && <p className="mt-0.5 text-xs text-white/50">+{sub} previous</p>}
      {children}
    </div>
  );
}
