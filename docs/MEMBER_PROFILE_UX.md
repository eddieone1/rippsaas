# Member Profile Page - UX Design Decisions

## Overview

The Member Profile page is **where retention happens**. This is the action center where coaches and owners make decisions about individual members.

## Core Principle

**"What's wrong, why, and what should I do right now?"**

Every element on the page answers this question and drives action.

## Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│                    Header                                │
│         Member Name + Risk Badge                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│         Recommended Next Action (Prominent)             │
│         [High Priority Action Card]                      │
└─────────────────────────────────────────────────────────┘

┌──────────────────────────────┬──────────────────────────┐
│                              │                          │
│   Left Column (1/3)          │  Right Column (2/3)     │
│                              │                          │
│   - Commitment Score Gauge   │  - Habit Decay Timeline │
│   - Risk Flags               │  - Engagement History   │
│   - Coach Assignment          │                          │
│   - Member Info               │                          │
└──────────────────────────────┴──────────────────────────┘
```

## Component Breakdown

### 1. Recommended Next Action (Prominent)

**Purpose:** Immediate clarity on what to do

**UX Decisions:**
- ✅ **Top of page** - First thing user sees
- ✅ **Color-coded** - Red (high), Yellow (medium), Blue (low)
- ✅ **Actionable** - Direct link to send campaign if suggested
- ✅ **Reason provided** - Explains why this action

**Why prominent?**
- Reduces decision fatigue
- Ensures action is taken
- Prevents analysis paralysis

### 2. Commitment Score Gauge

**Purpose:** Visual indicator of habit formation

**UX Decisions:**
- ✅ **Large, circular gauge** - Easy to read at a glance
- ✅ **Color-coded** - Green (high), Blue (good), Yellow (moderate), Red (low)
- ✅ **Score + label** - Both number and quality indicator
- ✅ **Velocity shown** - Trend direction (improving/declining)

**Why gauge instead of number?**
- Visual impact
- Quick comprehension
- Memorable

### 3. Habit Decay Timeline

**Purpose:** Show trend over time

**UX Decisions:**
- ✅ **Line chart** - Clear trend visualization
- ✅ **Last 30 days** - Recent enough to be actionable
- ✅ **Trend indicator** - "Improving", "Declining", or "Stable"
- ✅ **2/3 width** - Prominent but not dominant

**Why 30 days?**
- Shows recent patterns
- Not too much noise
- Actionable timeframe

### 4. Risk Flags

**Purpose:** Specific issues to address

**UX Decisions:**
- ✅ **Visual cards** - Each flag is a card
- ✅ **Icons** - Quick visual recognition
- ✅ **Descriptions** - Explains what each flag means
- ✅ **Empty state** - Shows when no flags (positive reinforcement)

**Why flags?**
- Breaks down complex score into specific issues
- Actionable (each flag suggests a solution)
- Easy to prioritize

### 5. Engagement History

**Purpose:** Chronological story of member engagement

**UX Decisions:**
- ✅ **Timeline view** - Chronological order
- ✅ **Event types** - Visits vs campaigns clearly marked
- ✅ **Re-engagement indicators** - Shows what worked
- ✅ **Last 20 events** - Manageable amount

**Why timeline?**
- Shows cause and effect
- Helps understand member journey
- Identifies what interventions worked

### 6. Coach Assignment

**Purpose:** One-click accountability

**UX Decisions:**
- ✅ **Current coach shown** - Clear who's responsible
- ✅ **One-click assignment** - Fast, no forms
- ✅ **Available coaches list** - Easy selection
- ✅ **Assignment history** - Shows past assignments

**Why one-click?**
- Reduces friction
- Encourages assignment
- Fast workflow

## Visual Hierarchy

### Primary (Above the fold)
1. Recommended action
2. Commitment score gauge
3. Risk flags

### Secondary (Below the fold)
1. Habit decay timeline
2. Engagement history
3. Coach assignment
4. Member info

**Why this order?**
- Action first (recommended action)
- Context second (score, flags)
- History third (timeline, engagement)
- Details last (info, assignment)

## Information Density

### Left Column (Metrics)
- **4-5 cards** - Not overwhelming
- **Key metrics only** - Essential information
- **Scannable** - Quick to read

### Right Column (History)
- **2 main sections** - Timeline + History
- **Visual charts** - Easy to understand
- **Chronological** - Tells a story

## Color Coding System

### Commitment Score
- **Green (80-100)** - High commitment
- **Blue (60-79)** - Good commitment
- **Yellow (40-59)** - Moderate commitment
- **Red (0-39)** - Low commitment

### Risk Flags
- **Yellow background** - Warning indicators
- **Red border** - Urgent issues

### Recommended Action
- **Red** - High priority
- **Yellow** - Medium priority
- **Blue** - Low priority

## Action Flow

### Typical User Journey

1. **User opens profile**
   - Sees recommended action immediately
   - Understands urgency (color coding)

2. **User reviews commitment score**
   - Sees overall health
   - Checks velocity (improving/declining)

3. **User checks risk flags**
   - Identifies specific issues
   - Understands what's wrong

4. **User reviews timeline**
   - Sees trend over time
   - Validates concerns

5. **User takes action**
   - Clicks recommended action
   - OR assigns coach
   - OR sends campaign

**Total time to action: <60 seconds**

## Empty States

### No Engagement History
- Helpful message
- Guidance on what to do
- Not scary

### No Risk Flags
- Positive reinforcement
- Celebration message
- Shows success

## Performance Considerations

### API Optimization
- Single endpoint for all data
- Batch queries
- Efficient data fetching

### Client-Side
- Client components for interactivity
- Server components for data fetching
- Minimal re-renders

## Responsive Design

### Desktop (>1024px)
- 1/3 + 2/3 layout
- All information visible
- Side-by-side comparison

### Tablet (768-1024px)
- Stacked layout
- Full-width components
- Still readable

### Mobile (<768px)
- Single column
- Stacked everything
- Prioritized information

## Accessibility

- ✅ Semantic HTML
- ✅ ARIA labels
- ✅ Keyboard navigation
- ✅ Color contrast (WCAG AA)
- ✅ Screen reader friendly

## Key UX Principles Applied

1. **Action over analysis** - Recommended action first
2. **Visual over text** - Gauge, charts, flags
3. **Context over data** - Why, not just what
4. **Speed over perfection** - Fast loading, essential info
5. **Clarity over cleverness** - Simple, obvious design

## Comparison to Alternatives

### Why not a traditional member detail page?
- ❌ Too much data = analysis paralysis
- ❌ No clear actions = wasted time
- ❌ No context = can't prioritize

### Why not just a list of metrics?
- ❌ No story = can't understand journey
- ❌ No actions = reactive not proactive
- ❌ No recommendations = decision fatigue

### Why this design?
- ✅ Answers "what's wrong?" immediately
- ✅ Shows "what to do?" clearly
- ✅ Tracks "is it working?" over time
- ✅ Balances detail with action

## Success Metrics

Page is successful if:
- ✅ User knows what to do within 60 seconds
- ✅ User takes action (assigns coach, sends campaign)
- ✅ User understands member's situation
- ✅ User feels confident in decision

## See Also

- Page Component: `app/(protected)/members/[id]/page.tsx`
- Profile Component: `components/members/MemberProfile.tsx`
- API Endpoint: `app/api/members/[id]/profile/route.ts`
