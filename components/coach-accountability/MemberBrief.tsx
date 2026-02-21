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

const STATUS_LABELS: Record<string, string> = {
  at_risk: "At Risk",
  slipping: "Slipping",
  win_back: "Win-back",
  stable: "Stable",
};

interface MemberBriefProps {
  member: Member | null;
  coaches: Coach[];
  /** Touches in last 14 days and days since last touch for summary */
  touchSummary?: { touchesLast14Days: number; daysSinceLastTouch: number | null };
  onLogTouch: () => void;
  onLaunchPlay: () => void;
  onMarkSaved?: (saved: boolean) => void;
  children: React.ReactNode; // Touch timeline
}

export default function MemberBrief({
  member,
  coaches,
  touchSummary,
  onLogTouch,
  onLaunchPlay,
  onMarkSaved,
  children,
}: MemberBriefProps) {
  if (!member) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
        <p className="text-gray-700">Select a member from the inbox</p>
      </div>
    );
  }

  const owner = coaches.find((c) => c.id === member.ownerCoachId);
  const days = lastTouchDays(member.lastTouchAt);
  const nextSession = member.nextSessionAt
    ? new Date(member.nextSessionAt)
    : null;
  const daysToNext = nextSession
    ? Math.ceil((nextSession.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    : null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700">
          {getInitials(member.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-gray-900">{member.name}</h3>
            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-800">
              {member.plan}
            </span>
            <span
              className={`rounded px-2 py-0.5 text-xs font-medium ${
                member.status === "at_risk"
                  ? "bg-red-100 text-red-800"
                  : member.status === "slipping"
                    ? "bg-yellow-100 text-yellow-800"
                    : member.status === "win_back"
                      ? "bg-purple-100 text-purple-800"
                      : "bg-lime-100 text-lime-800"
              }`}
            >
              {STATUS_LABELS[member.status] ?? member.status}
            </span>
          </div>
          <p className="mt-1 text-2xl font-bold text-lime-600">{member.healthScore}</p>
          <p className="mt-1 text-sm text-gray-700">
            {nextSession
              ? `Next session in ${daysToNext}d`
              : `No booking in ${days ?? 12} days`}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="text-xs font-medium text-gray-700">Attendance trend</p>
          <div className="mt-2 h-10 flex items-end gap-0.5">
            {[40, 55, 45, 30, 25, 20, 15].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-lime-300 min-w-[4px]"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="text-xs font-medium text-gray-700">Coach touches</p>
          <p className="mt-1 text-sm text-gray-700">
            Last 14 days: {touchSummary ? touchSummary.touchesLast14Days : "—"} · Last touch:{" "}
            {touchSummary?.daysSinceLastTouch != null ? `${touchSummary.daysSinceLastTouch}d ago` : days != null ? `${days}d ago` : "—"}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="text-xs font-medium text-gray-700">Community</p>
          <p className="mt-1 text-sm text-gray-700">No group participation</p>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onLaunchPlay}
          className="flex-1 rounded-lg bg-lime-500 py-2 text-sm font-semibold text-white hover:bg-lime-600"
        >
          Launch play
        </button>
        <button
          type="button"
          onClick={onLogTouch}
          className="rounded-lg border border-gray-200 bg-gray-50 py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          Log touch
        </button>
      </div>

      {onMarkSaved && (
        <label className="mt-3 flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={!!member.saved}
            onChange={(e) => onMarkSaved(e.target.checked)}
            className="rounded border-gray-300 text-lime-500 focus:ring-lime-500"
          />
          Mark as saved (booked)
        </label>
      )}

      <div className="mt-4 border-t border-gray-200 pt-4">
        <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
          Touch timeline
        </h4>
        {children}
      </div>
    </div>
  );
}
