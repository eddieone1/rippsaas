/**
 * Commitment Score Engine
 *
 * Rule-based scoring (NO ML). Factors: consistency, visit frequency, and gaps
 * between visits on a monthly/recent basis. More frequent, consistent visits =
 * higher score; as frequency/consistency fades, score declines. Time decay
 * ensures no flat line: as time passes with no visit, score progressively
 * declines (even after a single visit).
 *
 * Score Range: 0-100
 * - 0-30: Low commitment (habit not formed, high risk of drop-off)
 * - 31-60: Moderate commitment (habit forming, needs reinforcement)
 * - 61-80: Good commitment (habit established, consistent)
 * - 81-100: High commitment (strong habit, highly engaged)
 *
 * Key Metrics:
 * 1. Attendance Decay - Frequency declining over time (recent vs previous 30d)
 * 2. Missed Sessions - Expected vs actual visits (consistency)
 * 3. Time Gaps - Gaps between visits (habit disruption)
 * 4. Engagement Decline Velocity - Rate of decline
 * 5. Time Decay - Multiplier so score drops as days since last visit increase
 */

import { differenceInDays, parseISO, subDays, startOfDay } from "date-fns";

/**
 * Configuration for commitment score weights
 * Adjust these to tune the scoring algorithm
 */
export interface CommitmentScoreWeights {
  /** Weight for attendance decay factor (0-1) */
  attendanceDecay: number;
  /** Weight for missed sessions factor (0-1) */
  missedSessions: number;
  /** Weight for time gaps factor (0-1) */
  timeGaps: number;
  /** Weight for engagement decline velocity (0-1) */
  declineVelocity: number;
}

/**
 * Default weights - sum should equal 1.0 for proper scaling
 */
export const DEFAULT_WEIGHTS: CommitmentScoreWeights = {
  attendanceDecay: 0.35,    // 35% - Most important: how attendance is trending
  missedSessions: 0.25,    // 25% - Consistency matters for habit formation
  timeGaps: 0.25,          // 25% - Gaps disrupt habits
  declineVelocity: 0.15,    // 15% - Rate of decline indicates urgency
};

/**
 * Input data for commitment score calculation
 */
export interface MemberCommitmentData {
  /** Date member joined */
  joinedDate: string;
  /** Most recent visit date (null if never visited) */
  lastVisitDate: string | null;
  /** Array of visit dates (sorted, most recent first) */
  visitDates: string[];
  /** Expected visits per week (based on membership type or historical average) */
  expectedVisitsPerWeek?: number;
  /** Total days since joining */
  daysSinceJoined?: number;
  /** If set, score is computed "as of" this date (YYYY-MM-DD) for timelines; also applies time decay. */
  asOfDate?: string;
}

/**
 * Risk flags indicating specific commitment issues
 */
export interface RiskFlags {
  /** No visits in last 14 days */
  noRecentVisits: boolean;
  /** Attendance declining rapidly (>50% drop in last 30 days vs previous 30) */
  rapidDecline: boolean;
  /** Large gap between visits (>21 days) */
  largeGap: boolean;
  /** Inconsistent attendance pattern (high variance) */
  inconsistentPattern: boolean;
  /** New member (<30 days) with low attendance */
  newMemberLowAttendance: boolean;
  /** Attendance frequency declining over time */
  decliningFrequency: boolean;
}

/**
 * Commitment score result
 */
export interface CommitmentScoreResult {
  /** Overall commitment score (0-100) */
  score: number;
  /** Velocity of habit decay (negative = declining, positive = improving) */
  habitDecayVelocity: number;
  /** Risk flags indicating specific issues */
  riskFlags: RiskFlags;
  /** Breakdown of individual factor scores (for debugging/insights) */
  factorScores: {
    attendanceDecay: number;
    missedSessions: number;
    timeGaps: number;
    declineVelocity: number;
  };
}

/**
 * Calculate days since a date string (optionally relative to refDate for "as of" scoring)
 */
function getDaysSince(dateString: string | null, refDate?: Date): number | null {
  if (!dateString) return null;
  try {
    const date = parseISO(dateString);
    const ref = refDate ?? new Date();
    return differenceInDays(ref, date);
  } catch {
    return null;
  }
}

/**
 * Time decay: as days since last visit increase, commitment score decays (no flat line).
 * More frequent/recent visits = higher score; as time passes with no visit, score declines.
 * Returns multiplier in [0, 1]. Day 0-1 = 1; then ~1.5% decay per day so by ~60 days we're near 0.
 */
