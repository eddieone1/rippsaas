"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { InboxItem } from "@/app/api/dashboard/inbox/route";

interface DashboardInboxProps {
  membersNotContacted10Plus?: number;
}

/**
 * Dashboard Inbox
 * Summarises updates: at-risk changes, campaign insights, visits, touches, birthdays, monthly summary.
 * Up to 5 bullet points, clickable with actionable workflows.
 */
export default function DashboardInbox({ membersNotContacted10Plus }: DashboardInboxProps = {}) {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/inbox")
      .then((r) => r.json())
      .then((data) => {
        if (data.items) setItems(data.items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || items.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Inbox</h3>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-5 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            {membersNotContacted10Plus != null && membersNotContacted10Plus > 0 ? (
              <>
                <span className="font-medium text-gray-700">{membersNotContacted10Plus} members</span> haven&apos;t been contacted in 10+ days.{" "}
                <Link href="/plays" className="text-lime-600 hover:text-lime-800 font-medium">
                  Run a play
                </Link>
                {" "}or{" "}
                <Link href="/members/at-risk" className="text-lime-600 hover:text-lime-800 font-medium">
                  check at-risk members
                </Link>
                .
              </>
            ) : (
              <>
                No updates right now.{" "}
                <Link href="/members/at-risk" className="text-lime-600 hover:text-lime-800 font-medium">
                  Check at-risk members
                </Link>{" "}
                or{" "}
                <Link href="/plays" className="text-lime-600 hover:text-lime-800 font-medium">
                  run a play
                </Link>
                .
              </>
            )}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Inbox</h3>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id}>
            {item.actionHref ? (
              <Link
                href={item.actionHref}
                className="flex items-start gap-3 rounded-lg p-2 -m-2 hover:bg-gray-50 transition-colors group"
              >
                <span className="flex-shrink-0 mt-0.5 h-2 w-2 rounded-full bg-lime-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 group-hover:text-lime-700">
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </div>
                <span className="flex-shrink-0 text-xs font-medium text-lime-600">
                  {item.actionLabel ?? "View"} →
                </span>
              </Link>
            ) : (
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 mt-0.5 h-2 w-2 rounded-full bg-lime-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
