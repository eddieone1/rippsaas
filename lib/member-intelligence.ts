/**
 * Member Intelligence
 *
 * Proactive retention: behaviour interpretation, churn probability,
 * habit decay index, emotional disengagement flags, and dynamic member stages.
 */

import type { RiskFlags } from "./commitment-score";
import type { ChurnRiskLevel } from "./churn-risk";

/** DB/storage values for the 7 member stages */
export const MEMBER_STAGES = [
  "onboarding_vulnerability",
  "habit_formation",
  "momentum_identity",
  "plateau_boredom_risk",
  "emotional_disengagement",
  "at_risk_silent_quit",
  "win_back_window",
] as const;

export type MemberStage = (typeof MEMBER_STAGES)[number];

/** Human-readable labels for UI */
export const MEMBER_STAGE_LABELS: Record<MemberStage, string> = {
  onboarding_vulnerability: "Onboarding vulnerability",
  habit_formation: "Habit formation",
  momentum_identity: "Momentum & identity",
  plateau_boredom_risk: "Plateau & boredom risk",
  emotional_disengagement: "Emotional disengagement",
  at_risk_silent_quit: "At-risk & silent quit",
  win_back_window: "Win-back window",
};

export interface MemberIntelligenceInput {
  status: "active" | "inactive" | "cancelled";
  churnRiskScore: number;
  churnRiskLevel: ChurnRiskLevel;
  commitmentScore: number;
  habitDecayVelocity: number;
  daysSinceJoined: number;
  daysSinceLastVisit: number | null;
  visitsLast30Days: number;
  riskFlags: RiskFlags;
  /** Attendance decay factor score 0-100 (from commitment factorScores) */
  attendanceDecayScore?: number;
}

/**
 * Map member data to one of the 7 dynamic retention stages.
 */
export function getMemberStage(input: MemberIntelligenceInput): MemberStage {
  const {
    status,
    churnRiskScore,
    commitmentScore,
    daysSinceJoined,
    daysSinceLastVisit,
    visitsLast30Days,
    riskFlags,
    habitDecayVelocity,
  } = input;

  // Inactive or cancelled = stage 7 (win-back window)
  if (status === "inactive" || status === "cancelled") {
    return "win_back_window";
  }

  // Never visited or no recent data
  if (daysSinceLastVisit === null && daysSinceJoined > 0) {
    return "onboarding_vulnerability";
  }

  const daysSince = daysSinceLastVisit ?? 999;

  // At-risk & silent quit: high churn, long absence, or multiple red flags
  if (
    churnRiskScore >= 60 ||
    daysSince >= 30 ||
    (riskFlags.noRecentVisits && riskFlags.largeGap) ||
    (riskFlags.rapidDecline && riskFlags.decliningFrequency)
  ) {
    return "at_risk_silent_quit";
  }

  // Emotional disengagement: declining engagement without yet critical absence
  if (
    (riskFlags.rapidDecline || riskFlags.decliningFrequency) &&
    commitmentScore < 45 &&
    daysSince >= 14
  ) {
    return "emotional_disengagement";
  }

  // Plateau & boredom risk: established but frequency dropping
  if (
    daysSinceJoined >= 90 &&
    (riskFlags.decliningFrequency || habitDecayVelocity < -0.3) &&
    commitmentScore >= 40 &&
    commitmentScore < 65
  ) {
    return "plateau_boredom_risk";
  }

  // Momentum & identity: strong habit, consistent
  if (daysSinceJoined >= 60 && commitmentScore >= 65 && visitsLast30Days >= 4) {
    return "momentum_identity";
  }

  // Habit formation: early but showing consistency
  if (daysSinceJoined >= 14 && daysSinceJoined < 90 && commitmentScore >= 40) {
    return "habit_formation";
  }

  // Onboarding vulnerability: new or fragile
  if (daysSinceJoined < 30 || riskFlags.newMemberLowAttendance) {
    return "onboarding_vulnerability";
  }

  // Default by commitment
  if (commitmentScore >= 50) return "habit_formation";
  if (daysSince >= 21) return "at_risk_silent_quit";
  if (commitmentScore < 40 && daysSince >= 7) return "emotional_disengagement";

  return "habit_formation";
}

