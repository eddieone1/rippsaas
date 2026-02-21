"use client";

import type { Touch } from "./types";

const CHANNEL_LABELS: Record<string, string> = {
  call: "Call",
  sms: "SMS",
  email: "Email",
  in_person: "In person",
  dm: "DM",
  play_launch: "Play",
  auto_sms: "Auto SMS",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

interface TouchTimelineProps {
  touches: Touch[];
  filter: "all" | "coach" | "automated";
  onFilterChange: (f: "all" | "coach" | "automated") => void;
}

export default function TouchTimeline({
  touches,
  filter,
  onFilterChange,
}: TouchTimelineProps) {
  return (
    <div className="mt-4">
      <div className="flex gap-2 mb-3">
        {(["all", "coach", "automated"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => onFilterChange(f)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium capitalize ${
              filter === f
                ? "border-lime-500 bg-lime-50 text-lime-700"
                : "border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300"
            }`}
          >
            {f === "all" ? "All" : f === "coach" ? "Coach touches" : "Automated"}
          </button>
        ))}
      </div>
      <ul className="space-y-2">
        {touches.length === 0 ? (
          <li className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-4 text-center text-sm text-gray-700">
            No touches yet
          </li>
        ) : (
          touches.map((t) => (
            <li
              key={t.id}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-700">
                  {formatDate(t.createdAt)} · {CHANNEL_LABELS[t.channel] ?? t.channel}{" "}
                  · {t.type === "coach" ? "Coach" : "System"}
                </span>
                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-800 capitalize">
                  {t.outcome.replace("_", " ")}
                </span>
              </div>
              {t.notes && (
                <p className="mt-1 text-xs text-gray-700 line-clamp-2">{t.notes}</p>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
