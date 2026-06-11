"use client";

import Link from "next/link";

export default function TrialExpiredClient() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-lg text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
          <svg
            className="h-7 w-7 text-amber-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Subscription required</h1>
        <p className="mt-3 text-gray-600">
          Full dashboard access needs a Starter or Growth plan. If you requested
          a free retention audit, we&apos;ll email your report separately — no
          subscription required for the audit itself.
        </p>

        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm font-medium text-gray-900 mb-2">
            What you&apos;ll get with a paid plan
          </p>
          <ul className="space-y-1.5 text-sm text-gray-700 text-left">
            <li className="flex items-center gap-2">
              <svg className="h-4 w-4 text-lime-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Retention dashboard with at-risk member insights
            </li>
            <li className="flex items-center gap-2">
              <svg className="h-4 w-4 text-lime-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Email &amp; SMS retention campaigns
            </li>
            <li className="flex items-center gap-2">
              <svg className="h-4 w-4 text-lime-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Prove which interventions work
            </li>
          </ul>
        </div>

        <div className="mt-6 space-y-3">
          <Link
            href="/settings#subscription"
            className="block w-full rounded-lg bg-lime-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-lime-500"
          >
            View Starter &amp; Growth plans
          </Link>
          <Link
            href="/audit"
            className="block w-full rounded-lg border border-lime-300 bg-lime-50 px-4 py-3 text-center text-sm font-semibold text-lime-800 hover:bg-lime-100"
          >
            Get Free Retention Audit
          </Link>
          <a
            href="mailto:support@rip.app?subject=Subscription%20inquiry"
            className="block text-sm text-gray-500 hover:text-gray-700"
          >
            Contact support
          </a>
        </div>
      </div>
    </div>
  );
}
