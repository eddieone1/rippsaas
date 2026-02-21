/**
 * Mission-Control Coach Accountability – extended data types
 * behaviour signals → coach actions → logged outcomes → behaviour change → retention impact
 */

export type RiskLevel = "low" | "moderate" | "high";

export type LifecycleStage =
  | "onboarding_vulnerability"
  | "habit_formation"
  | "momentum_identity"
  | "plateau_boredom_risk"
  | "emotional_disengagement"
  | "at_risk_silent_quit"
  | "win_back_window"
  | "churned";

export type InteractionType = "call" | "sms" | "whatsapp" | "email" | "in_person";

export type InteractionOutcome =
  | "rebooked"
  | "no_response"
  | "attended_next"
  | "freeze_requested"
  | "cancelled"
  | "still_at_risk";

export type PlayCategory =
  | "re_engage"
  | "social_reconnect"
  | "micro_commitment"
  | "program_variation"
  | "identity_reinforcement";

export type TaskStatus = "todo" | "waiting" | "due" | "overdue" | "done";

export interface Member {
  id: string;
  name: string;
  avatarUrl?: string | null;
  phone?: string | null;
  email?: string | null;
  membershipType: string;
  joinDate: string; // ISO
  coachOwnerId: string; // required
  riskLevel: RiskLevel;
  churnProbability: number; // 0-100
  commitmentScore: number; // 0-100
  habitDecayVelocity: number; // numeric
  lifecycleStage: LifecycleStage;
  riskReasons: string[];
  lastVisitDate: string | null; // ISO
  lastInteractionDate: string | null; // ISO
  attendanceSeries: { date: string; value: number }[];
  commitmentSeries: { date: string; value: number }[];
  socialSeries: { date: string; value: number }[];
  touchSeries: { date: string; value: number }[];
  tags: string[];
  isResolved?: boolean;
  saved?: boolean; // Member retained after intervention
}

export interface Coach {
  id: string;
  name: string;
  avatarUrl?: string | null;
  role: string;
}

export interface Interaction {
  id: string;
  memberId: string;
  coachId: string;
  timestamp: string; // ISO
  type: InteractionType;
  playId?: string | null;
  notes?: string | null;
  outcome?: InteractionOutcome | null;
  followUpDate?: string | null; // ISO
}

export interface RetentionPlay {
  id: string;
  name: string;
  category: PlayCategory;
  stageTargets: LifecycleStage[];
  triggerReasons: string[];
  suggestedChannel: InteractionType;
  templateMessage: string;
  callScript?: string;
  expectedOutcome: string;
}

export interface Task {
  id: string;
  coachId: string;
  memberId: string;
  title: string;
  dueDate: string; // ISO
  status: TaskStatus;
  priority: number;
}

export interface CoachMetrics {
  coachId: string;
  membersAssignedCount: number;
  atRiskAssignedCount: number;
  contactedTodayCount: number;
  contactedThisWeekCount: number;
  contactCoveragePct: number;
  avgResponseTimeHours: number;
  responseRatePct: number;
  reengagementRatePct: number;
  saveRatePct: number;
  behaviourImprovementRatePct: number;
  membersSavedThisMonth: number;
  revenueRetainedThisMonthGBP: number;
  coachRetentionScore: number; // 0-100
  outreachStreakDays?: number;
}

export interface TeamMetrics {
  revenueAtRiskGBP: number;
  membersAtRiskCount: number;
  membersSavedThisMonth: number;
  revenueRetainedThisMonthGBP: number;
  retentionRatePct: number;
}

/** Automation rule (mock) */
export interface AutomationRule {
  id: string;
  name: string;
  enabled: boolean;
  description: string;
}
