"use client";

import type { InsightsTab } from "./insights-types";

const TABS: { id: InsightsTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "churn_risk", label: "Churn Risk" },
  { id: "reasons_stages", label: "Reasons & Stages" },
  { id: "campaign_impact", label: "Outreach Impact" },
];

interface InsightsTabsNavProps {
  active: InsightsTab;
  onChange: (tab: InsightsTab) => void;
}

export default function InsightsTabsNav({ active, onChange }: InsightsTabsNavProps) {
  return (
    <div className="flex gap-1 border-b border-white/[0.08]">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            active === tab.id
              ? "border-[#9EFF00] text-[#9EFF00]"
              : "border-transparent text-white/65 hover:text-white"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
