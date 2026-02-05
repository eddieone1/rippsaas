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
 * Calculate churn risk with granular scoring
 * Uses multiple factors with smooth gradients to ensure differentiation
 */
export function calculateChurnRisk(
  member: MemberForRiskCalculation
): ChurnRiskResult {
  const daysSinceLastVisit = getDaysSince(member.last_visit_date);
  const daysSinceJoined = getDaysSince(member.joined_date) || 0;

  // If never visited or visited today, no risk
  if (daysSinceLastVisit === null || daysSinceLastVisit === 0) {
    return { level: "none", score: 0 };
  }

  let score = 0;

  // 1. ATTENDANCE FACTOR (40% weight) - Granular scoring with smooth gradients
  // More granular than before - each day matters
  let attendanceScore = 0;
  if (daysSinceLastVisit >= 60) {
    // 60+ days: Very high risk, automatic high risk
    attendanceScore = 85 + Math.min(10, (daysSinceLastVisit - 60) / 2); // 85-95 range
  } else if (daysSinceLastVisit >= 50) {
    // 50-59 days: High risk, significant increase
    attendanceScore = 70 + ((daysSinceLastVisit - 50) * 1.5); // 70-85 range
  } else if (daysSinceLastVisit >= 30) {
    // 30-49 days: High risk
    attendanceScore = 50 + ((daysSinceLastVisit - 30) * 1.0); // 50-70 range
  } else if (daysSinceLastVisit >= 21) {
    // 21-29 days: Medium-high risk
    attendanceScore = 35 + ((daysSinceLastVisit - 21) * 1.67); // 35-50 range
  } else if (daysSinceLastVisit >= 14) {
    // 14-20 days: Medium risk
    attendanceScore = 20 + ((daysSinceLastVisit - 14) * 2.14); // 20-35 range
  } else if (daysSinceLastVisit >= 7) {
    // 7-13 days: Low-medium risk
    attendanceScore = 8 + ((daysSinceLastVisit - 7) * 1.71); // 8-20 range
  } else {
    // 1-6 days: Low risk
    attendanceScore = daysSinceLastVisit * 1.33; // 1-8 range
  }
  
  // Apply 40% weight
  score += attendanceScore * 0.40;

  // 2. VISIT FREQUENCY FACTOR (15% weight)
  // Members with more recent visits are lower risk
  let frequencyScore = 0;
  const visitsLast30Days = member.visits_last_30_days || 0;
  
  if (visitsLast30Days >= 8) {
    frequencyScore = 0; // Very active, no risk
  } else if (visitsLast30Days >= 4) {
    frequencyScore = 10; // Regular attendance
  } else if (visitsLast30Days >= 2) {
    frequencyScore = 25; // Occasional attendance
  } else if (visitsLast30Days >= 1) {
    frequencyScore = 40; // Rare attendance
  } else {
    frequencyScore = 60; // No visits in last 30 days
  }
  
  // Apply 15% weight
  score += frequencyScore * 0.15;

  // 3. PROXIMITY FACTOR (15% weight)
  // Greater distance = higher risk
  const distanceRisk = getDistanceRiskScore(member.distance_from_gym_km);
  score += distanceRisk * 0.15;

  // 4. AGE FACTOR (10% weight)
  // Teenagers (13-19) and very young adults (20-25) have higher churn risk
  let ageScore = 0;
  const age = member.age;
  if (age !== null && age !== undefined) {
    if (age < 20) {
      ageScore = 50; // Teenagers higher risk
    } else if (age < 26) {
      ageScore = 30; // Young adults moderate risk
    } else if (age < 35) {
      ageScore = 15; // Adults lower risk
    } else if (age < 50) {
      ageScore = 10; // Middle-aged lower risk
    } else {
      ageScore = 5; // Older adults lowest risk (more committed)
    }
  }
  score += ageScore * 0.10;

  // 5. EMPLOYMENT/STUDENT STATUS FACTOR (8% weight)
  // Students have higher churn risk due to lifestyle changes
  let statusScore = 0;
  if (member.student_status === "yes" || member.student_status === "student") {
    statusScore = 40; // Students higher risk
  } else if (member.employment_status === "unemployed" || member.employment_status === "part-time") {
    statusScore = 20; // Unemployed/part-time moderate risk
  } else if (member.employment_status === "full-time" || member.employment_status === "employed") {
    statusScore = 5; // Full-time employed lower risk
  } else {
    statusScore = 15; // Unknown/default moderate risk
  }
  score += statusScore * 0.08;

  // 6. MEMBERSHIP TENURE FACTOR (7% weight)
  // New members (< 30 days) who are inactive are higher risk
  let tenureScore = 0;
  if (daysSinceJoined < 30 && daysSinceLastVisit >= 7) {
    tenureScore = 50; // New member already inactive = high risk
  } else if (daysSinceJoined < 60 && daysSinceLastVisit >= 14) {
    tenureScore = 30; // Very new member inactive = moderate-high risk
  } else if (daysSinceJoined < 90) {
    tenureScore = 15; // New member but active = moderate risk
  } else {
    tenureScore = 5; // Established member = lower risk
  }
  score += tenureScore * 0.07;

  // 7. CAMPAIGN RESPONSE FACTOR (5% weight)
  // If already received campaign but still inactive, higher risk
  if (member.has_received_campaign) {
    score += 30 * 0.05; // +1.5 points
  }

  // Ensure score is between 0 and 100
  score = Math.max(0, Math.min(100, Math.round(score)));

  // Map to level with more granular thresholds
  let level: ChurnRiskLevel;
  if (score >= 70) {
    level = "high";
  } else if (score >= 40) {
    level = "medium";
  } else if (score >= 15) {
    level = "low";
  } else {
    level = "none";
  }

  return { level, score };
}
