/** Insights page: Member Stages + Campaign Impact */

export type MemberStage =
  | "onboarding"
  | "forming"
  | "stable"
  | "plateau"
  | "at_risk"
  | "winback"
  | "churned";

export type ReasonLabel =
  | "Plateau"
  | "Attendance Drop"
  | "No Bookings"
  | "Payment Friction";

export interface Member {
  id: string;
  name: string;
  avatarUrl?: string | null;
  plan: string;
  location: string;
  stage: MemberStage;
  churnRiskScore: number;
  healthScore: number;
  lastTouchAt: string | null;
  reasons: ReasonLabel[];
  mrr: number;
  status: string;
  stageChangedAt?: string | null;
  previousStage?: MemberStage | null;
}

export interface Campaign {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  channel: string;
  membersReached: number;
  responseRate: number;
  membersSaved: number;
  recoveredRevenue: number;
  reasonsRespondedBreakdown?: { reason: string; count: number }[];
}

export type TimeRange = "7" | "14" | "30" | "90";
export type InsightsTab = "overview" | "churn_risk" | "reasons_stages" | "campaign_impact";

export interface FilterState {
  timeRange: TimeRange;
  location: string;
  segment: string;
  memberFilter: string;
}

export interface OverviewKpis {
  churnedMembers: number;
  churnedPrevious: number;
  avgChurnRisk: number;
  avgChurnRiskTrend: number;
  atRiskMembers: number;
  atRiskTrend: number;
  newAtRisk: number;
  newAtRiskPrevious: number;
}

export interface CampaignImpactKpis {
  completed: number;
  completedPrevious: number;
  avgResponseRate: number;
  membersSaved: number;
  membersSavedDelta: number;
  recoveredRevenue: number;
  recoveredRevenueDelta: number;
}

export interface StageCount {
  stage: MemberStage;
  label: string;
  count: number;
  color: string;
}

export interface ChurnRiskBucket {
  date: string;
  low: number;
  medium: number;
  high: number;
  at_risk: number;
  churned: number;
}
