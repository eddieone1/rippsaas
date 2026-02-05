"use client";

import Link from "next/link";
import {
  Phone,
  Heart,
  Zap,
  Eye,
  Star,
  type LucideIcon,
} from "lucide-react";
import { getChampCategoryConfig, type ChampCategoryId } from "@/lib/coach-actions/champ";

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

const CHAMP_ICONS: Record<ChampCategoryId, LucideIcon> = {
  connect: Phone,
  help: Heart,
  activate: Zap,
  monitor: Eye,
  praise: Star,
};

interface ChampActionCardProps {
  categoryId: ChampCategoryId;
  /** 1–3 suggested action labels (from CHAMP config) */
  suggestedActions: string[];
  /** Assigned actions in this category (from playbook API) */
  actions: PlaybookAction[];
  /** For Praise: member names to celebrate (no action rows) */
  praiseMemberNames?: { memberId: string; memberName: string }[];
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
            praiseMemberNames.map((m) => (
              <Link
                key={m.memberId}
                href={`/members/${m.memberId}`}
                className="block rounded-lg border border-rose-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-sm hover:bg-rose-50"
              >
                Celebrate: {m.memberName} →
              </Link>
            ))
          ) : (
            <p className="text-sm text-gray-500">
              No reengaged members to celebrate yet.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {actions.length === 0 ? (
            <p className="text-sm text-gray-500">No actions in this category today.</p>
          ) : (
            actions.map((a) => (
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
            ))
          )}
        </div>
      )}
    </div>
  );
}
