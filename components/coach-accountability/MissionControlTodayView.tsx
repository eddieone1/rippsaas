"use client";

import ChampActionCard, { type PlaybookAction } from "@/components/coach/ChampActionCard";
import { CHAMP_CATEGORIES, type ChampCategoryId } from "@/lib/coach-actions/champ";

export interface PlaybookChampData {
  assignedToday: PlaybookAction[];
  urgent: PlaybookAction[];
  champGroups: { categoryId: ChampCategoryId; actions: PlaybookAction[] }[];
  praiseSuggestions: { memberId: string; memberName: string }[];
}

const CATEGORY_ORDER: ChampCategoryId[] = [
  "connect",
  "help",
  "activate",
  "monitor",
  "praise",
];

interface MissionControlTodayViewProps {
  playbookData: PlaybookChampData | null;
  onSelectMember: (memberId: string) => void;
}

/**
 * Today / CHAMP view for Coach Accountability.
 * Replaces inbox when "Today" tab is selected.
 */
export default function MissionControlTodayView({
  playbookData,
  onSelectMember,
}: MissionControlTodayViewProps) {
  if (!playbookData) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6">
        <p className="text-sm text-gray-600">Loading today&apos;s actions…</p>
      </div>
    );
  }

  const hasAnyActions =
    playbookData.assignedToday.length > 0 ||
    playbookData.praiseSuggestions.length > 0;

  if (!hasAnyActions) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
        <p className="text-base font-medium text-gray-700">
          No actions assigned for today
        </p>
        <p className="mt-1 text-sm text-gray-600">
          Check your inbox for at-risk members, or ask your manager to assign
          members to you.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="shrink-0">
        <h2 className="text-sm font-semibold text-gray-900">Today&apos;s CHAMP</h2>
        <p className="text-xs text-gray-600">
          Connect · Help · Activate · Monitor · Praise
        </p>
      </div>
      <div className="space-y-4">
        {CATEGORY_ORDER.map((categoryId) => {
          const group = playbookData.champGroups.find(
            (g) => g.categoryId === categoryId
          );
          const config = CHAMP_CATEGORIES.find((c) => c.id === categoryId);
          const actions = group?.actions ?? [];
          const praiseMembers =
            categoryId === "praise" ? playbookData.praiseSuggestions : [];

          return (
            <ChampActionCard
              key={categoryId}
              categoryId={categoryId}
              suggestedActions={config?.suggestedActions ?? []}
              actions={actions}
              praiseMemberNames={praiseMembers}
              onSelectMember={onSelectMember}
            />
          );
        })}
      </div>
    </div>
  );
}