export function getTimeDecayMultiplier(daysSinceLastVisit: number | null): number {
  if (daysSinceLastVisit === null || daysSinceLastVisit <= 1) return 1;
  const decayPerDay = 0.018;
  const multiplier = Math.max(0, 1 - (daysSinceLastVisit - 1) * decayPerDay);
  return Math.round(multiplier * 100) / 100;
}

/**
 * Calculate attendance decay score
 * 
 * Measures how attendance frequency is declining over time.
 * Compares recent attendance (last 30 days) vs previous period (30-60 days ago).
 * 
 * Score: 0-100 (higher = better attendance, lower = more decay)
 */
function calculateAttendanceDecay(
  visitDates: string[],
  daysSinceJoined: number,
  refDate: Date = new Date()
): number {
  if (visitDates.length === 0) {
    // No visits = maximum decay
    return 0;
  }

  const now = refDate;
  const thirtyDaysAgo = subDays(now, 30);
  const sixtyDaysAgo = subDays(now, 60);

  // Count visits in recent period (last 30 days)
  const recentVisits = visitDates.filter((dateStr) => {
    const date = parseISO(dateStr);
    return date >= thirtyDaysAgo && date <= now;
  }).length;

  // Count visits in previous period (30-60 days ago)
  const previousVisits = visitDates.filter((dateStr) => {
    const date = parseISO(dateStr);
    return date >= sixtyDaysAgo && date < thirtyDaysAgo;
  }).length;

  // If member joined less than 60 days ago, use different comparison
  if (daysSinceJoined < 60) {
    // Compare first half vs second half of membership
    const midPoint = Math.floor(daysSinceJoined / 2);
    const midPointDate = subDays(now, midPoint);
    
    const firstHalfVisits = visitDates.filter((dateStr) => {
      const date = parseISO(dateStr);
      return date < midPointDate;
    }).length;
    
    const secondHalfVisits = visitDates.filter((dateStr) => {
      const date = parseISO(dateStr);
      return date >= midPointDate;
    }).length;

    if (firstHalfVisits === 0) {
      // No early visits, score based on recent visits only
      return Math.min(100, recentVisits * 10);
    }

    // Calculate decay ratio
    const decayRatio = secondHalfVisits / firstHalfVisits;
    // Score: 100 if maintaining, 0 if dropped to 0
    return Math.max(0, Math.min(100, decayRatio * 100));
  }

  // For established members, compare recent vs previous period
  if (previousVisits === 0) {
    // No previous visits to compare - score based on recent activity
    return Math.min(100, recentVisits * 15);
  }

  // Calculate decay ratio (1.0 = maintaining, 0.5 = 50% decline, 2.0 = doubling)
  const decayRatio = recentVisits / previousVisits;
  
  // Score: 100 if maintaining or improving, scales down with decay
  // If decay ratio is 1.0 (maintaining), score is 100
  // If decay ratio is 0.0 (stopped), score is 0
  // If decay ratio is 0.5 (50% decline), score is 50
  let score = decayRatio * 100;
  
  // Cap at 100 (can't exceed 100 even if improving)
  score = Math.min(100, score);
  
  // Boost score if recent visits are high (even if declining from very high)
  if (recentVisits >= 8) {
    score = Math.min(100, score + 20); // Boost for high activity
  } else if (recentVisits >= 4) {
    score = Math.min(100, score + 10); // Moderate boost
  }

  return Math.max(0, Math.round(score));
}

/**
 * Calculate missed sessions score
 * 
 * Compares expected visits vs actual visits.
 * Expected visits based on membership type or historical average.
 * 
 * Score: 0-100 (higher = meeting expectations, lower = missing sessions)
 */
