"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import MembersListSimplified from "./MembersListSimplified";
import AtRiskMembersTable from "./AtRiskMembersTable";
import TopMembersSideTab from "./TopMembersSideTab";

interface MembersPageClientProps {
  gymId: string;
  initialTab: string;
  initialStatus: string;
  initialRisk: string;
  initialSearch: string;
  initialBirthdays: string;
  initialPage: string;
}

export default function MembersPageClient({
  gymId,
  initialTab,
  initialStatus,
  initialRisk,
  initialSearch,
  initialBirthdays,
  initialPage,
}: MembersPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab") || initialTab;
  const activeTab = ["all", "at-risk", "birthdays"].includes(tabFromUrl) ? tabFromUrl : "at-risk";

  const [summary, setSummary] = useState<{ atRiskCount: number; revenueAtRisk: number } | null>(null);

  useEffect(() => {
    fetch("/api/members/at-risk-summary")
      .then((r) => r.json())
      .then((d) => setSummary({ atRiskCount: d.atRiskCount ?? 0, revenueAtRisk: d.revenueAtRisk ?? 0 }))
      .catch(() => setSummary(null));
  }, []);

  const switchTab = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    if (tab === "birthdays") {
      params.set("birthdays", "this_month");
      params.delete("status");
      params.delete("risk");
      params.delete("search");
      params.delete("page");
    } else if (tab === "at-risk") {
      params.delete("birthdays");
      params.delete("status");
      params.delete("risk");
      params.delete("search");
      params.delete("page");
    } else {
      params.delete("birthdays");
    }
    router.push(`/members?${params.toString()}`);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Summary bar: X need attention / all clear */}
      {summary && (
        <div className="lg:col-span-3">
          {summary.atRiskCount > 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-base font-medium text-gray-900">
                  <span className="font-semibold text-amber-700">{summary.atRiskCount} members</span> need attention
                  {summary.revenueAtRisk > 0 && (
                    <> · <span className="font-semibold text-amber-700">£{summary.revenueAtRisk.toLocaleString()}</span> at risk this month</>
                  )}
                </p>
                <Link
                  href="/plays"
                  className="inline-flex shrink-0 items-center justify-center rounded-lg bg-lime-600 px-4 py-2 text-sm font-semibold text-white hover:bg-lime-700"
                >
                  Run a play →
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-green-200 bg-green-50/50 p-4">
              <p className="text-base font-medium text-gray-900">
                <span className="font-semibold text-green-700">All clear.</span> No members need attention right now.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="lg:col-span-2 space-y-4">
        {/* Tabs: Need attention | All Members | Birthdays */}
        <div className="flex gap-1 rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => switchTab("at-risk")}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium ${
              activeTab === "at-risk"
                ? "bg-lime-500 text-gray-900"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Need attention
          </button>
          <button
            type="button"
            onClick={() => switchTab("all")}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium ${
              activeTab === "all"
                ? "bg-lime-500 text-gray-900"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            All Members
          </button>
          <button
            type="button"
            onClick={() => switchTab("birthdays")}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium ${
              activeTab === "birthdays"
                ? "bg-lime-500 text-gray-900"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Birthdays
          </button>
        </div>

        {activeTab === "at-risk" ? (
          <AtRiskMembersTable key="at-risk" gymId={gymId} />
        ) : (
          <MembersListSimplified
            key={activeTab}
            gymId={gymId}
            statusFilter={activeTab === "birthdays" ? "all" : initialStatus}
            riskFilter={activeTab === "birthdays" ? "all" : initialRisk}
            searchQuery={initialSearch}
            birthdaysFilter={activeTab === "birthdays" ? "this_month" : ""}
            page={initialPage}
          />
        )}
      </div>
      <div className="lg:col-span-1">
        <TopMembersSideTab gymId={gymId} />
      </div>
    </div>
  );
}
