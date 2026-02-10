/**
 * Commitment score: 0–100 measure of how "locked in" a member is (habit strength, recency, consistency).
 * Used for member profile and recommended actions.
 */

import { differenceInDays, parseISO, subDays } from "date-fns";

export interface CommitmentScoreParams {
  joinedDate: string;
  lastVisitDate: string | null;
  visitDates: string[];
  expectedVisitsPerWeek: number;
}

export interface CommitmentScoreResult {
  score: number;
  habitDecayVelocity: number;
  riskFlags: {
    noRecentVisits: boolean;
    largeGap: boolean;
    newMemberLowAttendance: boolean;
  };
  factorScores: {
    attendanceDecay: number;
    declineVelocity: number;
  };
}

function parseSafe(dateStr: string | null): Date | null {
  if (!dateStr) return null;
  try {
    const d = parseISO(dateStr);
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

/**
 * Compute commitment score and factors as of a given "today" (for timeline).
 */
function computeScore(
  joinedDate: string,
  lastVisitDate: string | null,
  visitDatesUpToToday: string[],
  expectedVisitsPerWeek: number,
  asOfDate: Date
): { score: number; attendanceDecay: number; declineVelocity: number } {
  const joined = parseSafe(joinedDate);
  const lastVisit = parseSafe(lastVisitDate);
  const daysSinceJoined = joined ? differenceInDays(asOfDate, joined) : 999;
  const daysSinceLastVisit = lastVisit ? differenceInDays(asOfDate, lastVisit) : 999;

  const sortedVisits = [...visitDatesUpToToday]
    .map((d) => parseSafe(d))
    .filter((d): d is Date => d != null && !Number.isNaN(d.getTime()))
    .filter((d) => d <= asOfDate)
    .sort((a, b) => b.getTime() - a.getTime());

  const visitsLast14 = sortedVisits.filter((d) => differenceInDays(asOfDate, d) <= 14).length;
  const visitsLast30 = sortedVisits.filter((d) => differenceInDays(asOfDate, d) <= 30).length;
  const expected30 = expectedVisitsPerWeek * (30 / 7);
  const consistencyRatio = expected30 > 0 ? Math.min(1.5, visitsLast30 / expected30) : 0;

  // Recency: more recent last visit = higher score (0–40 points)
  let recencyScore = 0;
  if (daysSinceLastVisit <= 3) recencyScore = 40;
  else if (daysSinceLastVisit <= 7) recencyScore = 32;
  else if (daysSinceLastVisit <= 14) recencyScore = 24;
  else if (daysSinceLastVisit <= 21) recencyScore = 16;
  else if (daysSinceLastVisit <= 30) recencyScore = 8;

  // Consistency: visits in last 30 days vs expected (0–40 points)
  const consistencyScore = Math.round(Math.min(40, consistencyRatio * 40));

  // Tenure bonus: longer membership with visits = up to 20 points
  let tenureScore = 0;
  if (daysSinceJoined >= 90 && visitsLast30 >= 2) tenureScore = 20;
  else if (daysSinceJoined >= 60 && visitsLast30 >= 1) tenureScore = 14;
  else if (daysSinceJoined >= 30) tenureScore = 8;

  const score = Math.round(Math.min(100, Math.max(0, recencyScore + consistencyScore + tenureScore)));

  // Attendance decay: 0–100, higher = more decay (fewer recent visits relative to expected)
  const attendanceDecay = expected30 > 0
    ? Math.round(Math.min(100, Math.max(0, 100 - (visitsLast30 / expected30) * 50)))
    : 50;

  // Decline velocity: approximate from gap between last two visits (0–100)
  let declineVelocity = 0;
  if (sortedVisits.length >= 2) {
    const gap = differenceInDays(sortedVisits[0], sortedVisits[1]);
    if (gap >= 21) declineVelocity = 80;
    else if (gap >= 14) declineVelocity = 55;
    else if (gap >= 7) declineVelocity = 30;
  }

  return { score, attendanceDecay, declineVelocity };
}

/**
 * Commitment score and risk flags as of today.
 */
export function calculateCommitmentScore(params: CommitmentScoreParams): CommitmentScoreResult {
  const now = new Date();
  const visitDates = params.visitDates || [];
  const { score, attendanceDecay, declineVelocity } = computeScore(
    params.joinedDate,
    params.lastVisitDate,
    visitDates,
    params.expectedVisitsPerWeek,
    now
  );

  const lastVisit = parseSafe(params.lastVisitDate);
  const joined = parseSafe(params.joinedDate);
  const daysSinceLastVisit = lastVisit ? differenceInDays(now, lastVisit) : 999;
  const daysSinceJoined = joined ? differenceInDays(now, joined) : 0;
  const sortedVisits = [...visitDates]
    .map((d) => parseSafe(d))
    .filter((d): d is Date => d != null && !Number.isNaN(d.getTime()))
    .sort((a, b) => b.getTime() - a.getTime());
  const visitsLast14 = sortedVisits.filter((d) => differenceInDays(now, d) <= 14).length;
  const gapBetweenVisits = sortedVisits.length >= 2
    ? differenceInDays(sortedVisits[0], sortedVisits[1])
    : 999;

  const noRecentVisits = daysSinceLastVisit > 14 || visitsLast14 === 0;
  const largeGap = gapBetweenVisits >= 14;
  const newMemberLowAttendance = daysSinceJoined <= 30 && sortedVisits.length < 2;

  // Habit decay velocity: compare score now vs 30 days ago (negative = declining)
  const thirtyDaysAgo = subDays(now, 30);
  const visitsUpTo30Ago = visitDates.filter((d) => d <= thirtyDaysAgo.toISOString().split("T")[0]);
  const past = computeScore(
    params.joinedDate,
    params.lastVisitDate,
    visitsUpTo30Ago,
    params.expectedVisitsPerWeek,
    thirtyDaysAgo
  );
  const habitDecayVelocity = (score - past.score) / 30;

  return {
    score,
    habitDecayVelocity: Math.round(habitDecayVelocity * 100) / 100,
    riskFlags: {
      noRecentVisits,
      largeGap,
      newMemberLowAttendance,
    },
    factorScores: {
      attendanceDecay,
      declineVelocity,
    },
  };
}

/**
 * Commitment score as of a specific date (for habit decay timeline).
 */
export function calculateCommitmentScoreAsOf(
  baseData: CommitmentScoreParams,
  dateStr: string
): { score: number } {
  const asOf = parseISO(dateStr);
  if (Number.isNaN(asOf.getTime())) return { score: 50 };
  const visitDatesUpTo = (baseData.visitDates || []).filter((d) => d <= dateStr);
  const { score } = computeScore(
    baseData.joinedDate,
    baseData.lastVisitDate,
    visitDatesUpTo,
    baseData.expectedVisitsPerWeek,
    asOf
  );
  return { score };
}
