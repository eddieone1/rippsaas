"use client";

import Link from "next/link";

interface GetStartedChecklistProps {
  totalMemberCount: number;
  totalCampaignSends: number;
  campaignsSentThisMonth?: number;
}

/**
 * Shows new users a simple checklist to reach first value in <7 days.
 * Hidden when both steps are complete.
 */
export default function GetStartedChecklist({
  totalMemberCount,
  totalCampaignSends,
  campaignsSentThisMonth = 0,
}: GetStartedChecklistProps) {
  const hasMembers = totalMemberCount > 0;
  const hasSentCampaign = totalCampaignSends > 0;
  const hasSentThisMonth = campaignsSentThisMonth > 0;
  const allDone = hasMembers && hasSentCampaign;

  if (allDone) return null;

  return (
    <div className="rounded-lg border border-lime-200 bg-lime-50/50 p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Get started in 3 steps</h3>
      <ol className="space-y-2 text-sm">
        <li className="flex items-center gap-3">
          {hasMembers ? (
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700 text-xs font-bold">✓</span>
          ) : (
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-500 text-xs font-medium">1</span>
          )}
          {hasMembers ? (
            <span className="text-gray-600">Member list uploaded</span>
          ) : (
            <Link href="/members/upload" className="font-medium text-lime-700 hover:text-lime-800 hover:underline">
              Upload your member list →
            </Link>
          )}
        </li>
        <li className="flex items-center gap-3">
          {hasSentCampaign ? (
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700 text-xs font-bold">✓</span>
          ) : (
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-500 text-xs font-medium">2</span>
          )}
          {hasSentCampaign ? (
            <span className="text-gray-600">
              First play sent{hasSentThisMonth ? ` (${campaignsSentThisMonth} this month)` : ""}
            </span>
          ) : (
            <Link href="/plays" className="font-medium text-lime-700 hover:text-lime-800 hover:underline">
              Send your first play →
            </Link>
          )}
        </li>
        <li className="flex items-center gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-500 text-xs font-medium">3</span>
          <Link href="/insights" className="font-medium text-lime-700 hover:text-lime-800 hover:underline">
            Review what&apos;s working →
          </Link>
        </li>
      </ol>
    </div>
  );
}
