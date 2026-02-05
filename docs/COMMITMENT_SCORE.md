# Commitment Score Engine

## Overview

The Commitment Score Engine is a rule-based scoring system (NO ML) that measures member commitment through habit formation, consistency, and engagement patterns.

**Score Range: 0-100**
- **0-30**: Low commitment (habit not formed, high risk of drop-off)
- **31-60**: Moderate commitment (habit forming, needs reinforcement)
- **61-80**: Good commitment (habit established, consistent)
- **81-100**: High commitment (strong habit, highly engaged)

## Key Metrics

### 1. Attendance Decay (35% weight)
**What it measures:** How attendance frequency is declining over time.

**Calculation:**
- Compares recent attendance (last 30 days) vs previous period (30-60 days ago)
- For new members (<60 days), compares first half vs second half of membership
- Score: 100 if maintaining/improving, scales down with decay

**Example:**
- Member had 8 visits 30-60 days ago, 4 visits in last 30 days
- Decay ratio: 4/8 = 0.5
- Score: 50 (50% decline)

### 2. Missed Sessions (25% weight)
**What it measures:** Expected vs actual visits (consistency).

**Calculation:**
- Compares actual visits in last 30 days vs expected visits
- Expected visits based on membership type or historical average
- Penalizes if no recent visits (>14 days)

**Example:**
- Expected: 2 visits/week = 8.6 visits/30 days
- Actual: 4 visits in last 30 days
- Compliance: 4/8.6 = 0.465
- Score: 46.5

### 3. Time Gaps (25% weight)
**What it measures:** Gaps between visits (habit disruption).

**Calculation:**
- Analyzes gaps between consecutive visits
- Penalizes for large gaps (>21 days) and inconsistent patterns
- Ideal: 2-4 days between visits (3x/week)

**Example:**
- Average gap: 5 days (good)
- Max gap: 25 days (bad)
- Score: 60 (moderate) - penalized for max gap

### 4. Engagement Decline Velocity (15% weight)
**What it measures:** Rate of decline in engagement over time.

**Calculation:**
- Compares visits across time periods (30-day windows)
- Calculates velocity: positive = improving, negative = declining
- Score: 50 (neutral) + (velocity × 10)

**Example:**
- Period 1 (last 30 days): 4 visits
- Period 2 (30-60 days ago): 8 visits
- Velocity: 4 - 8 = -4 visits per period = -0.93 visits/week
- Score: 50 + (-0.93 × 10) = 40.7

## Input Data Structure

```typescript
interface MemberCommitmentData {
  joinedDate: string;                    // ISO date string
  lastVisitDate: string | null;          // Most recent visit (ISO date)
  visitDates: string[];                  // Array of all visit dates (ISO)
  expectedVisitsPerWeek?: number;       // Optional: expected frequency
  daysSinceJoined?: number;              // Optional: calculated if not provided
}
```

## Output Structure

```typescript
interface CommitmentScoreResult {
  score: number;                         // Overall score (0-100)
  habitDecayVelocity: number;           // Visits/week change (negative = declining)
  riskFlags: {
    noRecentVisits: boolean;            // No visits in last 14 days
    rapidDecline: boolean;              // >50% drop in last 30 days
    largeGap: boolean;                  // Gap >21 days
    inconsistentPattern: boolean;        // High variance in gaps
    newMemberLowAttendance: boolean;     // <30 days old, <2 visits
    decliningFrequency: boolean;         // Velocity < -0.5 visits/week
  };
  factorScores: {
    attendanceDecay: number;             // Individual factor scores
    missedSessions: number;
    timeGaps: number;
    declineVelocity: number;
  };
}
```

## Usage Examples

### Example 1: Highly Committed Member

```typescript
import { calculateCommitmentScore } from '@/lib/commitment-score';

const data: MemberCommitmentData = {
  joinedDate: "2025-01-01",
  lastVisitDate: "2026-01-28",
  visitDates: [
    "2026-01-28", "2026-01-25", "2026-01-22", "2026-01-19",
    "2026-01-16", "2026-01-13", "2026-01-10", "2026-01-07",
    "2026-01-04", "2026-01-01"
  ],
  expectedVisitsPerWeek: 3,
};

const result = calculateCommitmentScore(data);
// Result:
// {
//   score: 85,
//   habitDecayVelocity: 0.2,
//   riskFlags: { ... all false ... },
//   factorScores: { attendanceDecay: 95, missedSessions: 90, ... }
// }
```

