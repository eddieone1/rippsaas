"use client";

import Link from "next/link";

interface TrialBannerProps {
  trialEndsAt?: string;
  gymName?: string | null;
}

/**
 * Shown when the gym has no active paid subscription.
 * Legacy trialEndsAt prop is ignored — trial messaging replaced by subscription/audit CTAs.
 */
export default function TrialBanner({ gymName }: TrialBannerProps) {
  return (
    <div className="mb-6 rounded-lg border border-lime-200 bg-lime-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-800">
          {gymName ? (
            <>
              <strong>{gymName}</strong> — subscribe to unlock full retention
              tracking, or{" "}
            </>
          ) : (
            <>Subscribe to unlock full retention tracking, or </>
          )}
          <a href="/audit" className="font-medium text-lime-700 hover:underline">
            get a free retention audit
          </a>{" "}
          to see at-risk members first.
        </p>
        <Link
          href="/settings#subscription"
          className="shrink-0 rounded-md bg-lime-600 px-4 py-2 text-sm font-medium text-white hover:bg-lime-500 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2"
        >
          View plans
        </Link>
      </div>
    </div>
  );
}
