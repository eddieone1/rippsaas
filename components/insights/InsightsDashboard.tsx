"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface InsightsData {
  engagementRate: number;
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
export default function InsightsDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"engagement" | "churn" | "campaigns">("engagement");
  const [timeRange, setTimeRange] = useState("7d");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<InsightsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInsightsData();
  }, [timeRange]);

  const fetchInsightsData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/insights/dashboard?time_range=${timeRange}`, { cache: "no-store" });
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

  // Tab bar always visible so Churn Reports (and other tabs) always appear
  const tabs = (
    <div className="flex items-center gap-4 border-b border-gray-200">
      <button
        onClick={() => setActiveTab("engagement")}
        className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
          activeTab === "engagement"
            ? "border-blue-600 text-blue-600"
            : "border-transparent text-gray-500 hover:text-gray-700"
        }`}
      >
        Member Engagement
      </button>
      <button
        onClick={() => setActiveTab("churn")}
        className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
          activeTab === "churn"
            ? "border-blue-600 text-blue-600"
            : "border-transparent text-gray-500 hover:text-gray-700"
        }`}
      >
        Churn Reports
      </button>
      <button
        onClick={() => setActiveTab("campaigns")}
        className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
          activeTab === "campaigns"
            ? "border-blue-600 text-blue-600"
            : "border-transparent text-gray-500 hover:text-gray-700"
        }`}
      >
        Campaign Performance
      </button>
    </div>
  );

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
    { name: "Mon", value: engagementBreakdown.emails * 0.7 },
    { name: "Tue", value: engagementBreakdown.emails * 0.8 },
    { name: "Wed", value: engagementBreakdown.emails * 0.9 },
    { name: "Thu", value: engagementBreakdown.emails },
    { name: "Fri", value: engagementBreakdown.emails * 1.1 },
  ];

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
      {tabs}

      {/* Tab content: only the active tab panel is shown */}
      {activeTab === "engagement" && (
        <div className="space-y-6">
          {/* Member stages breakdown – Habit Lifecycle Mapping + retention plays */}
          {memberStagesBreakdown.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
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

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Engagement Rate</h3>
              <div className="text-3xl font-bold text-blue-600">{data.engagementRate ?? 0}%</div>
              <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
                <span>Emails {engagementBreakdown.emails}%</span>
                <span>SMS {engagementBreakdown.sms}%</span>
                <span>Automations {engagementBreakdown.automations}</span>
              </div>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={engagementChartData}>
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Members At Risk</h3>
              <div className="text-3xl font-bold text-blue-600">{data.membersAtRisk ?? 0}</div>
              <p className="mt-2 text-xs text-gray-600">Active members flagged for attention</p>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={engagementChartData}>
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700">Recent Activity</h3>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="text-xs border border-gray-300 rounded px-2 py-1"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>
            <div className="space-y-3">
              {recentActivities.length === 0 ? (
                <p className="text-sm text-gray-500">No recent activity yet.</p>
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
                        <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-xs text-blue-800">📅</span>
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
              <strong>Engagement rate</strong> is the percentage of members who reengaged after receiving a campaign (email or SMS) in the selected period. For example, if you sent 20 campaigns and 4 members came back within the success window, your rate is 20%. Higher is better: it means your outreach is working. Compare email vs SMS to see which channel performs better for your members.
            </p>
            <p className="mb-2">
              <strong>Members at risk</strong> is the count of active members currently flagged as medium or high risk (e.g. low commitment score, long gap since last visit). These are the people to prioritise for check-ins or campaigns. Use the At Risk Members page to act on them.
            </p>
            <p>
              <strong>Recent activity</strong> shows the latest campaign sends and gym visits. Use it to see whether interventions are being followed by visits and to spot patterns (e.g. which campaigns or time ranges drive the most returns).
            </p>
          </div>
        </div>
      )}

      {activeTab === "churn" && (
        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Monthly Churn Rate</h3>
            <div className="text-3xl font-bold text-blue-600 mb-4">{data.monthlyChurnRate ?? 0}%</div>
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
                The <strong>dashed red line (market average)</strong> shows a typical gym churn benchmark (~5% per month). Use it as a reference: if your line (blue) sits below the dashed line, you are retaining members better than the market; if it sits above, more members are leaving than average and retention efforts (e.g. check-ins, campaigns) may need attention.
              </p>
              <p>
                An <strong>ideal churn rate</strong> for fitness is generally between <strong>3–5%</strong> per month. Staying in or below that range suggests healthy retention; consistently above it means it’s worth prioritising at-risk members and interventions.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "campaigns" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-700">Campaigns Sent (7d)</h3>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="text-xs border border-gray-300 rounded px-2 py-1"
                >
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                </select>
              </div>
              <div className="text-3xl font-bold text-blue-600">{data.campaignsSent7d ?? 0}</div>
              <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
                <span>Emails {campaignsBreakdown.emails}</span>
                <span>SMS {campaignsBreakdown.sms}</span>
                <span>Automations {campaignsBreakdown.automations}</span>
              </div>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={campaignsChartData}>
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-medium text-gray-700 mb-4">By Channel</h3>
              <div className="text-xs text-gray-600 mb-2">
                {campaignsBreakdown.emails} Email • {campaignsBreakdown.sms} SMS • {campaignsBreakdown.automations} Automations
              </div>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={campaignsChartData}>
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Campaign Performance Over Time</h3>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="text-sm border border-gray-300 rounded px-3 py-1"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={performanceChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="emails" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                <Area type="monotone" dataKey="sms" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                <Area type="monotone" dataKey="automations" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                <Line type="monotone" dataKey="total" stroke="#ef4444" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-xl border-2 border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
            <p className="font-medium text-gray-900 mb-2">How to read these metrics</p>
            <p className="mb-2">
              <strong>Campaigns sent</strong> is the number of outreach messages (emails or SMS) sent in the selected period (e.g. last 7 days). <strong>By channel</strong> breaks that down into email vs SMS vs automations. Use this to see how active your retention outreach is and whether you are balancing channels.
            </p>
            <p className="mb-2">
              <strong>Campaign performance over time</strong> shows sends per day (stacked by channel) and the red line for total volume. Use it to spot busy vs quiet periods and to see if you are sending consistently. More consistent outreach to at-risk members often improves reengagement; pairing this with the Engagement tab helps you see if volume is translating into returns.
            </p>
            <p>
              There is no single &quot;ideal&quot; send volume: it depends on your member base and risk levels. A good approach is to align sends with your At Risk list and coach actions, then use the Member Engagement rate to see whether your campaigns are driving members back.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
