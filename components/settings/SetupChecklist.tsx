"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Gym {
  logo_url?: string | null;
  brand_primary_color?: string | null;
  brand_secondary_color?: string | null;
  sender_name?: string | null;
  sender_email?: string | null;
}

interface SetupChecklistProps {
  gym: Gym | null;
  membershipTypesCount: number;
  memberCount: number;
}

const CHECKLIST_ITEMS = [
  {
    id: "branding",
    label: "Branding set",
    check: (gym: Gym | null) =>
      Boolean(gym?.logo_url?.trim()) &&
      Boolean(gym?.brand_primary_color || gym?.brand_secondary_color),
    href: "#branding",
  },
  {
    id: "email",
    label: "Email configured",
    check: (
      gym: Gym | null,
      _mt: number,
      _mc: number,
      status?: { hasResendKey: boolean }
    ) =>
      Boolean(gym?.sender_name?.trim() && gym?.sender_email?.trim()) &&
      Boolean(status?.hasResendKey),
    href: "#communications",
  },
  {
    id: "memberships",
    label: "Membership types added",
    check: (_gym: Gym | null, mtCount: number) => mtCount > 0,
    href: "#memberships",
  },
  {
    id: "members",
    label: "Members imported",
    check: (_gym: Gym | null, _mt: number, mc: number) => mc > 0,
    href: "#members",
  },
] as const;

export default function SetupChecklist({
  gym,
  membershipTypesCount,
  memberCount,
}: SetupChecklistProps) {
  const [integrationStatus, setIntegrationStatus] = useState<{
    hasResendKey: boolean;
  } | null>(null);

  useEffect(() => {
    fetch("/api/settings/integrations")
      .then((r) => r.json())
      .then((d) => {
        if (d.hasResendKey !== undefined) {
          setIntegrationStatus({ hasResendKey: d.hasResendKey });
        }
      })
      .catch(() => setIntegrationStatus({ hasResendKey: false }));
  }, []);

  const items = CHECKLIST_ITEMS.map((item) => ({
    ...item,
    done:
      item.id === "email"
        ? item.check(gym, membershipTypesCount, memberCount, integrationStatus ?? undefined)
        : item.check(gym, membershipTypesCount, memberCount),
  }));

  const doneCount = items.filter((i) => i.done).length;
  const totalCount = items.length;
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const allDone = doneCount === totalCount;
  const nextItem = items.find((i) => !i.done);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Setup progress</h2>
          <p className="mt-0.5 text-sm text-gray-600">
            {allDone
              ? "You're ready to run retention campaigns."
              : nextItem
                ? `Next: ${nextItem.label}`
                : "Complete these steps to get started."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full bg-lime-500 transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-sm font-medium text-gray-700 tabular-nums">
            {doneCount}/{totalCount}
          </span>
        </div>
      </div>
      <ul className="mt-4 flex flex-wrap gap-2">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                item.done
                  ? "bg-lime-100 text-lime-800 hover:bg-lime-200"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${
                  item.done ? "bg-lime-500 text-white" : "bg-gray-300 text-gray-600"
                }`}
              >
                {item.done ? "✓" : "·"}
              </span>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
