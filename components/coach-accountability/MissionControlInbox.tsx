"use client";

import { useState } from "react";
import type { Member, Coach } from "./mission-control-types";

type InboxTab = "all" | "high_risk" | "uncontacted" | "follow_up" | "unassigned";
type SortKey = "priority" | "decay_velocity" | "commitment" | "last_contact";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000));
}

interface MissionControlInboxProps {
  members: Member[];
  coaches: Coach[];
  selectedId: string | null;
  currentCoachId: string;
  onSelect: (id: string) => void;
}

export default function MissionControlInbox({
  members,
  coaches,
  selectedId,
  currentCoachId,
  onSelect,
}: MissionControlInboxProps) {
  const [tab, setTab] = useState<InboxTab>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("priority");

  const filtered = members.filter((m) => {
    if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (tab === "high_risk" && m.riskLevel !== "high") return false;
    if (tab === "uncontacted" && m.lastInteractionDate) return false;
    if (tab === "follow_up") {
      const days = daysSince(m.lastInteractionDate);
      if (days == null || days < 5) return false;
    }
    if (tab === "unassigned" && m.coachOwnerId !== "") return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "priority") {
      const risk = (r: string) => (r === "high" ? 3 : r === "moderate" ? 2 : 1);
      return risk(b.riskLevel) - risk(a.riskLevel);
    }
    if (sort === "decay_velocity") return b.habitDecayVelocity - a.habitDecayVelocity;
    if (sort === "commitment") return a.commitmentScore - b.commitmentScore;
    if (sort === "last_contact") {
      const da = daysSince(a.lastInteractionDate) ?? 999;
      const db = daysSince(b.lastInteractionDate) ?? 999;
      return da - db;
    }
    return 0;
  });

  const unassignedCount = members.filter((m) => !m.coachOwnerId || m.coachOwnerId === "").length;
  const tabs: { id: InboxTab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "high_risk", label: "High Risk" },
    { id: "uncontacted", label: "Uncontacted" },
    { id: "follow_up", label: "Follow-up Due" },
    { id: "unassigned", label: unassignedCount > 0 ? `Unassigned (${unassignedCount})` : "Unassigned" },
  ];

  return (
    <div className="flex h-full flex-col rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 p-3">
        <h2 className="text-sm font-semibold text-gray-900">Today's At-Risk Members</h2>
        <div className="mt-2 flex flex-wrap gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded px-2.5 py-1 text-xs font-medium ${
                tab === t.id ? "bg-lime-100 text-lime-800" : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <input
          type="search"
          placeholder="Search members..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-600 focus:border-lime-500 focus:outline-none focus:ring-1 focus:ring-lime-500"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-700 focus:border-lime-500 focus:outline-none"
        >
          <option value="priority">Priority (default)</option>
          <option value="decay_velocity">Highest decay velocity</option>
          <option value="commitment">Lowest commitment score</option>
          <option value="last_contact">Longest since last contact</option>
        </select>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {sorted.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-700">
            {tab === "unassigned"
              ? "No unassigned members"
              : members.length === 0
                ? "No members yet"
                : "No at-risk members match this filter"}
          </div>
        ) : (
          sorted.map((m) => {
            const owner = coaches.find((c) => c.id === m.coachOwnerId);
            const days = daysSince(m.lastInteractionDate);
            const isOwned = m.coachOwnerId === currentCoachId;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onSelect(m.id)}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  selectedId === m.id ? "border-lime-500 bg-lime-50" : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-700">
                    {getInitials(m.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium text-gray-900">{m.name}</span>
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${
                          m.riskLevel === "high"
                            ? "bg-red-100 text-red-800"
                            : m.riskLevel === "moderate"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {m.riskLevel}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-700">
                      {m.riskReasons[0] ?? "At risk"}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-700">
                      {days != null ? `No touch in ${days} days` : "No touch yet"}
                    </p>
                    {isOwned && (
                      <span className="mt-1 inline-block rounded bg-lime-100 px-1.5 py-0.5 text-xs text-lime-800">
                        Owned by you
                      </span>
                    )}
                    {!owner && m.coachOwnerId === "" && (
                      <span className="mt-1 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">
                        Unassigned
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
