/**
 * Habit Lifecycle Mapping – member stages and retention plays.
 * Members are mapped dynamically across stages; each stage triggers a different retention play.
 * @see 4.2 Habit Lifecycle Mapping
 */

export const MEMBER_STAGES = [
  "onboarding_vulnerability",
  "habit_formation",
  "momentum_identity",
  "plateau_boredom_risk",
  "emotional_disengagement",
  "at_risk_silent_quit",
  "win_back_window",
  "churned",
] as const;

export type MemberStage = (typeof MEMBER_STAGES)[number];

export const MEMBER_STAGE_LABELS: Record<MemberStage, string> = {
  onboarding_vulnerability: "Onboarding vulnerability",
  habit_formation: "Habit formation",
  momentum_identity: "Momentum & identity",
  plateau_boredom_risk: "Plateau & boredom risk",
  emotional_disengagement: "Emotional disengagement",
  at_risk_silent_quit: "At-risk & silent quit",
  win_back_window: "Win-back window",
  churned: "Churned",
};

/** Subtle retention play (strategy) suggested for each stage. */
export const MEMBER_STAGE_PLAYS: Record<MemberStage, string> = {
  onboarding_vulnerability: "Nurture first 30 days: check-in calls, goal-setting, first-win celebrations.",
  habit_formation: "Lock in routine: suggest fixed class times, buddy invites, small rewards for consistency.",
  momentum_identity: "Reinforce identity: highlight streaks, member spotlights, community events.",
  plateau_boredom_risk: "Reignite interest: new goals, challenges, or a different class format.",
  emotional_disengagement: "Reconnect personally: 1:1 touchpoint, ask what would make the gym feel essential again.",
  at_risk_silent_quit: "Prioritise outreach: personalised message or call before they slip away.",
  win_back_window: "Win-back campaign: we-miss-you message, incentive or free class to bring them back.",
  churned: "Optional win-back: targeted offer if they left on good terms; otherwise respect the exit.",
};

export interface GetMemberStageParams {
  status: string;
  churnRiskScore: number;
  churnRiskLevel: string;
  commitmentScore: number;
  habitDecayVelocity?: number;
  daysSinceJoined: number;
  daysSinceLastVisit: number | null;
  visitsLast30Days: number;
  riskFlags?: string[] | Record<string, unknown>;
  attendanceDecayScore?: number;
}

/**
 * Map a member into one of the habit lifecycle stages.
 * Uses status, tenure, recency, risk and commitment to place them in the right bucket.
 */
export function getMemberStage(params: GetMemberStageParams): MemberStage {
  const {
    status,
    churnRiskScore,
    churnRiskLevel,
    commitmentScore,
    daysSinceJoined,
    daysSinceLastVisit,
    visitsLast30Days,
  } = params;

  if (status === "cancelled") return "churned";

  const daysSince = daysSinceLastVisit ?? 999;
  const isNew = daysSinceJoined <= 30;
  const isVeryNew = daysSinceJoined <= 14;
  const isLapsed = daysSince >= 14; // 2+ weeks no visit
  const isLongLapsed = daysSince >= 30;
  const isHighRisk = churnRiskLevel === "high" || churnRiskScore >= 65;
  const isMediumRisk = churnRiskLevel === "medium" || (churnRiskScore >= 40 && churnRiskScore < 65);
  const isLowCommitment = commitmentScore < 40;
  const isDecliningCommitment = commitmentScore >= 40 && commitmentScore < 60;
  const hasStrongHabit = visitsLast30Days >= 3 && commitmentScore >= 60;
  const hasFormingHabit = visitsLast30Days >= 1 && daysSince <= 7;

  // Win-back window: lapsed but not cancelled – best time to re-engage
  if (status !== "cancelled" && isLongLapsed && !hasFormingHabit) return "win_back_window";

  // At-risk & silent quit: high risk, drifting, not yet lapsed long
  if (isHighRisk && (isLapsed || isLowCommitment)) return "at_risk_silent_quit";

  // Emotional disengagement: medium risk or declining commitment, still some visits
  if ((isMediumRisk || isDecliningCommitment) && visitsLast30Days < 2 && !isVeryNew)
    return "emotional_disengagement";

  // Plateau & boredom risk: tenure 3+ months, attendance flattening or declining
  if (daysSinceJoined >= 90 && (isDecliningCommitment || (visitsLast30Days <= 2 && daysSince <= 14)))
    return "plateau_boredom_risk";

  // Momentum & identity: established, consistent, high commitment
  if (daysSinceJoined >= 60 && hasStrongHabit) return "momentum_identity";

  // Habit formation: past first weeks, starting to come regularly
  if (!isVeryNew && hasFormingHabit && daysSinceJoined <= 90) return "habit_formation";

  // Onboarding vulnerability: first 2–4 weeks, high drop-off risk
  if (isNew) return "onboarding_vulnerability";

  // Default at-risk if nothing else fits
  if (isHighRisk || isLowCommitment) return "at_risk_silent_quit";
  if (isLapsed) return "win_back_window";

  return "habit_formation";
}

/**
 * Get retention play for a stage (for display in insights and profile).
 */
export function getRetentionPlayForStage(stage: MemberStage): string {
  return MEMBER_STAGE_PLAYS[stage] ?? "";
}

/**
 * Flags indicating emotional disengagement (for display / coaching).
 */
export function getEmotionalDisengagementFlags(
  riskFlags: string[] | Record<string, unknown> | undefined,
  _churnLevel: string,
  _score: number,
  _habitDecayVelocity?: number
): string[] {
  if (Array.isArray(riskFlags)) return riskFlags;
  if (riskFlags && typeof riskFlags === "object") {
    return Object.keys(riskFlags).filter((k) => (riskFlags as Record<string, unknown>)[k]);
  }
  return [];
}

/**
 * Single index combining attendance decay and decline velocity (0–100 scale).
 */
export function getHabitDecayIndex(
  attendanceDecayScore?: number,
  declineVelocity?: number
): number {
  const attendance = attendanceDecayScore ?? 0;
  const velocity = declineVelocity ?? 0;
  return Math.round(Math.min(100, Math.max(0, (attendance + velocity) / 2)));
}

/**
 * Short behavioural interpretation text for the member profile.
 */
export function getBehaviourInterpretation(
  memberStage: MemberStage,
  _riskFlags: string[] | Record<string, unknown> | undefined,
  churnProbability: number,
  habitDecayIndex: number,
  visitsLast30Days: number,
  daysSinceLastVisit: number | null
): string {
  const play = MEMBER_STAGE_PLAYS[memberStage];
  if (memberStage === "churned") return "Member has cancelled. " + (play ?? "");
  if (memberStage === "win_back_window") return "In the win-back window. " + (play ?? "");
  if (memberStage === "at_risk_silent_quit") {
    if (churnProbability >= 70) return "High churn risk; prioritise contact. " + (play ?? "");
    return "At-risk; silent quit risk. " + (play ?? "");
  }
  if (memberStage === "emotional_disengagement")
    return "Emotional disengagement detected. " + (play ?? "");
  if (memberStage === "plateau_boredom_risk") return "Plateau or boredom risk. " + (play ?? "");
  if (memberStage === "onboarding_vulnerability") return "New member; onboarding critical. " + (play ?? "");
  if (memberStage === "habit_formation") return "Building habit; support consistency. " + (play ?? "");
  if (visitsLast30Days >= 4 && (daysSinceLastVisit ?? 999) <= 7)
    return "Strong momentum; maintain identity and community. " + (play ?? "");
  return "Engaged; continue appropriate touchpoints. " + (play ?? "");
}
