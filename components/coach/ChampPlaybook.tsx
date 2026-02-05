"use client";

import { useState, useEffect } from "react";
import ChampActionCard, { type PlaybookAction } from "./ChampActionCard";
import AssignedActionsSidebar from "./AssignedActionsSidebar";
import { CHAMP_CATEGORIES, type ChampCategoryId } from "@/lib/coach-actions/champ";

interface PlaybookData {
  assignedToday: PlaybookAction[];
  urgent: PlaybookAction[];
  champGroups: { categoryId: ChampCategoryId; actions: PlaybookAction[] }[];
  praiseSuggestions: { memberId: string; memberName: string }[];
}

/**
 * CHAMP Playbook: daily execution engine for coaches.
 * One screen = full context. Large action cards, color-coded, clear verbs.
 * Sidebar: Assigned Actions for Today + Urgent Action Needed.
 */
export default function ChampPlaybook() {
  const [data, setData] = useState<PlaybookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlaybook = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/coach/playbook");
      if (!res.ok) throw new Error("Failed to load playbook");
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load playbook");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaybook();
  }, []);

  const handleComplete = (actionId: string) => {
    if (!data) return;
    setData({
      ...data,
      assignedToday: data.assignedToday.filter((a) => a.id !== actionId),
      urgent: data.urgent.filter((a) => a.id !== actionId),
      champGroups: data.champGroups.map((g) => ({
        ...g,
        actions: g.actions.filter((a) => a.id !== actionId),
      })),
      praiseSuggestions: data.praiseSuggestions,
    });
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="animate-pulse space-y-4 lg:col-span-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-48 rounded-xl border border-gray-200 bg-gray-100"
            />
          ))}
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-40 rounded-xl border border-gray-200 bg-gray-100" />
          <div className="h-64 rounded-xl border border-gray-200 bg-gray-100" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-800">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-sm text-gray-600">No playbook data.</p>
      </div>
    );
  }

  const categoryOrder: ChampCategoryId[] = [
    "connect",
    "help",
    "activate",
    "monitor",
    "praise",
  ];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Main: 5 CHAMP action cards */}
      <div className="space-y-6 lg:col-span-2">
        {categoryOrder.map((categoryId) => {
          const group = data.champGroups.find((g) => g.categoryId === categoryId);
          const config = CHAMP_CATEGORIES.find((c) => c.id === categoryId);
          const actions = group?.actions ?? [];
          const praiseMembers =
            categoryId === "praise" ? data.praiseSuggestions : [];

          return (
            <ChampActionCard
              key={categoryId}
              categoryId={categoryId}
              suggestedActions={config?.suggestedActions ?? []}
              actions={actions}
              praiseMemberNames={categoryId === "praise" ? praiseMembers : undefined}
            />
          );
        })}
      </div>

      {/* Sidebar: Assigned for Today + Urgent */}
      <div className="lg:col-span-1">
        <AssignedActionsSidebar
          assignedToday={data.assignedToday}
          urgent={data.urgent}
          onComplete={handleComplete}
        />
      </div>
    </div>
  );
}
