"use client";

import Link from "next/link";
import type { Coach, CoachMetrics, Task, TeamMetrics } from "./mission-control-types";
import type { Member } from "./mission-control-types";
import type { PlaybookAction } from "@/components/coach/ChampActionCard";

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function formatGBP(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 0 }).format(n);
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
  if (diff < 0) return `In ${Math.abs(diff)}d`;
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff}d ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

interface MissionControlRightPanelProps {
  coachMetrics: CoachMetrics[];
  teamMetrics: TeamMetrics;
  currentCoachId: string;
  coaches: Coach[];
  members: Member[];
  tasks: Task[];
  savedMembers: { member: Member; coachName: string; playName: string }[];
  topSavesByPlay: { playName: string; count: number }[];
  onCompleteTask: (taskId: string) => void;
  onSetReminder: () => void;
  /** From CHAMP playbook: assigned actions for today with Complete button */
  playbookAssignedToday?: PlaybookAction[];
  playbookUrgent?: PlaybookAction[];
  onCompleteChampAction?: (actionId: string) => void;
  /** From CHAMP playbook: members who re-engaged to praise */
  praiseSuggestions?: { memberId: string; memberName: string }[];
}

export default function MissionControlRightPanel({
  coachMetrics,
  teamMetrics,
  currentCoachId,
  coaches,
  members,
  tasks,
  savedMembers,
  topSavesByPlay,
  onCompleteTask,
  onSetReminder,
  playbookAssignedToday = [],
  playbookUrgent = [],
  onCompleteChampAction,
  praiseSuggestions = [],
}: MissionControlRightPanelProps) {
  const myMetrics = coachMetrics.find((m) => m.coachId === currentCoachId);

  // Coach Retention Score breakdown (mock formula)
  const activityScore = myMetrics
    ? Math.round(
        (myMetrics.contactCoveragePct * 0.4 +
          (100 - myMetrics.avgResponseTimeHours * 2) * 0.3 +
          Math.min(100, myMetrics.contactedThisWeekCount * 10) * 0.3)
      )
    : 0;
  const outcomesScore = myMetrics
    ? Math.round(
        myMetrics.saveRatePct * 0.5 +
          myMetrics.reengagementRatePct * 0.3 +
          myMetrics.behaviourImprovementRatePct * 0.2
      )
    : 0;
  const consistencyScore = myMetrics
    ? Math.round(
        Math.min(100, (myMetrics.outreachStreakDays ?? 0) * 7) * 0.5 +
          (myMetrics.contactedTodayCount > 0 ? 50 : 0) * 0.5
      )
    : 0;

  const leaderboard = [...coachMetrics].sort(
    (a, b) => b.membersSavedThisMonth - a.membersSavedThisMonth
  ).slice(0, 5);

  const tasksByStatus = {
    todo: tasks.filter((t) => t.status === "todo"),
    waiting: tasks.filter((t) => t.status === "waiting"),
    due: tasks.filter((t) => t.status === "due"),
    overdue: tasks.filter((t) => t.status === "overdue"),
    done: tasks.filter((t) => t.status === "done"),
  };

  const activeTasks = [
    ...tasksByStatus.overdue,
    ...tasksByStatus.due,
    ...tasksByStatus.todo,
    ...tasksByStatus.waiting,
  ];

  const urgencyBadge = (p: string) =>
    p === "high"
      ? "bg-red-100 text-red-800"
      : p === "medium"
        ? "bg-amber-100 text-amber-800"
        : "bg-gray-100 text-gray-800";

  return (
    <div className="flex flex-col gap-4">
      {/* 0. Urgent + Assigned for Today (from CHAMP playbook) */}
      {(playbookUrgent.length > 0 || playbookAssignedToday.length > 0) &&
        onCompleteChampAction && (
          <>
            {playbookUrgent.length > 0 && (
              <div className="rounded-xl border-2 border-red-200 bg-red-50/50 p-4">
                <h4 className="mb-3 text-sm font-bold uppercase tracking-wide text-red-800">
                  Urgent Action Needed
                </h4>
                <ul className="space-y-2">
                  {playbookUrgent.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-red-200 bg-white p-3"
                    >
                      <Link
                        href={`/members/${a.memberId}`}
                        className="min-w-0 flex-1 font-medium text-gray-900 hover:underline"
                      >
                        {a.memberName}
                      </Link>
                      <button
                        onClick={() => onCompleteChampAction(a.id)}
                        className="shrink-0 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                      >
                        Done
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {playbookAssignedToday.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <h4 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-700">
                  Assigned for Today
                </h4>
                <ul className="space-y-2">
                  {playbookAssignedToday.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 bg-gray-50/50 p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/members/${a.memberId}`}
                          className="font-medium text-gray-900 hover:underline"
                        >
                          {a.memberName}
                        </Link>
                        <p className="truncate text-xs text-gray-500">{a.title}</p>
                        <span
                          className={`mt-1 inline-block rounded px-1.5 py-0.5 text-xs font-medium ${urgencyBadge(a.priority)}`}
                        >
                          {a.priority}
                        </span>
                      </div>
                      <button
                        onClick={() => onCompleteChampAction(a.id)}
                        className="shrink-0 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                      >
                        Complete
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

      {/* Praise: members who re-engaged */}
      {praiseSuggestions.length > 0 && (
        <div className="rounded-lg border border-violet-200 bg-violet-50/50 p-4">
          <h4 className="text-base font-semibold text-gray-900">Celebrate</h4>
          <p className="mt-0.5 text-sm text-gray-600">
            Members who re-engaged recently
          </p>
          <ul className="mt-3 space-y-2">
            {praiseSuggestions.map((m) => (
              <li key={m.memberId}>
                <Link
                  href={`/members/${m.memberId}`}
                  className="block rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 hover:bg-violet-50"
                >
                  Celebrate: {m.memberName} →
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 1. Coach Performance */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h4 className="text-base font-semibold text-gray-900">Coach Performance</h4>
        <p className="text-sm text-gray-800" title="This score is based on actions + outcomes">
          Based on actions + outcomes
        </p>
        {myMetrics ? (
          <div className="mt-3 space-y-3 text-base">
            <div className="flex justify-between items-baseline gap-2">
              <span className="text-gray-900 font-medium">Contacted today / week</span>
              <span className="font-semibold text-gray-900 tabular-nums">{myMetrics.contactedTodayCount} / {myMetrics.contactedThisWeekCount}</span>
            </div>
            <div className="flex justify-between items-baseline gap-2">
              <span className="text-gray-900 font-medium">Contact coverage %</span>
              <span className="font-semibold text-gray-900 tabular-nums">{myMetrics.contactCoveragePct}%</span>
            </div>
            <div className="flex justify-between items-baseline gap-2">
              <span className="text-gray-900 font-medium">Avg response time</span>
              <span className="font-semibold text-gray-900 tabular-nums">{myMetrics.avgResponseTimeHours}h</span>
            </div>
            <div className="flex justify-between items-baseline gap-2">
              <span className="text-gray-900 font-medium">Response rate</span>
              <span className="font-semibold text-gray-900 tabular-nums">{myMetrics.responseRatePct}%</span>
            </div>
            <div className="flex justify-between items-baseline gap-2">
              <span className="text-gray-900 font-medium">Re-engagement rate</span>
              <span className="font-semibold text-gray-900 tabular-nums">{myMetrics.reengagementRatePct}%</span>
            </div>
            <div className="flex justify-between items-baseline gap-2">
              <span className="text-gray-900 font-medium">Retention saves (month)</span>
              <span className="font-semibold text-lime-700 tabular-nums">{myMetrics.membersSavedThisMonth}</span>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-lg bg-lime-50 p-3">
              <span className="font-semibold text-gray-900">Coach Retention Score</span>
              <div className="relative h-12 w-12">
                <svg className="h-12 w-12 -rotate-90">
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="4"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    fill="none"
                    stroke="#84cc16"
                    strokeWidth="4"
                    strokeDasharray={`${(myMetrics.coachRetentionScore / 100) * 126} 126`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-base font-bold text-gray-900">
                  {myMetrics.coachRetentionScore}
                </span>
              </div>
            </div>
            <details className="mt-2 text-sm text-gray-800">
              <summary className="cursor-pointer font-medium">Score breakdown</summary>
              <ul className="mt-1 space-y-1 pl-4 text-gray-900">
                <li>Activity (40%): {activityScore} – coverage, response time, follow-up</li>
                <li>Outcomes (40%): {outcomesScore} – save rate, re-engagement, behaviour</li>
                <li>Consistency (20%): {consistencyScore} – streak, daily completion</li>
              </ul>
            </details>
          </div>
        ) : (
          <p className="mt-2 text-base text-gray-800">No metrics for current coach</p>
        )}
      </div>

      {/* 2. Retention Impact (ROI) */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h4 className="text-base font-semibold text-gray-900">Retention Impact</h4>
        <div className="mt-3 space-y-3 text-base">
          <div className="flex justify-between items-baseline gap-2">
            <span className="text-gray-900 font-medium">Members saved (month)</span>
            <span className="font-semibold text-lime-700 tabular-nums">{teamMetrics.membersSavedThisMonth}</span>
          </div>
          <div className="flex justify-between items-baseline gap-2">
            <span className="text-gray-900 font-medium">Revenue retained</span>
            <span className="font-semibold text-gray-900 tabular-nums">{formatGBP(teamMetrics.revenueRetainedThisMonthGBP)}</span>
          </div>
        </div>
        <p className="mt-2 text-sm text-gray-800">
          Saved = high risk + returned to threshold within 14 days after intervention
        </p>
        {topSavesByPlay.length > 0 && (
          <div className="mt-3">
            <p className="text-sm font-medium text-gray-900">Top save interventions</p>
            <ul className="mt-1 space-y-1">
              {topSavesByPlay.slice(0, 3).map((p, i) => (
                <li key={i} className="text-sm text-gray-900">
                  {p.playName}: {p.count}
                </li>
              ))}
            </ul>
          </div>
        )}
        {savedMembers.length > 0 && (
          <div className="mt-3">
            <p className="text-sm font-medium text-gray-900">Last saved</p>
            <ul className="mt-1 space-y-1">
              {savedMembers.slice(0, 3).map((s, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-900">
                  <span className="font-medium">{s.member.name}</span>
                  <span className="text-gray-800">– {s.coachName}</span>
                  <span className="rounded bg-gray-100 px-1">{s.playName}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 3. Leaderboard */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h4 className="text-base font-semibold text-gray-900">Leaderboard</h4>
        <p className="mt-0.5 text-sm text-gray-600">Top coaches by retention saves this month</p>
        <div className="mt-4 space-y-3">
          {leaderboard.map((m, i) => {
            const coach = coaches.find((c) => c.id === m.coachId);
            const badge =
              i === 0 ? "Retention MVP" : m.outreachStreakDays && m.outreachStreakDays >= 7 ? "7-day Outreach Streak" : undefined;
            const rankStyle =
              i === 0
                ? "border-amber-200 bg-amber-50/50"
                : i === 1
                  ? "border-gray-200 bg-gray-50/50"
                  : i === 2
                    ? "border-amber-100 bg-amber-50/30"
                    : "border-gray-100";
            const rankMedal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
            return (
              <div
                key={m.coachId}
                className={`flex items-center gap-3 rounded-lg border p-3 transition-shadow hover:shadow-sm ${rankStyle}`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-base font-bold tabular-nums shadow-sm">
                  {rankMedal ?? `#${i + 1}`}
                </span>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-800">
                  {coach ? getInitials(coach.name) : "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-gray-900">{coach?.name ?? "Unknown"}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-lime-700 tabular-nums">{m.membersSavedThisMonth} saves</span>
                    {m.outreachStreakDays != null && m.outreachStreakDays > 0 && (
                      <span className="text-xs text-gray-600">{m.outreachStreakDays}d streak</span>
                    )}
                  </div>
                  {badge && (
                    <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                      {badge}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Follow-Ups & Tasks */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h4 className="text-base font-semibold text-gray-900">Follow-Ups & Tasks</h4>
          <button
            type="button"
            onClick={onSetReminder}
            className="text-sm font-medium text-lime-700 hover:text-lime-800"
          >
            Set Reminder
          </button>
        </div>
        <div className="mt-3 space-y-2">
          {activeTasks.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-center text-base text-gray-800">
              No tasks
            </p>
          ) : (
            activeTasks.map((t) => {
              const taskMember = members.find((m) => m.id === t.memberId);
              const isOverdue3 = t.status === "overdue" && (() => {
                const diff = Math.floor((Date.now() - new Date(t.dueDate).getTime()) / (24 * 60 * 60 * 1000));
                return diff > 3;
              })();
              return (
                <div
                  key={t.id}
                  className="flex items-center gap-3 rounded-lg border border-gray-100 p-2"
                >
                  <input
                    type="checkbox"
                    checked={t.status === "done"}
                    onChange={() => t.status !== "done" && onCompleteTask(t.id)}
                    className="rounded border-gray-300 text-lime-500"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-medium text-gray-900">{taskMember?.name ?? "Member"}: {t.title}</p>
                    <p className="text-sm text-gray-800">
                      Due: {formatDate(t.dueDate)} ·{" "}
                      <span
                        className={`rounded px-1 ${
                          t.status === "overdue"
                            ? "bg-red-100 text-red-800"
                            : t.status === "due"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {t.status}
                      </span>
                    </p>
                    {isOverdue3 && (
                      <span className="mt-1 inline-block rounded bg-red-100 px-2 py-1 text-sm font-medium text-red-900">
                        Escalate to manager
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
