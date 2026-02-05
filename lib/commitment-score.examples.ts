/**
 * Commitment Score Engine - Examples
 * 
 * This file demonstrates how to use the commitment score engine
 * with various member scenarios.
 */

import {
  calculateCommitmentScore,
  type MemberCommitmentData,
  DEFAULT_WEIGHTS,
} from "./commitment-score";

/**
 * Example 1: Highly Committed Member
 * 
 * Member visits 3x/week consistently, no gaps, improving attendance
 */
export const example1_HighlyCommitted: MemberCommitmentData = {
  joinedDate: "2025-01-01",
  lastVisitDate: "2026-01-28", // Visited yesterday
  visitDates: [
    "2026-01-28", // Yesterday
    "2026-01-25", // 3 days ago
    "2026-01-22", // 6 days ago
    "2026-01-19", // 9 days ago
    "2026-01-16", // 12 days ago
    "2026-01-13", // 15 days ago
    "2026-01-10", // 18 days ago
    "2026-01-07", // 21 days ago
    "2026-01-04", // 24 days ago
    "2026-01-01", // 27 days ago
  ],
  expectedVisitsPerWeek: 3,
};

/**
 * Example 2: Declining Member
 * 
 * Member started strong but attendance is dropping rapidly
 */
export const example2_Declining: MemberCommitmentData = {
  joinedDate: "2025-11-01",
  lastVisitDate: "2026-01-15", // 13 days ago
  visitDates: [
    "2026-01-15", // 13 days ago
    "2026-01-08", // 20 days ago
    "2026-01-01", // 27 days ago
    "2025-12-25", // 35 days ago
    "2025-12-18", // 42 days ago
    "2025-12-11", // 49 days ago
    "2025-12-04", // 56 days ago
    "2025-11-27", // 63 days ago
    "2025-11-20", // 70 days ago
    "2025-11-13", // 77 days ago
    "2025-11-06", // 84 days ago
    "2025-11-01", // 89 days ago
  ],
  expectedVisitsPerWeek: 2,
};

/**
 * Example 3: Inconsistent Member
 * 
 * Member has large gaps between visits, inconsistent pattern
 */
export const example3_Inconsistent: MemberCommitmentData = {
  joinedDate: "2025-06-01",
  lastVisitDate: "2026-01-20", // 8 days ago
  visitDates: [
    "2026-01-20", // 8 days ago
    "2026-01-05", // 23 days ago (large gap)
    "2025-12-15", // 45 days ago (large gap)
    "2025-12-10", // 50 days ago
    "2025-11-25", // 65 days ago (large gap)
    "2025-11-20", // 70 days ago
    "2025-11-15", // 75 days ago
    "2025-10-01", // 120 days ago (very large gap)
    "2025-09-15", // 136 days ago
    "2025-08-20", // 162 days ago
  ],
  expectedVisitsPerWeek: 2,
};

/**
 * Example 4: New Member Low Attendance
 * 
 * Member joined recently but hasn't established habit yet
 */
export const example4_NewMemberLowAttendance: MemberCommitmentData = {
  joinedDate: "2026-01-15", // 14 days ago
  lastVisitDate: "2026-01-20", // 8 days ago
  visitDates: [
    "2026-01-20", // 8 days ago
    "2026-01-15", // 13 days ago (joined date)
  ],
  expectedVisitsPerWeek: 2,
};

/**
 * Example 5: Never Visited
 * 
 * Member signed up but never actually visited
 */
export const example5_NeverVisited: MemberCommitmentData = {
  joinedDate: "2026-01-01",
  lastVisitDate: null,
  visitDates: [],
  expectedVisitsPerWeek: 2,
};

/**
 * Example 6: Recovering Member
 * 
 * Member had a gap but is now returning consistently
 */
export const example6_Recovering: MemberCommitmentData = {
  joinedDate: "2025-08-01",
  lastVisitDate: "2026-01-28", // Yesterday
  visitDates: [
    "2026-01-28", // Yesterday
    "2026-01-25", // 3 days ago
    "2026-01-22", // 6 days ago
    "2026-01-19", // 9 days ago
    "2025-12-01", // 58 days ago (large gap, but recovering)
    "2025-11-25", // 64 days ago
    "2025-11-20", // 69 days ago
    "2025-11-15", // 74 days ago
  ],
  expectedVisitsPerWeek: 2,
};

/**
 * Run examples and log results
 */
export function runExamples() {
  console.log("=== Commitment Score Engine Examples ===\n");

  const examples = [
    { name: "Highly Committed", data: example1_HighlyCommitted },
    { name: "Declining", data: example2_Declining },
    { name: "Inconsistent", data: example3_Inconsistent },
    { name: "New Member Low Attendance", data: example4_NewMemberLowAttendance },
    { name: "Never Visited", data: example5_NeverVisited },
    { name: "Recovering", data: example6_Recovering },
  ];

  examples.forEach((example) => {
    const result = calculateCommitmentScore(example.data);
    
    console.log(`\n${example.name}:`);
    console.log(`  Score: ${result.score}/100`);
    console.log(`  Habit Decay Velocity: ${result.habitDecayVelocity} visits/week`);
    console.log(`  Risk Flags:`);
    console.log(`    - No Recent Visits: ${result.riskFlags.noRecentVisits}`);
    console.log(`    - Rapid Decline: ${result.riskFlags.rapidDecline}`);
    console.log(`    - Large Gap: ${result.riskFlags.largeGap}`);
    console.log(`    - Inconsistent Pattern: ${result.riskFlags.inconsistentPattern}`);
    console.log(`    - New Member Low Attendance: ${result.riskFlags.newMemberLowAttendance}`);
    console.log(`    - Declining Frequency: ${result.riskFlags.decliningFrequency}`);
    console.log(`  Factor Scores:`);
    console.log(`    - Attendance Decay: ${result.factorScores.attendanceDecay}`);
    console.log(`    - Missed Sessions: ${result.factorScores.missedSessions}`);
    console.log(`    - Time Gaps: ${result.factorScores.timeGaps}`);
    console.log(`    - Decline Velocity: ${result.factorScores.declineVelocity}`);
  });
}

// Uncomment to run examples:
// runExamples();
