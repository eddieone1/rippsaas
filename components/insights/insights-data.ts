import type { Member, Campaign, ChurnRiskBucket, StageCount, ReasonLabel, OverviewKpis, CampaignImpactKpis } from "./insights-types";

const STAGE_LABELS: Record<string, string> = {
  onboarding: "Onboarding",
  forming: "Forming Habit",
  stable: "Stable",
  plateau: "Plateau",
  at_risk: "At Risk",
  winback: "Win-back",
  churned: "Churned",
};

const STAGE_COLORS: Record<string, string> = {
  onboarding: "#9EFF00",
  forming: "#7ED321",
  stable: "#4CAF50",
  plateau: "#FFC107",
  at_risk: "#FF9800",
  winback: "#9C27B0",
  churned: "#F44336",
};

export function groupByStage(members: Member[]): StageCount[] {
  const order: Member["stage"][] = ["onboarding", "forming", "stable", "plateau", "at_risk", "winback", "churned"];
  const counts: Record<string, number> = {};
  order.forEach((s) => (counts[s] = 0));
  members.forEach((m) => { counts[m.stage] = (counts[m.stage] || 0) + 1; });
  return order.map((stage) => ({
    stage,
    label: STAGE_LABELS[stage] || stage,
    count: counts[stage] || 0,
    color: STAGE_COLORS[stage] || "#666",
  }));
}

/** Build churn risk time series from current member distribution (same distribution repeated for each day). */
export function churnRiskSeries(members: Member[], _timeRange: string): ChurnRiskBucket[] {
  const low = members.filter((m) => m.stage !== "churned" && m.churnRiskScore < 40).length;
  const medium = members.filter((m) => m.stage !== "churned" && m.churnRiskScore >= 40 && m.churnRiskScore < 65).length;
  const high = members.filter((m) => m.stage !== "churned" && m.churnRiskScore >= 65 && m.churnRiskScore < 85).length;
  const at_risk = members.filter((m) => m.stage === "at_risk").length;
  const churned = members.filter((m) => m.stage === "churned").length;
  const days = 14;
  const buckets: ChurnRiskBucket[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    buckets.push({
      date: d.toISOString().slice(0, 10),
      low,
      medium,
      high,
      at_risk,
      churned,
    });
  }
  return buckets;
}

export function computeOverviewKpis(members: Member[], _timeRange: string): OverviewKpis {
  const churned = members.filter((m) => m.stage === "churned").length;
  const atRisk = members.filter((m) => m.stage === "at_risk").length;
  const risks = members.map((m) => m.churnRiskScore).filter((r) => r > 0);
  const avgRisk = risks.length ? Math.round(risks.reduce((a, b) => a + b, 0) / risks.length) : 0;
  return {
    churnedMembers: churned,
    churnedPrevious: 0,
    avgChurnRisk: avgRisk,
    avgChurnRiskTrend: 0,
    atRiskMembers: atRisk,
    atRiskTrend: 0,
    newAtRisk: atRisk,
    newAtRiskPrevious: 0,
  };
}

export function computeCampaignImpactKpis(campaigns: Campaign[]): CampaignImpactKpis {
  const completed = campaigns.length;
  const totalReached = campaigns.reduce((s, c) => s + c.membersReached, 0);
  const totalSaved = campaigns.reduce((s, c) => s + c.membersSaved, 0);
  const totalRevenue = campaigns.reduce((s, c) => s + c.recoveredRevenue, 0);
  const avgRate = totalReached ? Math.round((campaigns.reduce((s, c) => s + c.responseRate * c.membersReached, 0) / totalReached)) : 0;
  return {
    completed,
    completedPrevious: 0,
    avgResponseRate: avgRate,
    membersSaved: totalSaved,
    membersSavedDelta: 0,
    recoveredRevenue: totalRevenue,
    recoveredRevenueDelta: 0,
  };
}

export function getReasonCounts(members: Member[]): { reason: ReasonLabel; count: number }[] {
  const map: Record<string, number> = { Plateau: 0, "Attendance Drop": 0, "No Bookings": 0, "Payment Friction": 0 };
  members.forEach((m) => m.reasons.forEach((r) => { map[r] = (map[r] || 0) + 1; }));
  return (["Plateau", "Attendance Drop", "No Bookings", "Payment Friction"] as const).map((reason) => ({ reason, count: map[reason] || 0 }));
}
