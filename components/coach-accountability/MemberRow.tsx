"use client";

import type { Member, Coach } from "./types";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function lastTouchDays(lastTouchAt: string | null): number | null {
  if (!lastTouchAt) return null;
  const diff = Date.now() - new Date(lastTouchAt).getTime();
  return Math.floor(diff / (24 * 60 * 60 * 1000));
}

interface MemberRowProps {
  member: Member;
  coaches: Coach[];
  isSelected: boolean;
  onSelect: () => void;
  onLogTouch: () => void;
  onAssign: () => void;
}

export default function MemberRow({
  member,
  coaches,
  isSelected,
  onSelect,
  onLogTouch,
  onAssign,
}: MemberRowProps) {
  const days = lastTouchDays(member.lastTouchAt);
  const owner = coaches.find((c) => c.id === member.ownerCoachId);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => e.key === "Enter" && onSelect()}
      className={`cursor-pointer rounded-lg border p-3 transition-colors ${
        isSelected
          ? "border-lime-500 bg-lime-50"
          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-700">
          {getInitials(member.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 truncate">{member.name}</span>
            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-800">
              {member.plan}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span
              className={`text-xs font-semibold ${
                member.healthScore <= 30
                  ? "text-red-600"
                  : member.healthScore <= 50
                    ? "text-yellow-600"
                    : "text-lime-600"
              }`}
            >
              {member.healthScore}
            </span>
            <span className="text-xs text-gray-600">·</span>
            <span className="text-xs text-gray-700">
              {["", "↓", "↓↓", "↓↓↓"][member.habitDecay]} habit
            </span>
            {member.reasons.slice(0, 2).map((r) => (
              <span
                key={r}
                className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-800"
              >
                {r}
              </span>
            ))}
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-2 text-xs text-gray-700">
            <span className="text-gray-700">
              {owner ? owner.name : "Unassigned"}
            </span>
            <span className="text-gray-700">
              Last touch: {days != null ? `${days}d` : "—"}
            </span>
          </div>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onLogTouch();
              }}
              className="rounded-lg bg-lime-100 px-2 py-1 text-xs font-medium text-lime-700 hover:bg-lime-200"
            >
              Log touch
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
              className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
            >
              Open
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAssign();
              }}
              className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
            >
              Assign
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
