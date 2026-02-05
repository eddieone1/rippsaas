# Commitment Score Engine - Quick Reference

## Quick Start

```typescript
import { calculateCommitmentScore } from '@/lib/commitment-score';

const result = calculateCommitmentScore({
  joinedDate: "2025-01-01",
  lastVisitDate: "2026-01-28",
  visitDates: ["2026-01-28", "2026-01-25", "2026-01-22", ...],
  expectedVisitsPerWeek: 3,
});

console.log(result.score); // 0-100
console.log(result.habitDecayVelocity); // visits/week change
console.log(result.riskFlags); // Object with boolean flags
```

## Score Interpretation

| Score | Meaning | Action |
|-------|---------|--------|
| 81-100 | High commitment | Maintain engagement, celebrate milestones |
| 61-80 | Good commitment | Monitor, reinforce habits |
| 31-60 | Moderate commitment | Early intervention, support habit formation |
| 0-30 | Low commitment | Urgent intervention, re-engagement campaigns |

## Risk Flags Quick Guide

| Flag | Meaning | Typical Action |
|------|---------|----------------|
| `noRecentVisits` | No visits in 14+ days | Send re-engagement email |
| `rapidDecline` | >50% drop in attendance | Investigate, personalized outreach |
| `largeGap` | Gap >21 days between visits | Check-in call, offer support |
| `inconsistentPattern` | High variance in visit gaps | Help establish routine |
| `newMemberLowAttendance` | <30 days old, <2 visits | Onboarding support |
| `decliningFrequency` | Velocity < -0.5 visits/week | Early intervention |

## Factor Weights (Default)

- **Attendance Decay**: 35% - How attendance is trending
- **Missed Sessions**: 25% - Expected vs actual consistency
- **Time Gaps**: 25% - Consistency between visits
- **Decline Velocity**: 15% - Rate of change

## Common Patterns

### Pattern 1: Highly Committed
```typescript
// Visits 3x/week consistently
score: 85-95
habitDecayVelocity: 0 to +0.5
riskFlags: all false
```

### Pattern 2: Declining
```typescript
// Started strong, now dropping
score: 30-50
habitDecayVelocity: -1.0 to -2.0
riskFlags: { rapidDecline: true, decliningFrequency: true }
```

### Pattern 3: Inconsistent
```typescript
// Large gaps, irregular pattern
score: 20-40
habitDecayVelocity: -0.5 to 0
riskFlags: { largeGap: true, inconsistentPattern: true }
```

### Pattern 4: Never Visited
```typescript
// Signed up but never came
score: 0
habitDecayVelocity: 0
riskFlags: { noRecentVisits: true, newMemberLowAttendance: true }
```

## Integration Example

```typescript
// In API route or component
import { calculateCommitmentScore } from '@/lib/commitment-score';
import { createClient } from '@/lib/supabase/server';

export async function getMemberCommitmentScore(memberId: string) {
  const supabase = await createClient();
  
  // Fetch member data
  const { data: member } = await supabase
    .from('members')
    .select('joined_date, last_visit_date')
    .eq('id', memberId)
    .single();
  
  // Fetch visit history
  const { data: activities } = await supabase
    .from('member_activities')
    .select('activity_date')
    .eq('member_id', memberId)
    .eq('activity_type', 'visit')
    .order('activity_date', { ascending: false });
  
  // Calculate commitment score
  const result = calculateCommitmentScore({
    joinedDate: member.joined_date,
    lastVisitDate: member.last_visit_date,
    visitDates: activities.map(a => a.activity_date),
    expectedVisitsPerWeek: 2, // Or from membership type
  });
  
  return result;
}
```

## Custom Weights Example

```typescript
// Emphasize attendance decay more
const customWeights = {
  attendanceDecay: 0.50,    // 50% weight
  missedSessions: 0.25,
  timeGaps: 0.15,
  declineVelocity: 0.10,
};

const result = calculateCommitmentScore(data, customWeights);
```

## See Also

- Full documentation: `docs/COMMITMENT_SCORE.md`
- Examples: `lib/commitment-score.examples.ts`
- Implementation: `lib/commitment-score.ts`
