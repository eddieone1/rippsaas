"use client";

import Link from "next/link";
import { getChampCategoryConfig, type ChampCategoryId } from "@/lib/coach-actions/champ";

const svgProps = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function IconPhone({ className }: { className?: string }) {
  return (
    <svg {...svgProps} className={className}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
function IconHeart({ className }: { className?: string }) {
  return (
    <svg {...svgProps} className={className}>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}
function IconZap({ className }: { className?: string }) {
  return (
    <svg {...svgProps} className={className}>
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}
function IconEye({ className }: { className?: string }) {
  return (
    <svg {...svgProps} className={className}>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function IconStar({ className }: { className?: string }) {
  return (
    <svg {...svgProps} className={className}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

const CHAMP_ICONS: Record<ChampCategoryId, React.ComponentType<{ className?: string }>> = {
  connect: IconPhone,
  help: IconHeart,
  activate: IconZap,
  monitor: IconEye,
  praise: IconStar,
};

export interface PlaybookAction {
  id: string;
  memberId: string;
  memberName: string;
  actionType: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  dueDate: string;
  completedAt: string | null;
  notes: string | null;
}

interface ChampActionCardProps {
  categoryId: ChampCategoryId;
  /** 1–3 suggested action labels (from CHAMP config) */
  suggestedActions: string[];
  /** Assigned actions in this category (from playbook API) */
  actions: PlaybookAction[];
  /** For Praise: member names to celebrate (no action rows) */
  praiseMemberNames?: { memberId: string; memberName: string }[];
  /** When provided, clicking an action selects the member in-app instead of navigating away */
  onSelectMember?: (memberId: string) => void;
}

/**
 * Large CHAMP action card: color-coded, icon, clear verb, 1–3 suggested actions,
 * and list of assigned actions for this category (or praise suggestions).
 */
export default function ChampActionCard({
  categoryId,
  suggestedActions,
  actions,
  praiseMemberNames = [],
  onSelectMember,
}: ChampActionCardProps) {
  const config = getChampCategoryConfig(categoryId);
  const Icon = CHAMP_ICONS[categoryId];

  const urgencyClass = (p: string) =>
    p === "high"
      ? "bg-red-100 text-red-800"
      : p === "medium"
      ? "bg-amber-100 text-amber-800"
      : "bg-gray-100 text-gray-800";

  return (
    <div
      className={`rounded-xl border-2 ${config.bgLight} p-6 shadow-sm transition hover:shadow-md`}
    >
      <div className="mb-4 flex items-center gap-3">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-full ${config.color} text-white`}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{config.label}</h2>
          <p className="text-sm font-medium text-gray-600">{config.verb}</p>
        </div>
      </div>

      {/* 1–3 suggested actions (templates) */}
      <ul className="mb-4 list-inside list-disc text-sm text-gray-700">
        {suggestedActions.slice(0, 3).map((label, i) => (
          <li key={i}>{label}</li>
        ))}
      </ul>

      {/* Assigned actions in this category */}
      {categoryId === "praise" ? (
        <div className="space-y-2">
          {praiseMemberNames.length > 0 ? (
            praiseMemberNames.map((m) =>
              onSelectMember ? (
                <button
                  key={m.memberId}
                  type="button"
                  onClick={() => onSelectMember(m.memberId)}
                  className="block w-full rounded-lg border border-rose-200 bg-white px-4 py-3 text-left text-sm font-medium text-gray-900 shadow-sm hover:bg-rose-50"
                >
                  Celebrate: {m.memberName} →
                </button>
              ) : (
                <Link
                  key={m.memberId}
                  href={`/members/${m.memberId}`}
                  className="block rounded-lg border border-rose-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-sm hover:bg-rose-50"
                >
                  Celebrate: {m.memberName} →
                </Link>
              )
            )
          ) : (
            <p className="text-sm text-gray-500">
              No members who visited again to celebrate yet.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {actions.length === 0 ? (
            <p className="text-sm text-gray-500">No actions in this category today.</p>
          ) : (
            actions.map((a) =>
              onSelectMember ? (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => onSelectMember(a.memberId)}
                  className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 text-left shadow-sm hover:bg-gray-50"
                >
                  <span className="font-medium text-gray-900">{a.memberName}</span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${urgencyClass(a.priority)}`}
                  >
                    {a.priority}
                  </span>
                </button>
              ) : (
                <Link
                  key={a.id}
                  href={`/members/${a.memberId}`}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm hover:bg-gray-50"
                >
                  <span className="font-medium text-gray-900">{a.memberName}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${urgencyClass(a.priority)}`}
                  >
                    {a.priority}
                  </span>
                </Link>
              )
            )
          )}
        </div>
      )}
    </div>
  );
}
