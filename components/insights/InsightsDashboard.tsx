"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { MEMBER_STAGE_LABELS, MEMBER_STAGE_PLAYS } from "@/lib/member-intelligence";
import StageMembersModal from "./StageMembersModal";
import InterventionPerformance from "./InterventionPerformance";
import {
  AreaChart,
  BarChart,
  Bar,
  Cell,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChurnReportTab from "./ChurnReportTab";
import OutreachPerformanceTab from "./OutreachPerformanceTab";
import MembersAndCoachesTab from "./MembersAndCoachesTab";
import ROIMetrics from "@/components/roi/ROIMetrics";
import MetricsExplanation from "@/components/roi/MetricsExplanation";

type InsightsTab = "whats-working" | "engagement" | "churn" | "campaigns" | "members" | "impact";

interface InsightsData {
  engagementRate: number;
  membersSaved?: number;
  revenueSaved?: number;
  engagementBreakdown: {
    emails: number;
    sms: number;
    automations: number;
  };
  monthlyChurnRate: number;
  monthlyChurnRateTimeSeries?: Array<{ month: string; churnRate: number; churned: number; totalAtStart: number }>;
  campaignsSent7d: number;
  campaignsBreakdown: {
    emails: number;
    sms: number;
    automations: number;
  };
  membersAtRisk: number;
  memberStagesBreakdown?: Array<{
    stage: string;
    label: string;
    count: number;
    play?: string;
  }>;
  churnedMembersByMonth?: Record<string, Array<{ id: string; name: string; email: string | null; status: string }>>;
  campaignPerformance: Array<{
    date: string;
    emails: number;
    sms: number;
    automations: number;
    total: number;
  }>;
  recentActivities: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    icon: string;
  }>;
}

/**
 * Insights Dashboard - Card-based layout matching the design
 * Shows engagement rates, churn trends, campaign performance, and recent activities
 */
