"use client";

import type { FilterState, TimeRange } from "./insights-types";

interface InsightsFiltersRowProps {
  filters: FilterState;
  onTimeRangeChange: (v: TimeRange) => void;
  onLocationChange: (v: string) => void;
  onSegmentChange: (v: string) => void;
  onMemberFilterChange: (v: string) => void;
  /** Locations derived from real member data; only these are shown besides "All Locations". */
  locations?: string[];
}

const TIME_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: "7", label: "7 Days" },
  { value: "14", label: "14 Days" },
  { value: "30", label: "30 Days" },
  { value: "90", label: "90 Days" },
];

export default function InsightsFiltersRow({
  filters,
  onTimeRangeChange,
  onLocationChange,
  onSegmentChange,
  onMemberFilterChange,
  locations = [],
}: InsightsFiltersRowProps) {
  const inputClass =
    "rounded-full border border-white/[0.08] bg-white/5 px-4 py-2 text-sm text-white focus:border-[#9EFF00]/50 focus:outline-none focus:ring-1 focus:ring-[#9EFF00]/30";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={filters.timeRange}
        onChange={(e) => onTimeRangeChange(e.target.value as TimeRange)}
        className={inputClass}
      >
        {TIME_OPTIONS.map((o) => (
          <option key={o.value} value={o.value} className="bg-[#2F3131] text-white">
            {o.label}
          </option>
        ))}
      </select>
      <select
        value={filters.location}
        onChange={(e) => onLocationChange(e.target.value)}
        className={inputClass}
      >
        <option value="all" className="bg-[#2F3131] text-white">All Locations</option>
        {locations.map((loc) => (
          <option key={loc} value={loc.toLowerCase()} className="bg-[#2F3131] text-white">{loc}</option>
        ))}
      </select>
      <select
        value={filters.segment}
        onChange={(e) => onSegmentChange(e.target.value)}
        className={inputClass}
      >
        <option value="all" className="bg-[#2F3131] text-white">All Members</option>
        <option value="active" className="bg-[#2F3131] text-white">Active</option>
        <option value="at_risk" className="bg-[#2F3131] text-white">At Risk</option>
      </select>
      <select
        value={filters.memberFilter}
        onChange={(e) => onMemberFilterChange(e.target.value)}
        className={inputClass}
      >
        <option value="all" className="bg-[#2F3131] text-white">All Members</option>
      </select>
    </div>
  );
}