function calculateMissedSessions(
  visitDates: string[],
  expectedVisitsPerWeek: number | undefined,
  daysSinceJoined: number,
  lastVisitDate: string | null,
  refDate: Date = new Date()
): number {
  if (visitDates.length === 0) {
    return 0; // No visits = maximum missed sessions
  }

  // If no expected visits specified, calculate from historical average
  let expectedPerWeek = expectedVisitsPerWeek;
  if (!expectedPerWeek || expectedPerWeek === 0) {
    // Calculate average visits per week from history
    if (visitDates.length < 2) {
      // Not enough data, assume 2 visits/week (typical gym-goer)
      expectedPerWeek = 2;
    } else {
      const firstVisit = parseISO(visitDates[visitDates.length - 1]);
      const lastVisit = parseISO(visitDates[0]);
      const totalDays = differenceInDays(lastVisit, firstVisit);
      const totalWeeks = Math.max(1, totalDays / 7);
      expectedPerWeek = visitDates.length / totalWeeks;
    }
  }

  // Calculate expected visits in last 30 days
  const expectedVisits30Days = (expectedPerWeek / 7) * 30;
  
  // Count actual visits in last 30 days (relative to refDate)
  const now = refDate;
  const thirtyDaysAgo = subDays(now, 30);
  const actualVisits30Days = visitDates.filter((dateStr) => {
    const date = parseISO(dateStr);
    return date >= thirtyDaysAgo && date <= now;
  }).length;

  // Calculate compliance ratio
  const complianceRatio = actualVisits30Days / expectedVisits30Days;
  
  // Score: 100 if meeting or exceeding expectations, scales down with misses
  let score = complianceRatio * 100;
  
  // Cap at 100 (can't exceed 100)
  score = Math.min(100, score);
  
  // Penalize if no recent visits (even if historically compliant)
  const daysSinceLastVisit = getDaysSince(lastVisitDate, refDate);
  if (daysSinceLastVisit !== null && daysSinceLastVisit > 14) {
    // No visits in last 14 days = significant penalty
    score = score * 0.5; // Halve the score
  }

  return Math.max(0, Math.round(score));
}

/**
 * Calculate time gaps score
 * 
 * Measures consistency by analyzing gaps between visits.
 * Large gaps indicate habit disruption.
 * 
 * Score: 0-100 (higher = consistent visits, lower = large gaps)
 */
function calculateTimeGaps(
  visitDates: string[],
  daysSinceJoined: number,
  lastVisitDate: string | null,
  refDate: Date = new Date()
): number {
  if (visitDates.length === 0) {
    return 0; // No visits = maximum gap
  }

  if (visitDates.length === 1) {
    // Single visit - score based on how recent (decays as time passes)
    const daysSince = getDaysSince(visitDates[0], refDate);
    if (daysSince === null) return 0;
    
    // Progressive decline: no flat line; score drops as time passes with no visit
    if (daysSince <= 1) return 55;
    if (daysSince <= 7) return Math.max(10, 55 - daysSince * 5);
    if (daysSince <= 14) return Math.max(5, 20 - (daysSince - 7) * 2);
    if (daysSince <= 21) return Math.max(2, 6 - (daysSince - 14));
    return Math.max(0, 2 - Math.floor(daysSince / 30));
  }

  // Calculate gaps between consecutive visits
  const gaps: number[] = [];
  for (let i = 0; i < visitDates.length - 1; i++) {
    const laterDate = parseISO(visitDates[i]);
    const earlierDate = parseISO(visitDates[i + 1]);
    const gap = differenceInDays(laterDate, earlierDate);
    gaps.push(gap);
  }

  // Calculate average gap
  const avgGap = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
  
  // Calculate max gap (worst case)
  const maxGap = Math.max(...gaps);

  // Score based on average gap
  // Ideal: 2-4 days between visits (3x/week)
  // Good: 4-7 days (2x/week)
  // Concerning: 7-14 days (1x/week or less)
  // Bad: >14 days (inconsistent)
  
  let score = 100;
  
  // Penalize for average gap
  if (avgGap <= 3) {
    score = 100; // Very consistent
  } else if (avgGap <= 5) {
    score = 90; // Good consistency
  } else if (avgGap <= 7) {
    score = 75; // Moderate consistency
  } else if (avgGap <= 10) {
    score = 60; // Somewhat inconsistent
  } else if (avgGap <= 14) {
    score = 40; // Inconsistent
  } else if (avgGap <= 21) {
    score = 20; // Very inconsistent
  } else {
    score = 10; // Highly inconsistent
  }

  // Additional penalty for max gap
  if (maxGap > 21) {
    score = Math.max(0, score - 30); // Large gap penalty
  } else if (maxGap > 14) {
    score = Math.max(0, score - 15); // Moderate gap penalty
  }

  // Penalize for gap since last visit
  const daysSinceLastVisit = getDaysSince(lastVisitDate, refDate);
  if (daysSinceLastVisit !== null) {
    if (daysSinceLastVisit > 21) {
      score = Math.max(0, score - 40); // Large current gap
    } else if (daysSinceLastVisit > 14) {
      score = Math.max(0, score - 25); // Moderate current gap
    } else if (daysSinceLastVisit > 7) {
      score = Math.max(0, score - 10); // Small current gap
    }
  }

  return Math.max(0, Math.round(score));
}

/**
 * Calculate engagement decline velocity
 * 
 * Measures the rate of decline in engagement over time.
 * Positive velocity = improving, negative = declining.
 * 
 * Returns: velocity score (0-100) and actual velocity value
 */