### Example 2: Declining Member

```typescript
const data: MemberCommitmentData = {
  joinedDate: "2025-11-01",
  lastVisitDate: "2026-01-15", // 13 days ago
  visitDates: [
    "2026-01-15", "2026-01-08", "2026-01-01", "2025-12-25",
    // ... declining frequency ...
  ],
  expectedVisitsPerWeek: 2,
};

const result = calculateCommitmentScore(data);
// Result:
// {
//   score: 35,
//   habitDecayVelocity: -1.2,  // Declining by 1.2 visits/week
//   riskFlags: {
//     rapidDecline: true,
//     decliningFrequency: true,
//     ...
//   }
// }
```

### Example 3: Never Visited

```typescript
const data: MemberCommitmentData = {
  joinedDate: "2026-01-01",
  lastVisitDate: null,
  visitDates: [],
  expectedVisitsPerWeek: 2,
};

const result = calculateCommitmentScore(data);
// Result:
// {
//   score: 0,
//   habitDecayVelocity: 0,
//   riskFlags: {
//     noRecentVisits: true,
//     newMemberLowAttendance: true,
//     ...
//   }
// }
```

## Configurable Weights

You can customize the weights for different factors:

```typescript
import { calculateCommitmentScore, DEFAULT_WEIGHTS } from '@/lib/commitment-score';

// Use default weights
const result1 = calculateCommitmentScore(data);

// Custom weights (must sum to 1.0)
const customWeights = {
  attendanceDecay: 0.40,    // Increase importance
  missedSessions: 0.30,
  timeGaps: 0.20,
  declineVelocity: 0.10,
};

const result2 = calculateCommitmentScore(data, customWeights);
```

**Default Weights:**
- Attendance Decay: 35%
- Missed Sessions: 25%
- Time Gaps: 25%
- Engagement Decline Velocity: 15%

## Integration with Existing System

The commitment score complements the existing churn risk score:

- **Churn Risk**: Predicts likelihood of cancellation (external factors: distance, age, etc.)
- **Commitment Score**: Measures habit formation and consistency (internal factors: attendance patterns)

**Use Cases:**
1. **High Churn Risk + Low Commitment**: Immediate intervention needed
2. **High Churn Risk + High Commitment**: External factors (distance, life changes) - different intervention
3. **Low Churn Risk + Low Commitment**: Habit not formed yet - early intervention
4. **Low Churn Risk + High Commitment**: Ideal member - maintain engagement

## Risk Flags Explained

### `noRecentVisits`
- **Trigger**: No visits in last 14 days
- **Action**: Send re-engagement campaign

### `rapidDecline`
- **Trigger**: >50% drop in visits (last 30 days vs previous 30)
- **Action**: Investigate reason, personalized outreach

### `largeGap`
- **Trigger**: Gap >21 days between visits
- **Action**: Check-in call, offer support

### `inconsistentPattern`
- **Trigger**: High variance in gaps between visits
- **Action**: Help establish routine, suggest consistent schedule

### `newMemberLowAttendance`
- **Trigger**: <30 days old, <2 visits
- **Action**: Onboarding support, first-visit incentives

### `decliningFrequency`
- **Trigger**: Velocity < -0.5 visits/week
- **Action**: Early intervention before habit breaks

## Performance Considerations

- **Time Complexity**: O(n) where n = number of visits
- **Memory**: O(n) for storing visit dates
- **Recommended**: Calculate daily via background job, cache results

## Testing

See `lib/commitment-score.examples.ts` for example scenarios and expected outputs.

Run examples:
```typescript
import { runExamples } from '@/lib/commitment-score.examples';
runExamples();
```

## Future Enhancements

Potential additions (not in MVP):
- [ ] Seasonal adjustments (holidays, summer, etc.)
- [ ] Membership type normalization
- [ ] Class booking vs gym visit differentiation
- [ ] Social engagement factors (group classes, trainer sessions)
- [ ] Goal-based scoring (weight loss, strength, etc.)
