"use client";

import { useEffect, useState } from "react";
import DashboardMetrics from "@/components/dashboard/DashboardMetrics";
import HabitDecayChart from "@/components/dashboard/HabitDecayChart";
import AttentionNeededList from "@/components/dashboard/AttentionNeededList";
import DashboardInbox from "@/components/dashboard/DashboardInbox";
import DashboardCommentary from "@/components/dashboard/DashboardCommentary";
import GetStartedChecklist from "@/components/dashboard/GetStartedChecklist";
import InterventionEffectivenessWidget from "@/components/dashboard/InterventionEffectivenessWidget";

export interface DashboardMetricsData {
  totalMemberCount?: number;
  totalCampaignSends?: number;
  campaignsSentThisMonth?: number;
  atRiskCount: number;
  avgCommitmentScore: number;
  revenueAtRisk: number;
  revenueSaved: number;
  monthlyChurnPct?: number;
  reengagementRate?: number;
  membersNotContacted10Plus?: number;
  habitDecayTrend: Array<{
    date: string;
    dateLabel: string;
    avgCommitmentScore: number;
    memberCount: number;
  }>;
  attentionNeeded: Array<{
    id: string;
    name: string;
    riskLevel: string;
    riskScore: number;
    daysSinceLastVisit: number | null;
    lastVisitDate: string | null;
    monthlyRevenue: number;
    engagedToday?: boolean;
  }>;
  lastSnapshot?: {
    atRiskCount: number;
    avgCommitmentScore: number;
    revenueAtRisk: number;
    revenueSaved: number;
    snapshotAt: string;
  } | null;
}

interface DashboardContentProps {
  userRole?: "owner" | "admin" | "coach" | null;
}

/**
 * Fetches dashboard metrics once and passes the same data to all dashboard sections.
 * Avoids three separate API calls (DashboardMetrics, HabitDecayChart, AttentionNeededList).
 */
export default function DashboardContent({ userRole }: DashboardContentProps = {}) {
  const [data, setData] = useState<DashboardMetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/dashboard/metrics");
        if (!response.ok) throw new Error("Failed to fetch metrics");
        const metrics = await response.json();
        if (!cancelled) setData(metrics);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="h-4 w-24 bg-gray-200 rounded mb-4" />
              <div className="h-8 w-16 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 h-64 animate-pulse rounded-lg border border-gray-200 bg-gray-50" />
          <div className="animate-pulse rounded-lg border border-gray-200 bg-white p-6">
            <div className="h-6 w-48 bg-gray-200 rounded mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <p className="text-sm text-red-800">{error || "Failed to load dashboard metrics"}</p>
      </div>
    );
  }

  const atRiskCount = data.atRiskCount;
  const revenueAtRisk = data.revenueAtRisk;
  const totalMembers = data.totalMemberCount ?? 0;
  return (
    <>
      {/* Hero: X members need attention / £X at risk when atRiskCount > 0, else success */}
      {atRiskCount > 0 ? (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50/50 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-lg font-medium text-gray-900">
              <span className="font-semibold text-amber-700">{atRiskCount} members</span> need attention
              {revenueAtRisk > 0 && (
                <> · <span className="font-semibold text-amber-700">£{revenueAtRisk.toLocaleString()}</span> at risk this month</>
              )}
            </p>
            <a
              href="/plays"
              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-lime-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-lime-700"
            >
              Run a Play →
            </a>
          </div>
        </div>
      ) : (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50/50 p-5">
          <p className="text-lg font-medium text-gray-900">
            <span className="font-semibold text-green-700">All clear.</span> No members at risk right now.
          </p>
        </div>
      )}

      <div className="mb-8">
        <DashboardMetrics initialData={data} />
      </div>

      {(totalMembers === 0 || (data.totalCampaignSends ?? 0) === 0) && (
        <div className="mb-6">
          <GetStartedChecklist
            totalMemberCount={totalMembers}
            totalCampaignSends={data.totalCampaignSends ?? 0}
            campaignsSentThisMonth={data.campaignsSentThisMonth ?? 0}
          />
        </div>
      )}

      <div className="mb-6">
        <DashboardCommentary
          atRiskCount={atRiskCount}
          avgCommitmentScore={data.avgCommitmentScore}
          revenueAtRisk={revenueAtRisk}
          revenueSaved={data.revenueSaved}
          lastSnapshot={data.lastSnapshot ?? null}
        />
      </div>

      {/* Action-first: when at risk, Attention + CTA prominent; What's Working elevated in sidebar */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <HabitDecayChart initialData={data} />
          <DashboardInbox membersNotContacted10Plus={data.membersNotContacted10Plus} />
        </div>
        <div className="space-y-6 lg:col-span-1">
          <InterventionEffectivenessWidget />
          <AttentionNeededList initialData={data} />
          {atRiskCount > 0 && (
            <a
              href="/plays"
              className="block rounded-lg border-2 border-lime-500 bg-lime-50 p-4 text-center font-semibold text-lime-800 hover:bg-lime-100"
            >
              Run a Play →
            </a>
          )}
        </div>
      </div>
    </>
  );
}