export default function InsightsDashboard({
  initialTab = "whats-working",
  initialTimeRange = "30d",
}: {
  initialTab?: string;
  initialTimeRange?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromUrl = (searchParams.get("tab") as InsightsTab) ?? initialTab;
  const timeFromUrl = searchParams.get("time_range") ?? initialTimeRange;

  const [activeTab, setActiveTab] = useState<InsightsTab>(
    ["whats-working", "engagement", "churn", "campaigns", "members", "impact"].includes(tabFromUrl)
      ? (tabFromUrl as InsightsTab)
      : "whats-working"
  );
  const [timeRange, setTimeRange] = useState(timeFromUrl === "7d" || timeFromUrl === "30d" || timeFromUrl === "90d" ? timeFromUrl : "30d");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<InsightsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stageModal, setStageModal] = useState<{ stage: string; label: string } | null>(null);

  useEffect(() => {
    fetchInsightsData();
  }, [timeRange]);

  // Sync state from URL when it changes (e.g. from InterventionPerformance)
  useEffect(() => {
    const t = searchParams.get("tab");
    const tr = searchParams.get("time_range");
    if (t && ["whats-working", "engagement", "churn", "campaigns", "members", "impact"].includes(t)) {
      setActiveTab(t as InsightsTab);
    }
    if (tr) {
      if (tr === "7d" || tr === "30d" || tr === "90d") {
        setTimeRange(tr);
      } else if (["all", "month", "quarter", "year"].includes(tr)) {
        setTimeRange(tr === "quarter" ? "90d" : tr === "year" ? "90d" : "30d");
      }
    }
  }, [searchParams]);

  const updateUrl = (tab?: InsightsTab, time?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab) params.set("tab", tab);
    if (time) params.set("time_range", time);
    router.replace(`/insights?${params.toString()}`, { scroll: false });
  };

  const handleTabChange = (tab: InsightsTab) => {
    setActiveTab(tab);
    updateUrl(tab);
  };

  const handleTimeRangeChange = (t: string) => {
    setTimeRange(t);
    updateUrl(undefined, t);
  };

  const fetchInsightsData = async () => {
    setLoading(true);
    setError(null);

    try {
      const apiTimeRange =
        timeRange === "7d" || timeRange === "30d" || timeRange === "90d"
          ? timeRange
          : timeRange === "quarter"
            ? "90d"
            : timeRange === "year"
              ? "90d"
              : "30d";
      const response = await fetch(`/api/insights/dashboard?time_range=${apiTimeRange}`, { cache: "no-store" });
      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to load insights");
        setLoading(false);
        return;
      }

      setData(result);
      setLoading(false);
    } catch (err) {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  // KPI strip with trend indicators (shown when we have dashboard data)
  const churnRate = data?.monthlyChurnRate ?? 0;
  const churnVsMarket = churnRate < 5 ? "below" : churnRate <= 5 ? "on par" : "above";
  const engagementRate = data?.engagementRate ?? 0;

  const kpiStrip = data && (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-gray-500">Re-engagement Rate</p>
          {engagementRate >= 20 && <span className="text-green-500 text-sm" title="Strong">↗</span>}
        </div>
        <p className="text-2xl font-bold text-lime-600 mt-1">{engagementRate}%</p>
        <p className="text-xs text-gray-500 mt-0.5">Members who visited after outreach</p>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-gray-500">Members Saved</p>
          {(data.membersSaved ?? 0) > 0 && <span className="text-green-500 text-sm">✓</span>}
        </div>
        <p className="text-2xl font-bold text-gray-900 mt-1">{data.membersSaved ?? 0}</p>
        <p className="text-xs text-gray-500 mt-0.5">Re-engaged in period</p>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-gray-500">Revenue Recovered</p>
          {(data.revenueSaved ?? 0) > 0 && <span className="text-green-500 text-sm">£</span>}
        </div>
        <p className="text-2xl font-bold text-lime-600 mt-1">£{data.revenueSaved ?? 0}</p>
        <p className="text-xs text-gray-500 mt-0.5">Retained from saves</p>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-gray-500">Churn vs Market</p>
          {churnVsMarket === "below" && <span className="text-green-500 text-sm" title="Below market = strong">↘</span>}
          {churnVsMarket === "above" && <span className="text-amber-500 text-sm" title="Above market">↗</span>}
        </div>
        <p className="text-2xl font-bold text-gray-900 mt-1">{churnRate}%</p>
        <p className={`text-xs mt-0.5 ${churnVsMarket === "below" ? "text-green-600" : churnVsMarket === "above" ? "text-amber-600" : "text-gray-500"}`}>
          {churnVsMarket === "below" ? "Below 5% benchmark" : churnVsMarket === "above" ? "Above 5% benchmark" : "vs 5% typical"}
        </p>
      </div>
    </div>
  );

  // Global time range (for tabs that use dashboard API)
  const timeRangeSelect = (
    <select
      value={timeRange}
      onChange={(e) => handleTimeRangeChange(e.target.value)}
      className="text-xs border border-gray-300 rounded px-2 py-1.5"
    >
      <option value="7d">Last 7 days</option>
      <option value="30d">Last 30 days</option>
      <option value="90d">Last 90 days</option>
    </select>
  );

  // Tab bar always visible
  const tabs = (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200">
      <div className="flex items-center gap-4">
        <button
          onClick={() => handleTabChange("whats-working")}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "whats-working"
              ? "border-lime-600 text-lime-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          What&apos;s Working
        </button>
        <button
          onClick={() => handleTabChange("engagement")}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "engagement"
              ? "border-lime-600 text-lime-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Member Engagement
        </button>
        <button
          onClick={() => handleTabChange("churn")}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "churn"
              ? "border-lime-600 text-lime-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Churn Reports
        </button>
        <button
          onClick={() => handleTabChange("campaigns")}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "campaigns"
              ? "border-lime-600 text-lime-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Outreach Performance
        </button>
        <button
          onClick={() => handleTabChange("members")}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "members"
              ? "border-lime-600 text-lime-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Members & Coaches
        </button>
        <button
          onClick={() => handleTabChange("impact")}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "impact"
              ? "border-lime-600 text-lime-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Retention Impact
        </button>
      </div>
      {activeTab !== "whats-working" && activeTab !== "impact" && <div>{timeRangeSelect}</div>}
    </div>
  );

  // Impact tab is self-contained (ROIMetrics fetches its own data)
  if (activeTab === "impact") {
    return (
      <div className="space-y-6">
        {kpiStrip}
        {tabs}
        <ROIMetrics />
        <MetricsExplanation />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {tabs}
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-600">Loading insights...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        {tabs}
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <p className="text-sm text-red-800">{error || "No data available"}</p>
          <button
            type="button"
            onClick={() => fetchInsightsData()}
            className="mt-3 rounded-md bg-red-100 px-3 py-1.5 text-sm font-medium text-red-800 hover:bg-red-200"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Prepare chart data (defensive: ensure we always have arrays and numbers)
  const engagementBreakdown = data.engagementBreakdown ?? { emails: 0, sms: 0, automations: 0 };
  const campaignsBreakdown = data.campaignsBreakdown ?? { emails: 0, sms: 0, automations: 0 };
  const campaignPerformance = data.campaignPerformance ?? [];
  const recentActivities = data.recentActivities ?? [];
  const memberStagesBreakdown = data.memberStagesBreakdown ?? [];
  const totalMembersForStages = memberStagesBreakdown.reduce((sum, s) => sum + s.count, 0);

  const engagementChartData = [
    { name: "Email", value: engagementBreakdown.emails, fill: "#3b82f6" },
    { name: "SMS", value: engagementBreakdown.sms, fill: "#10b981" },
    { name: "Auto", value: engagementBreakdown.automations, fill: "#8b5cf6" },
  ].filter((d) => d.value > 0);

  const churnChartData =
    (data.monthlyChurnRateTimeSeries && data.monthlyChurnRateTimeSeries.length > 0)
      ? data.monthlyChurnRateTimeSeries.map((row) => ({
          date: String(row.month ?? ""),
          churn: Number(row.churnRate) || 0,
          market: 5,
        }))
      : [
          { date: "Week 1", churn: 0, market: 5 },
          { date: "Week 2", churn: 0, market: 5 },
          { date: "Week 3", churn: 0, market: 5 },
          { date: "Week 4", churn: Number(data.monthlyChurnRate) ?? 0, market: 5 },
        ];

  const campaignsChartData = [
    { name: "Emails", value: campaignsBreakdown.emails },
    { name: "SMS", value: campaignsBreakdown.sms },
    { name: "Auto", value: campaignsBreakdown.automations },
  ];

  const performanceChartData = campaignPerformance.length > 0
    ? campaignPerformance.map((p) => ({
    date: p.date,
    emails: p.emails,
    sms: p.sms,
    automations: p.automations,
    total: p.total,
  }))
    : [{ date: "—", emails: 0, sms: 0, automations: 0, total: 0 }];

  return (
    <div className="space-y-6">
      {kpiStrip}
      {tabs}

      {/* Tab content: only the active tab panel is shown */}
      {activeTab === "whats-working" && (
        <InterventionPerformance
          timeRange={
            (() => {
              const t = searchParams.get("time_range") ?? "month";
              if (["all", "month", "quarter", "year"].includes(t)) return t;
              if (t === "90d") return "quarter";
              return "month";
            })()
          }
        />
      )}

      {activeTab === "engagement" && (
        <div className="space-y-6">
          {memberStagesBreakdown.length === 0 && campaignsBreakdown.emails + campaignsBreakdown.sms + (campaignsBreakdown.automations || 0) === 0 && (
            <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-12 text-center shadow-sm">
              <div className="text-5xl opacity-50 mb-4">📊</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No insights yet</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Upload members and run your first play to see engagement rates and member stages — proof of what works.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  href="/members/upload"
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Upload members
                </Link>
                <Link
                  href="/plays"
                  className="inline-flex items-center rounded-md bg-lime-500 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-lime-400"
                >
                  Run a play →
                </Link>
              </div>
            </div>
          )}
          {/* Member stages breakdown – Habit Lifecycle Mapping + retention plays */}
          {memberStagesBreakdown.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md hover:shadow-lg transition-shadow">
              <h3 className="text-sm font-medium text-gray-700 mb-1">Member stages</h3>
              <p className="text-xs text-gray-500 mb-4">
                Habit lifecycle mapping: each stage suggests a subtle retention play.
              </p>
              <div className="space-y-4">
                {memberStagesBreakdown.map((item) => {
                  const pct = totalMembersForStages > 0 ? Math.round((item.count / totalMembersForStages) * 100) : 0;
                  const barColor =
                    item.stage === "at_risk_silent_quit" || item.stage === "emotional_disengagement"
                      ? "bg-rose-500"
                      : item.stage === "win_back_window"
                        ? "bg-violet-500"
                        : item.stage === "onboarding_vulnerability"
                          ? "bg-amber-500"
                          : item.stage === "momentum_identity" || item.stage === "habit_formation"
                            ? "bg-emerald-500"
                            : item.stage === "churned"
                              ? "bg-gray-400"
                              : "bg-sky-500";
                  return (
                    <div key={item.stage} className="space-y-1">
                      <div className="flex items-center gap-3">
                        <div className="w-44 flex-shrink-0 text-sm font-medium text-gray-700">{item.label}</div>
                        <div className="flex-1 min-w-0 h-6 bg-gray-100 rounded overflow-hidden flex">
                          <div
                            className={`h-full ${barColor} transition-all`}
                            style={{ width: `${Math.max(0, pct)}%` }}
                          />
                        </div>
                        <div className="w-14 flex-shrink-0 text-right text-sm font-medium text-gray-900">
                          {item.count}
                          {totalMembersForStages > 0 && (
                            <span className="text-gray-500 font-normal ml-1">({pct}%)</span>
                          )}
                        </div>
                      </div>
                      {item.play && (
                        <p className="text-xs text-gray-500 pl-1 ml-0 w-full max-w-2xl" title={item.play}>
                          {item.play}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Top 3 member stage categories – actionable */}
          {memberStagesBreakdown.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md hover:shadow-lg transition-shadow">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Top 3 member stage categories
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                Championing Momentum & identity; recommendations for emotional disengagement and silent quit. Click to view members.
              </p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {(memberStagesBreakdown
                  .filter((s) => s.stage !== "churned")
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 3) as Array<{ stage: string; label: string; count: number; play?: string }>).map((s) => (
                  <button
                    key={s.stage}
                    type="button"
                    onClick={() => setStageModal({ stage: s.stage, label: (MEMBER_STAGE_LABELS as Record<string, string>)[s.stage] ?? s.label })}
                    className={`rounded-lg border p-4 text-left transition-colors hover:ring-2 hover:ring-lime-500 ${
                      s.stage === "momentum_identity" || s.stage === "habit_formation"
                        ? "border-lime-200 bg-lime-50"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <p className="font-medium text-gray-900">{(MEMBER_STAGE_LABELS as Record<string, string>)[s.stage] ?? s.label}</p>
                    <p className="text-2xl font-bold text-lime-600 mt-1">{s.count}</p>
                    <p className="text-xs text-gray-600 mt-2 line-clamp-2">{(MEMBER_STAGE_PLAYS as Record<string, string>)[s.stage] ?? s.play}</p>
                    <p className="text-xs text-lime-600 mt-2 font-medium">View members →</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md hover:shadow-lg transition-shadow">
              <h3 className="text-base font-semibold text-gray-900 mb-1">Engagement Rate</h3>
              <p className="text-xs text-gray-500 mb-4">Re-engagement by channel</p>
              <div className="text-3xl font-bold text-lime-600">{data.engagementRate ?? 0}%</div>
              <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
                <span>Email {engagementBreakdown.emails}%</span>
                <span>SMS {engagementBreakdown.sms}%</span>
                <span>Auto {engagementBreakdown.automations}%</span>
              </div>
              {engagementChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={engagementChartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                    <defs>
                      <linearGradient id="engBarBlue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#60a5fa" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                      <linearGradient id="engBarEmerald" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#34d399" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                      <linearGradient id="engBarViolet" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a78bfa" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        padding: "10px 14px",
                      }}
                      formatter={(v: number | undefined) => [`${v ?? 0}%`, ""]}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={56}>
                      {engagementChartData.map((entry, i) => {
                        const grad = entry.name === "Email" ? "engBarBlue" : entry.name === "SMS" ? "engBarEmerald" : "engBarViolet";
                        return <Cell key={i} fill={`url(#${grad})`} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="mt-6 flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50/50 py-8">
                  <div className="text-3xl opacity-40">📬</div>
                  <p className="text-sm text-gray-500 text-center">No channel data yet</p>
                  <p className="text-xs text-gray-400">Send outreach to see breakdown</p>
                  <Link href="/plays" className="text-sm font-medium text-lime-600 hover:text-lime-700">
                    Run a play →
                  </Link>
                </div>
              )}
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md hover:shadow-lg transition-shadow">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Members At Risk</h3>
              <div className="text-3xl font-bold text-lime-600">{data.membersAtRisk ?? 0}</div>
              <p className="mt-2 text-xs text-gray-600">Active members flagged for attention</p>
              <Link
                href="/members/at-risk"
                className="mt-4 inline-block text-sm font-medium text-lime-600 hover:text-lime-700"
              >
                View members →
              </Link>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">Recent Activity</h3>
              <select
                value={timeRange}
                onChange={(e) => handleTimeRangeChange(e.target.value)}
                className="text-xs border border-gray-300 rounded px-2 py-1"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>
            </div>
            <div className="space-y-3">
              {recentActivities.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50/50">
                  <div className="text-4xl opacity-40">📅</div>
                  <p className="text-sm text-gray-500">No recent activity yet</p>
                  <Link href="/plays" className="text-sm font-medium text-lime-600 hover:text-lime-700">
                    Run a play →
                  </Link>
                </div>
              ) : (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                    <div className="flex-shrink-0 mt-1">
                      {activity.icon === "check" && (
                        <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-xs text-green-800">✓</span>
                        </div>
                      )}
                      {activity.icon === "dot" && (
                        <div className="h-5 w-5 rounded-full bg-red-100 flex items-center justify-center">
                          <span className="text-xs text-red-800">•</span>
                        </div>
                      )}
                      {activity.icon === "calendar" && (
                        <div className="h-5 w-5 rounded-full bg-lime-100 flex items-center justify-center">
                          <span className="text-xs text-lime-800">📅</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="rounded-xl border-2 border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
            <p className="font-medium text-gray-900 mb-2">How to read these metrics</p>
            <p className="mb-2">
              <strong>Member stages</strong> show how many members are in each retention stage (e.g. Onboarding vulnerability, Habit formation, At-risk & silent quit, Win-back window). Stages are updated by the system from visit and commitment data. Focus outreach on At-risk & silent quit and Emotional disengagement; use Win-back window for lapsed members.
            </p>
            <p className="mb-2">
              <strong>Engagement rate</strong> is the percentage of members who made another visit after receiving outreach (email or SMS) in the selected period. Re-engagement means the member physically returned to the gym. For example, if you sent 20 messages and 4 members visited within the success window, your rate is 20%. Higher is better: it means your outreach is working. Compare email vs SMS to see which channel performs better for your members.
            </p>
            <p className="mb-2">
              <strong>Members at risk</strong> is the count of active members currently flagged as medium or high risk (e.g. low commitment score, long gap since last visit). These are the people to prioritise for check-ins or plays. Use the At Risk Members page to act on them.
            </p>
            <p>
              <strong>Recent activity</strong> shows the latest outreach sends and gym visits. Use it to see whether interventions are being followed by visits and to spot patterns (e.g. which plays or time ranges drive the most returns).
            </p>
          </div>
        </div>
      )}

      {activeTab === "churn" && (
        <ChurnReportTab
          data={{
            monthlyChurnRate: data.monthlyChurnRate ?? 0,
            monthlyChurnRateTimeSeries: data.monthlyChurnRateTimeSeries ?? [],
            churnedMembersByMonth: (data as InsightsData & { churnedMembersByMonth?: Record<string, Array<{ id: string; name: string; email: string | null; status: string }>> }).churnedMembersByMonth ?? {},
            memberStagesBreakdown: data.memberStagesBreakdown ?? [],
          }}
        />
      )}

      {(activeTab as string) === "x_churn_OLD" && (
        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Monthly Churn Rate</h3>
            <div className="text-3xl font-bold text-lime-600 mb-4">{data.monthlyChurnRate ?? 0}%</div>
            <p className="text-xs text-gray-600 mb-4">Your churn vs typical market (dashed line)</p>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={churnChartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(v) => `${v}%`} domain={[0, "auto"]} allowDataOverflow />
                <Tooltip formatter={(value: number | undefined) => [`${Number(value) ?? 0}%`, "Rate"]} />
                <Legend />
                <Line type="monotone" dataKey="churn" name="Your churn" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="market" name="Market avg" stroke="#ef4444" strokeDasharray="5 5" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
            <div className="mt-6 rounded-xl border-2 border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
              <p className="font-medium text-gray-900 mb-2">How to read this metric</p>
              <p className="mb-2">
                <strong>Monthly churn rate</strong> is the percentage of members who churned (inactive or cancelled) in the month, relative to your member base at the start of that period. For inactive members, churn month is inferred from their last visit date. Rates are recalculated whenever member data is updated (e.g. CSV upload or manual edits). Lower is better.
              </p>
              <p className="mb-2">
                The <strong>dashed red line (market average)</strong> shows a typical gym churn benchmark (~5% per month). Use it as a reference: if your line (green) sits below the dashed line, you are retaining members better than the market; if it sits above, more members are leaving than average and retention efforts (e.g. check-ins, plays) may need attention.
              </p>
              <p>
                An <strong>ideal churn rate</strong> for fitness is generally between <strong>3–5%</strong> per month. Staying in or below that range suggests healthy retention; consistently above it means it’s worth prioritising at-risk members and interventions.
              </p>
            </div>
          </div>
        </div>
      )}

      {stageModal && (
        <StageMembersModal
          stage={stageModal.stage}
          label={stageModal.label}
          isOpen={!!stageModal}
          onClose={() => setStageModal(null)}
        />
      )}

      {activeTab === "members" && <MembersAndCoachesTab />}

      {activeTab === "campaigns" && (
        <OutreachPerformanceTab
          data={{
            campaignsSent7d: data.campaignsSent7d ?? 0,
            campaignsBreakdown: campaignsBreakdown,
            campaignPerformance: performanceChartData,
            engagementRate: data.engagementRate ?? 0,
            engagementBreakdown: engagementBreakdown,
          }}
        />
      )}
    </div>
  );
}
