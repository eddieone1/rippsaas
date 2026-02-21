"use client";

import { useState, useMemo, useEffect } from "react";
import type { InsightsTab, FilterState, TimeRange } from "./insights-types";
import InsightsTabsNav from "./InsightsTabsNav";
import InsightsFiltersRow from "./InsightsFiltersRow";
import InsightsKpiCard from "./InsightsKpiCard";
import AtRiskList from "./AtRiskList";
import CampaignTable from "./CampaignTable";
import BottomStatStrip from "./BottomStatStrip";
import {
  ChartCard,
  StackedAreaChart,
  BarChartHorizontal,
  GroupedBarChart,
  ComboChartBarLine,
  StageSegmentBar,
  DonutChart,
} from "./InsightsCharts";
import {
  groupByStage,
  churnRiskSeries,
  computeOverviewKpis,
  computeCampaignImpactKpis,
  getReasonCounts,
} from "./insights-data";
import type { Member, Campaign } from "./insights-types";

function filterMembers(members: Member[], filters: FilterState): Member[] {
  let out = [...members];
  if (filters.location !== "all") {
    out = out.filter((m) => m.location.toLowerCase() === filters.location);
  }
  if (filters.segment === "at_risk") {
    out = out.filter((m) => m.stage === "at_risk");
  }
  if (filters.segment === "active") {
    out = out.filter((m) => m.status === "active");
  }
  return out;
}