function calculateDeclineVelocity(
  visitDates: string[],
  daysSinceJoined: number
): { score: number; velocity: number } {
  if (visitDates.length < 4) {
    // Not enough data for velocity calculation
    return { score: 50, velocity: 0 }; // Neutral score
  }

  const now = new Date();
  
  // Split visits into time periods for trend analysis
  // Period 1: Most recent 30 days
  // Period 2: 30-60 days ago
  // Period 3: 60-90 days ago (if available)
  
  const period1End = now;
  const period1Start = subDays(now, 30);
  const period2End = subDays(now, 30);
  const period2Start = subDays(now, 60);
  const period3End = subDays(now, 60);
  const period3Start = subDays(now, 90);

  const period1Visits = visitDates.filter((d) => {
    const date = parseISO(d);
    return date >= period1Start && date <= period1End;
  }).length;

  const period2Visits = visitDates.filter((d) => {
    const date = parseISO(d);
    return date >= period2Start && date < period2End;
  }).length;

  const period3Visits = daysSinceJoined >= 90 
    ? visitDates.filter((d) => {
        const date = parseISO(d);
        return date >= period3Start && date < period3End;
      }).length
    : null;

  // Calculate velocity (change per period)
  // Negative = declining, positive = improving
  let velocity: number;
  
  if (period3Visits !== null && period2Visits > 0 && period3Visits > 0) {
    // Three periods available - calculate trend
    const velocity1 = period1Visits - period2Visits;
    const velocity2 = period2Visits - period3Visits;
    velocity = (velocity1 + velocity2) / 2; // Average velocity
  } else {
    // Two periods - simple comparison
    velocity = period1Visits - period2Visits;
  }

  // Convert velocity to score (0-100)
  // Velocity of 0 = maintaining (score 50)
  // Positive velocity = improving (score 50-100)
  // Negative velocity = declining (score 0-50)
  
  let score = 50; // Start at neutral
  
  if (velocity > 0) {
    // Improving: boost score
    // +1 visit per period = +10 points (up to 100)
    score = Math.min(100, 50 + (velocity * 10));
  } else if (velocity < 0) {
    // Declining: reduce score
    // -1 visit per period = -10 points (down to 0)
    score = Math.max(0, 50 + (velocity * 10));
  }

  // Normalize velocity to visits per week for easier interpretation
  // (velocity is per 30-day period, so divide by ~4.3 to get per week)
  const normalizedVelocity = velocity / 4.3;

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    velocity: Math.round(normalizedVelocity * 10) / 10, // Round to 1 decimal
  };
}

/**
 * Generate risk flags based on commitment data
 */
function generateRiskFlags(
  visitDates: string[],
  lastVisitDate: string | null,
  daysSinceJoined: number,
  attendanceDecayScore: number,
  declineVelocity: number,
  refDate: Date = new Date()
): RiskFlags {
  const daysSinceLastVisit = getDaysSince(lastVisitDate, refDate);
  const now = refDate;
  const thirtyDaysAgo = subDays(now, 30);
  const sixtyDaysAgo = subDays(now, 60);

  // Recent visits count
  const recentVisits = visitDates.filter((d) => {
    const date = parseISO(d);
    return date >= thirtyDaysAgo;
  }).length;

  const previousVisits = visitDates.filter((d) => {
    const date = parseISO(d);
    return date >= sixtyDaysAgo && date < thirtyDaysAgo;
  }).length;

  // Calculate gaps
  const gaps: number[] = [];
  for (let i = 0; i < visitDates.length - 1; i++) {
    const laterDate = parseISO(visitDates[i]);
    const earlierDate = parseISO(visitDates[i + 1]);
    const gap = differenceInDays(laterDate, earlierDate);
    gaps.push(gap);
  }
  const maxGap = gaps.length > 0 ? Math.max(...gaps) : 0;

  // Calculate variance in gaps (inconsistency measure)
  let gapVariance = 0;
  if (gaps.length > 1) {
    const avgGap = gaps.reduce((sum, g) => sum + g, 0) / gaps.length;
    const variance = gaps.reduce((sum, g) => sum + Math.pow(g - avgGap, 2), 0) / gaps.length;
    gapVariance = variance;
  }

  return {
    noRecentVisits: daysSinceLastVisit !== null && daysSinceLastVisit > 14,
    rapidDecline: previousVisits > 0 && recentVisits < previousVisits * 0.5,
    largeGap: maxGap > 21 || (daysSinceLastVisit !== null && daysSinceLastVisit > 21),
    inconsistentPattern: gapVariance > 50, // High variance in gaps
    newMemberLowAttendance: daysSinceJoined < 30 && recentVisits < 2,
    decliningFrequency: declineVelocity < -0.5, // Declining by more than 0.5 visits/week
  };
}