/**
 * Derive emotional disengagement flags from risk flags and scores.
 * Used for proactive signalling (not just reactive churn).
 */
export function getEmotionalDisengagementFlags(
  riskFlags: RiskFlags,
  churnRiskLevel: ChurnRiskLevel,
  commitmentScore: number,
  habitDecayVelocity: number
): string[] {
  const flags: string[] = [];

  if (riskFlags.noRecentVisits) {
    flags.push("No recent visits (14+ days)");
  }
  if (riskFlags.rapidDecline) {
    flags.push("Rapid attendance decline");
  }
  if (riskFlags.largeGap) {
    flags.push("Large gap between visits");
  }
  if (riskFlags.inconsistentPattern) {
    flags.push("Inconsistent attendance pattern");
  }
  if (riskFlags.newMemberLowAttendance) {
    flags.push("New member low attendance");
  }
  if (riskFlags.decliningFrequency) {
    flags.push("Declining visit frequency");
  }
  if (churnRiskLevel === "high" && commitmentScore < 40) {
    flags.push("High churn risk with low commitment");
  }
  if (habitDecayVelocity < -0.5) {
    flags.push("Habit decay velocity negative");
  }
  if (commitmentScore < 30 && !riskFlags.noRecentVisits) {
    flags.push("Low commitment despite recent activity");
  }

  return flags;
}

/**
 * Habit decay index 0-100: higher = more decay.
 * Derived from commitment attendance decay (inverted) and decline velocity.
 */
export function getHabitDecayIndex(
  attendanceDecayScore: number,
  declineVelocityScore: number
): number {
  // attendanceDecayScore: 100 = no decay, 0 = full decay
  const decayFromAttendance = 100 - attendanceDecayScore;
  // declineVelocityScore: 100 = improving, 0 = declining
  const decayFromVelocity = 100 - declineVelocityScore;
  const index = Math.round((decayFromAttendance * 0.6 + decayFromVelocity * 0.4));
  return Math.max(0, Math.min(100, index));
}

/**
 * Human-readable behaviour interpretation for coaches.
 */
export function getBehaviourInterpretation(
  stage: MemberStage,
  riskFlags: RiskFlags,
  churnProbability: number,
  habitDecayIndex: number,
  visitsLast30Days: number,
  daysSinceLastVisit: number | null
): string {
  const parts: string[] = [];
  const stageLabel = MEMBER_STAGE_LABELS[stage];

  parts.push(`Member is in **${stageLabel}**.`);

  if (churnProbability >= 50) {
    parts.push(
      `Churn probability is ${churnProbability}%—elevated risk of leaving.`
    );
  } else if (churnProbability >= 25) {
    parts.push(
      `Churn probability is ${churnProbability}%—worth monitoring.`
    );
  }

  if (habitDecayIndex >= 60) {
    parts.push(
      `Habit decay index is ${habitDecayIndex}/100—attendance habit is weakening.`
    );
  } else if (habitDecayIndex >= 40) {
    parts.push(
      `Habit decay index is ${habitDecayIndex}/100—some decline in consistency.`
    );
  }

  const days = daysSinceLastVisit ?? 0;
  if (days > 21) {
    parts.push(`No visit in ${days} days—early intervention recommended.`);
  } else if (days > 14) {
    parts.push(`Last visit was ${days} days ago.`);
  }

  if (visitsLast30Days === 0 && days > 0) {
    parts.push("No visits in the last 30 days.");
  } else if (visitsLast30Days > 0) {
    parts.push(`${visitsLast30Days} visit(s) in the last 30 days.`);
  }

  if (riskFlags.newMemberLowAttendance) {
    parts.push("New member with low attendance—onboarding support may help.");
  }
  if (riskFlags.rapidDecline) {
    parts.push("Attendance has dropped sharply vs previous period.");
  }
  if (riskFlags.largeGap) {
    parts.push("There has been a long gap between visits.");
  }
  if (riskFlags.inconsistentPattern) {
    parts.push("Visit pattern is inconsistent—habit may not be established.");
  }

  return parts.join(" ");
}