export default function InsightsPageClient() {
  const [activeTab, setActiveTab] = useState<InsightsTab>("overview");
  const [members, setMembers] = useState<Member[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    timeRange: "14",
    location: "all",
    segment: "all",
    memberFilter: "all",
  });

  useEffect(() => {
    let cancelled = false;
    setMembersLoading(true);
    fetch("/api/insights/data")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          if (Array.isArray(data.members)) setMembers(data.members);
          if (Array.isArray(data.campaigns)) setCampaigns(data.campaigns);
        }
      })
      .catch(() => {
        if (!cancelled) setMembers([]);
      })
      .finally(() => {
        if (!cancelled) setMembersLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const filteredMembers = useMemo(() => filterMembers(members, filters), [members, filters]);
  const riskSeries = useMemo(() => churnRiskSeries(filteredMembers, filters.timeRange), [filteredMembers, filters.timeRange]);
  const overviewKpis = useMemo(() => computeOverviewKpis(filteredMembers, filters.timeRange), [filteredMembers, filters.timeRange]);
  const campaignKpis = useMemo(() => computeCampaignImpactKpis(campaigns), [campaigns]);
  const stages = useMemo(() => groupByStage(filteredMembers), [filteredMembers]);
  const reasonCounts = useMemo(() => getReasonCounts(filteredMembers), [filteredMembers]);

  const riskDonutData = useMemo(() => {
    const atRisk = filteredMembers.filter((m) => m.stage === "at_risk").length;
    const high = filteredMembers.filter((m) => m.churnRiskScore >= 70 && m.stage !== "churned").length;
    const med = filteredMembers.filter((m) => m.churnRiskScore >= 40 && m.churnRiskScore < 70 && m.stage !== "churned").length;
    const low = filteredMembers.filter((m) => m.churnRiskScore < 40 && m.stage !== "churned").length;
    return [
      { label: "Low", value: low, color: "#4CAF50" },
      { label: "Medium", value: med, color: "#FFC107" },
      { label: "High", value: high, color: "#F44336" },
    ];
  }, [filteredMembers]);

  const recentStageChanges = useMemo(
    () =>
      filteredMembers
        .filter((m) => m.stageChangedAt && m.previousStage)
        .sort((a, b) => (b.stageChangedAt ?? "").localeCompare(a.stageChangedAt ?? ""))
        .slice(0, 8),
    [filteredMembers]
  );

  const habitDecayData = useMemo(() => [], []);

  const topReasonsResponded = useMemo(
    () =>
      campaigns
        .flatMap((c) => c.reasonsRespondedBreakdown ?? [])
        .reduce(
          (acc, { reason, count }) => {
            acc[reason] = (acc[reason] ?? 0) + count;
            return acc;
          },
          {} as Record<string, number>
        ),
    [campaigns]
  );
  const topReasonsArray = Object.entries(topReasonsResponded)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return (
    <div
      className="min-h-screen rounded-2xl border border-white/[0.08] bg-[#1F2121] shadow-xl"
      style={{
        background: "linear-gradient(180deg, #0B0B0B 0%, #1F2121 25%, #2F3131 100%)",
      }}
    >
      <div className="p-4 sm:p-6">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Insights</h1>
        {membersLoading && (
          <p className="mt-2 text-sm text-white/65">Loading member data…</p>
        )}
        <InsightsTabsNav active={activeTab} onChange={setActiveTab} />
        <div className="mt-4">
          <InsightsFiltersRow
            filters={filters}
            onTimeRangeChange={(v) => setFilters((f) => ({ ...f, timeRange: v }))}
            onLocationChange={(v) => setFilters((f) => ({ ...f, location: v }))}
            onSegmentChange={(v) => setFilters((f) => ({ ...f, segment: v }))}
            onMemberFilterChange={(v) => setFilters((f) => ({ ...f, memberFilter: v }))}
            locations={Array.from(new Set(members.map((m) => m.location).filter(Boolean)))}
          />
        </div>

        {activeTab === "overview" && (
          <div className="mt-6 space-y-6">
            <p className="text-xs text-white/55 max-w-2xl">
              Summary metrics for your filtered members. Lower churn and fewer at-risk members is better; focus outreach on at-risk and new at-risk counts.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <InsightsKpiCard
                title="Churned Members"
                value={overviewKpis.churnedMembers}
                sub={overviewKpis.churnedPrevious}
                trend="down"
              />
              <InsightsKpiCard
                title="Avg. Churn Risk"
                value={`${overviewKpis.avgChurnRisk}%`}
                trendLabel={`${overviewKpis.avgChurnRiskTrend}%`}
                trend="up"
              />
              <InsightsKpiCard
                title="At Risk Members"
                value={overviewKpis.atRiskMembers}
                sub={overviewKpis.atRiskTrend}
                trend="up"
              />
              <InsightsKpiCard
                title="New At Risk"
                value={overviewKpis.newAtRisk}
                sub={overviewKpis.newAtRiskPrevious}
                trend="up"
                accent
              />
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <ChartCard
                  title="Churn Risk Breakdown"
                  description="Stacked areas show how many members fall into each risk band over the last 14 days. Bottom (green) = low risk, top (dark) = churned. Use it to spot shifts toward higher risk."
                >
                  <StackedAreaChart data={riskSeries} />
                </ChartCard>
              </div>
              <AtRiskList members={filteredMembers} description="Members currently in the at-risk stage. Prioritise outreach here to prevent churn." />
            </div>
            <ChartCard
              title="Members by Stage"
              description="Count of members in each lifecycle stage from onboarding to churned. Helps you see where most members sit and where to focus retention efforts."
            >
              <StageSegmentBar stages={stages} />
            </ChartCard>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ChartCard
                title="Reasons Members Are at Risk"
                description="Why members are flagged at risk (e.g. attendance drop, no bookings). Higher bars = more members with that reason; use to target the right messaging."
              >
                <BarChartHorizontal data={reasonCounts.map((r) => ({ label: r.reason, value: r.count }))} barColor="#FF9800" />
              </ChartCard>
              <ChartCard
                title="Habit Decay Over Time"
                description="Intended to show how member engagement changes week over week. Data appears here when available."
              >
                {habitDecayData.length === 0 ? (
                  <div className="flex h-24 items-center justify-center rounded-lg bg-white/5 text-sm text-white/50">No data</div>
                ) : (
                  <GroupedBarChart data={habitDecayData} />
                )}
              </ChartCard>
            </div>
            <p className="text-xs text-white/55 max-w-2xl">Recovered revenue is the MRR from members who made another visit after outreach (re-engagement = physical return). Other retention stats show here when tracked.</p>
            <BottomStatStrip
              tiles={[
                { label: "Retention Win Rate", value: "—" },
                { label: "Avg. Days to Recover", value: "—" },
                { label: "Recovered Revenue", value: `£${campaignKpis.recoveredRevenue}`, accent: true },
              ]}
            />
          </div>
        )}

        {activeTab === "churn_risk" && (
          <div className="mt-6 space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <ChartCard
                  title="Churn Risk Breakdown"
                  description="Stacked areas show how many members fall into each risk band over the last 14 days. Bottom (green) = low risk, top (dark) = churned. Use it to spot shifts toward higher risk."
                >
                  <StackedAreaChart data={riskSeries} />
                </ChartCard>
              </div>
              <ChartCard
                title="Risk distribution"
                description="Share of members by risk level (low / medium / high). Use it to see how concentrated risk is and whether most members are in a healthy band."
              >
                <DonutChart data={riskDonutData} />
                <div className="mt-2 space-y-1 text-center text-xs text-white/65">
                  {riskDonutData.map((d) => (
                    <p key={d.label}>{d.label}: {d.value}</p>
                  ))}
                </div>
              </ChartCard>
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ChartCard
                title="Highest risk reasons this period"
                description="Main reasons members are at risk. Focus outreach on the top reasons to have the biggest impact."
              >
                <BarChartHorizontal data={reasonCounts.map((r) => ({ label: r.reason, value: r.count }))} barColor="#F44336" />
              </ChartCard>
              <ChartCard
                title="At-risk cohort movement"
                description="Planned: flow of members moving between risk states over time. Will show when available."
              >
                <div className="flex h-32 items-center justify-center rounded-lg bg-white/5 text-sm text-white/50">
                  Sankey placeholder
                </div>
              </ChartCard>
            </div>
          </div>
        )}

        {activeTab === "reasons_stages" && (
          <div className="mt-6 space-y-6">
            <ChartCard
              title="Members by Stage"
              description="Count of members in each lifecycle stage from onboarding to churned. Helps you see where most members sit and where to focus retention efforts."
            >
              <StageSegmentBar stages={stages} />
            </ChartCard>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ChartCard
                title="Reasons at risk"
                description="Why members are flagged at risk. Higher bars = more members with that reason; use to target the right messaging."
              >
                <BarChartHorizontal data={reasonCounts.map((r) => ({ label: r.reason, value: r.count }))} barColor="#FF9800" />
              </ChartCard>
              <div className="rounded-xl border border-white/[0.08] bg-[#2F3131] p-4 shadow-lg">
                <h3 className="text-sm font-semibold text-white">Recent Stage Changes</h3>
                <p className="mt-1 text-xs text-white/55 leading-snug">Members who moved from one stage to another (e.g. stable → at risk). Use to see who recently worsened or improved.</p>
                <ul className="mt-3 space-y-2">
                  {recentStageChanges.length === 0 ? (
                    <li className="text-sm text-white/50">No recent changes</li>
                  ) : (
                    recentStageChanges.map((m) => (
                      <li key={m.id} className="flex items-center justify-between text-sm">
                        <span className="text-white/80">{m.name}</span>
                        <span className="text-white/55">
                          {m.previousStage} → {m.stage}{" "}
                          <span className="text-white/45">
                            {m.stageChangedAt ? new Date(m.stageChangedAt).toLocaleDateString() : ""}
                          </span>
                        </span>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
            <ChartCard
              title="Stage conversion"
              description="Rates at which members move from one stage to another (e.g. stable → at risk). Fills in when conversion data is available; use to prioritise interventions."
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.08]">
                      <th className="py-2 text-left font-semibold text-white/90">Stage</th>
                      <th className="py-2 text-left font-semibold text-white/90">Next stage</th>
                      <th className="py-2 text-right font-semibold text-[#9EFF00]">Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-white/[0.06]"><td className="py-2 text-white/70">Stable</td><td className="py-2 text-white/70">At Risk</td><td className="py-2 text-right text-[#9EFF00]">—</td></tr>
                    <tr className="border-b border-white/[0.06]"><td className="py-2 text-white/70">Plateau</td><td className="py-2 text-white/70">At Risk</td><td className="py-2 text-right text-[#9EFF00]">—</td></tr>
                    <tr className="border-b border-white/[0.06]"><td className="py-2 text-white/70">At Risk</td><td className="py-2 text-white/70">Stable</td><td className="py-2 text-right text-[#9EFF00]">—</td></tr>
                  </tbody>
                </table>
              </div>
            </ChartCard>
          </div>
        )}

        {activeTab === "campaign_impact" && (
          <div className="mt-6 space-y-6">
            <p className="text-xs text-white/55 max-w-2xl">
              Impact of your retention plays. Completed = number of plays; members saved = made another visit; recovered revenue = MRR from those members. Higher response rate means messages are working.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <InsightsKpiCard title="Completed" value={campaignKpis.completed} sub={campaignKpis.completedPrevious} />
              <InsightsKpiCard title="Avg. Response Rate" value={`${campaignKpis.avgResponseRate}%`} accent />
              <InsightsKpiCard title="Members Saved" value={campaignKpis.membersSaved} trendLabel={`+${campaignKpis.membersSavedDelta}`} trend="up" accent />
              <InsightsKpiCard title="Recovered Revenue" value={`£${campaignKpis.recoveredRevenue}`} trendLabel={`+£${campaignKpis.recoveredRevenueDelta}`} trend="up" accent />
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <CampaignTable campaigns={campaigns} description="Each row is a play or send: who it reached, what share responded, and how many made another visit. Use it to compare outreach and double down on what works." />
              </div>
              <ChartCard
                title="Overall Outreach Response"
                description="Bars = members reached per play; line = response rate %. Compare reach vs. response to see which outreach both scales and converts."
              >
                {campaigns.length === 0 ? (
                  <div className="flex h-40 items-center justify-center rounded-lg bg-white/5 text-sm text-white/50">No outreach data</div>
                ) : (
                  <ComboChartBarLine
                    reached={campaigns.slice(0, 6).map((c) => c.membersReached)}
                    responseRates={campaigns.slice(0, 6).map((c) => c.responseRate)}
                  />
                )}
                <a href="#" className="mt-3 inline-block text-xs font-medium text-[#9EFF00] hover:underline">
                  View segment
                </a>
              </ChartCard>
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ChartCard
                title="Top Reasons Members Respond"
                description="When outreach collects feedback, this shows why members made another visit. Use it to refine messaging and offers."
              >
                <BarChartHorizontal data={topReasonsArray} barColor="#9EFF00" />
              </ChartCard>
              <div className="rounded-xl border border-white/[0.08] bg-[#2F3131] overflow-hidden shadow-lg">
                <div className="p-4 border-b border-white/[0.08]">
                  <h3 className="text-sm font-semibold text-white">Recent Outreach Conversions</h3>
                  <p className="mt-1 text-xs text-white/55 leading-snug">Latest plays and sends with members saved % (visited / reached) and response rate. Quick view of recent wins.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.08]">
                        <th className="px-4 py-3 text-left font-semibold text-white/90">Play / Send</th>
                        <th className="px-4 py-3 text-right font-semibold text-[#9EFF00]">Members Saved %</th>
                        <th className="px-4 py-3 text-right font-semibold text-white/90">Response %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaigns.slice(0, 4).map((c) => (
                        <tr key={c.id} className="border-b border-white/[0.06]">
                          <td className="px-4 py-3 text-white/80">{c.name}</td>
                          <td className="px-4 py-3 text-right text-[#9EFF00]">
                            {Math.round((c.membersSaved / c.membersReached) * 100)}% ↑
                          </td>
                          <td className="px-4 py-3 text-right text-white/70">{c.responseRate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <p className="text-xs text-white/55 max-w-2xl">Recovered revenue = MRR from members who made another visit after outreach. Other outreach-level stats show here when tracked.</p>
            <BottomStatStrip
              tiles={[
                { label: "Average Recovery Time", value: "—" },
                { label: "Average Win Rate", value: "—", accent: true },
                { label: "Recovered Revenue", value: `£${campaignKpis.recoveredRevenue}`, accent: true },
              ]}
            />
          </div>
        )}
      </div>
    </div>
  );
}