/**
 * Calculate commitment score for a member
 * 
 * @param data Member commitment data
 * @param weights Optional custom weights (defaults to DEFAULT_WEIGHTS)
 * @returns Commitment score result
 */
export function calculateCommitmentScore(
  data: MemberCommitmentData,
  weights: CommitmentScoreWeights = DEFAULT_WEIGHTS
): CommitmentScoreResult {
  // Validate weights sum to ~1.0 (allow small floating point errors)
  const weightSum = 
    weights.attendanceDecay +
    weights.missedSessions +
    weights.timeGaps +
    weights.declineVelocity;
  
  if (Math.abs(weightSum - 1.0) > 0.01) {
    console.warn(
      `Weights sum to ${weightSum}, not 1.0. Results may be scaled incorrectly.`
    );
  }

  const refDate = data.asOfDate ? startOfDay(parseISO(data.asOfDate)) : new Date();

  if (data.visitDates.length === 0) {
    const daysSinceJoined = getDaysSince(data.joinedDate, refDate) ?? 0;
    return {
      score: 0,
      habitDecayVelocity: 0,
      riskFlags: generateRiskFlags([], null, daysSinceJoined, 0, 0, refDate),
      factorScores: { attendanceDecay: 0, missedSessions: 0, timeGaps: 0, declineVelocity: 0 },
    };
  }

  // Calculate days since joining (relative to refDate when asOfDate is set)
  const daysSinceJoined = data.daysSinceJoined ?? getDaysSince(data.joinedDate, refDate) ?? 0;

  // Sort visit dates (most recent first)
  const sortedVisits = [...data.visitDates].sort((a, b) => {
    const dateA = parseISO(a);
    const dateB = parseISO(b);
    return dateB.getTime() - dateA.getTime();
  });

  // Calculate individual factor scores (consistency, frequency, gaps on a monthly/recent basis)
  const attendanceDecayScore = calculateAttendanceDecay(sortedVisits, daysSinceJoined, refDate);
  const missedSessionsScore = calculateMissedSessions(
    sortedVisits,
    data.expectedVisitsPerWeek,
    daysSinceJoined,
    data.lastVisitDate,
    refDate
  );
  const timeGapsScore = calculateTimeGaps(
    sortedVisits,
    daysSinceJoined,
    data.lastVisitDate,
    refDate
  );
  const { score: declineVelocityScore, velocity: declineVelocity } = calculateDeclineVelocity(
    sortedVisits,
    daysSinceJoined
  );

  // Weighted base score (frequency, consistency, gaps, decline velocity)
  const rawScore =
    attendanceDecayScore * weights.attendanceDecay +
    missedSessionsScore * weights.missedSessions +
    timeGapsScore * weights.timeGaps +
    declineVelocityScore * weights.declineVelocity;

  // Time decay: as days since last visit increase, score progressively declines (no flat line)
  const daysSinceLastVisit = getDaysSince(data.lastVisitDate, refDate);
  const decayMultiplier = getTimeDecayMultiplier(daysSinceLastVisit);
  const commitmentScore = rawScore * decayMultiplier;

  // Generate risk flags
  const riskFlags = generateRiskFlags(
    sortedVisits,
    data.lastVisitDate,
    daysSinceJoined,
    attendanceDecayScore,
    declineVelocity,
    refDate
  );

  return {
    score: Math.max(0, Math.min(100, Math.round(commitmentScore))),
    habitDecayVelocity: declineVelocity,
    riskFlags,
    factorScores: {
      attendanceDecay: attendanceDecayScore,
      missedSessions: missedSessionsScore,
      timeGaps: timeGapsScore,
      declineVelocity: declineVelocityScore,
    },
  };
}

/**
 * Compute commitment score as of a specific date (for habit decay timeline).
 * Uses only visits on or before asOfDate; score decays as time passes with no visit.
 */
export function calculateCommitmentScoreAsOf(
  data: MemberCommitmentData,
  asOfDateStr: string,
  weights: CommitmentScoreWeights = DEFAULT_WEIGHTS
): CommitmentScoreResult {
  const ref = startOfDay(parseISO(asOfDateStr));
  const visitsUpTo = data.visitDates.filter((d) => d <= asOfDateStr);
  const lastUpTo = visitsUpTo.length > 0 ? visitsUpTo.sort((a, b) => b.localeCompare(a))[0] : null;
  return calculateCommitmentScore(
    {
      ...data,
      visitDates: visitsUpTo,
      lastVisitDate: lastUpTo,
      asOfDate: asOfDateStr,
    },
    weights
  );
}
