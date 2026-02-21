import { differenceInDays, parseISO } from "date-fns";
import { getDistanceRiskScore } from "./proximity";

export type ChurnRiskLevel = "none" | "low" | "medium" | "high";

export interface ChurnRiskResult {
  level: ChurnRiskLevel;
  score: number;
}

export interface MemberForRiskCalculation {
  last_visit_date: string | null;
  joined_date: string;
  commitment_score?: number | null;
  has_received_campaign?: boolean;
  distance_from_gym_km?: number | null;
  age?: number | null;
  employment_status?: string | null;
  student_status?: string | null;
  visits_last_30_days?: number | null;
  total_visits?: number | null;
}

function getDaysSince(dateString: string | null): number | null {
  if (!dateString) return null;
  try {
    const date = parseISO(dateString);
    return differenceInDays(new Date(), date);
  } catch {
    return null;
  }
}

/**
 * Calculate churn risk based on commitment score and days since last visit
 * 
 * Risk level is determined by commitment score ONLY:
 * - 1-20: High risk
 * - 21-60: Medium risk
 * - 61-79: Low risk
 * - 80+: No risk
 * 
 * Risk score calculation:
 * - Base risk score starts from commitment score (inverted: lower commitment = higher risk)
 * - Every 14 days without visiting increases risk score by 20% (multiplicative)
 * - Example: Commitment 50 → base risk 50, after 14 days → 60, after 28 days → 72
 */
export function calculateChurnRisk(
  member: MemberForRiskCalculation
): ChurnRiskResult {
  const daysSinceLastVisit = getDaysSince(member.last_visit_date);
  const commitmentScore = member.commitment_score ?? 50; // Default to 50 if not provided

  // Handle edge cases first
  if (daysSinceLastVisit === null) {
    // Never visited - always high risk
    return { level: "high", score: 85 };
  }
  
  if (daysSinceLastVisit === 0) {
    // Visited today - risk level based on commitment score only
    if (commitmentScore >= 80) {
      return { level: "none", score: 0 };
    } else if (commitmentScore >= 61) {
      return { level: "low", score: Math.round(100 - commitmentScore) };
    } else if (commitmentScore >= 21) {
      return { level: "medium", score: Math.round(100 - commitmentScore) };
    } else {
      return { level: "high", score: Math.round(100 - commitmentScore) };
    }
  }

  // Determine risk level based on commitment score ONLY (as specified)
  let level: ChurnRiskLevel;
  if (commitmentScore >= 80) {
    level = "none";
  } else if (commitmentScore >= 61) {
    level = "low";
  } else if (commitmentScore >= 21) {
    level = "medium";
  } else {
    level = "high";
  }

  // Calculate base risk score (inverted commitment: lower commitment = higher risk)
  // Commitment 80+ → risk 0-20, Commitment 61-79 → risk 21-39, etc.
  let riskScore = 100 - commitmentScore;

  // Apply 20% increase for every 14 days without visiting (multiplicative)
  // Each 14-day period multiplies the risk by 1.2
  if (daysSinceLastVisit > 0) {
    const fourteenDayPeriods = Math.floor(daysSinceLastVisit / 14);
    if (fourteenDayPeriods > 0) {
      // Each period increases risk by 20%: riskScore * (1.2 ^ periods)
      riskScore = riskScore * Math.pow(1.2, fourteenDayPeriods);
    }
  }

  // Ensure score is between 0 and 100
  riskScore = Math.max(0, Math.min(100, Math.round(riskScore)));

  return { level, score: riskScore };
}
