"use client";

import { useState } from "react";
import Link from "next/link";
import type { PlaybookAction } from "./ChampActionCard";

interface AssignedActionsSidebarProps {
  assignedToday: PlaybookAction[];
  urgent: PlaybookAction[];
  onComplete: (actionId: string) => void;
}

/**
 * Right-hand sidebar: Assigned Actions for Today + Urgent Action Needed.
 * Coach-specific; each action shows member name, type, urgency, one-click complete.
 */
export default function AssignedActionsSidebar({
  assignedToday,
  urgent,
  onComplete,
}: AssignedActionsSidebarProps) {
  const [completingId, setCompletingId] = useState<string | null>(null);

  const handleComplete = async (actionId: string) => {
    setCompletingId(actionId);
    try {
      const res = await fetch(`/api/coach/actions/${actionId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) onComplete(actionId);
    } finally {
      setCompletingId(null);
    }
  };

  const urgencyBadge = (p: string) =>
    p === "high"
      ? "bg-red-100 text-red-800"
      : p === "medium"
      ? "bg-amber-100 text-amber-800"
      : "bg-gray-100 text-gray-800";

  return (
    <aside className="w-full shrink-0 space-y-6 lg:w-80">
      {/* Urgent Action Needed */}
      <div className="rounded-xl border-2 border-red-200 bg-red-50/50 p-4">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-red-800">
          Urgent Action Needed
        </h3>
        {urgent.length === 0 ? (
          <p className="text-sm text-gray-600">None right now.</p>
        ) : (
          <ul className="space-y-2">
            {urgent.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-red-200 bg-white p-3"
              >
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/members/${a.memberId}`}
                    className="font-medium text-gray-900 hover:underline"
                  >
                    {a.memberName}
                  </Link>
                  <p className="truncate text-xs text-gray-500">{a.title}</p>
                </div>
                <button
                  onClick={() => handleComplete(a.id)}
                  disabled={completingId === a.id}
                  className="shrink-0 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {completingId === a.id ? "…" : "Done"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Assigned Actions for Today */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-700">
          Assigned Actions for Today
        </h3>
        {assignedToday.length === 0 ? (
          <p className="text-sm text-gray-500">No actions assigned for today.</p>
        ) : (
          <ul className="space-y-2">
            {assignedToday.map((a) => (
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
                  onClick={() => handleComplete(a.id)}
                  disabled={completingId === a.id}
                  className="shrink-0 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {completingId === a.id ? "…" : "Complete"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
