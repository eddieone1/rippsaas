# Dashboard UX Design Decisions

## Overview

The main dashboard is designed for **instant clarity** - owners should understand their retention situation at a glance and know exactly what actions to take.

## Core Principle

**"Who is at risk, why, and what should we do today?"**

Every element on the dashboard answers this question directly.

## Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│                    Header                                │
│              "Dashboard" + Gym Name                      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              Key Metrics (4 Cards)                       │
│  [At-Risk] [Commitment] [Revenue Risk] [Revenue Saved] │
└─────────────────────────────────────────────────────────┘

┌──────────────────────────────┬──────────────────────────┐
│                              │                          │
│   Habit Decay Trend Chart    │  Who Needs Attention     │
│   (2/3 width)                │  Today (1/3 width)      │
│                              │                          │
│   - Last 14 days             │  - Top 10 urgent        │
│   - Visual trend              │  - Ranked by urgency    │
│                              │  - Direct actions       │
└──────────────────────────────┴──────────────────────────┘
```

## Component Breakdown

### 1. Key Metrics Cards

**Purpose:** Instant overview of critical numbers

**Metrics:**
- **At-Risk Count** - How many members need attention
- **Avg Commitment Score** - Overall member engagement health
- **Revenue at Risk** - Financial impact of at-risk members
- **Revenue Saved** - Success from retention efforts

**UX Decisions:**
- ✅ **4 cards max** - Not overwhelming, easy to scan
- ✅ **Color coding** - Visual indicators (red/yellow/green)
- ✅ **Large numbers** - Easy to read at a glance
- ✅ **Contextual subtitles** - Explain what the number means
- ✅ **Icons** - Quick visual recognition

**Why not more metrics?**
- More cards = cognitive overload
- These 4 cover the essential questions
- Other metrics can live in detailed views

### 2. Habit Decay Trend Chart

**Purpose:** Show if overall engagement is improving or declining

**UX Decisions:**
- ✅ **Line chart** - Clear trend visualization
- ✅ **14-day view** - Recent enough to be actionable, long enough to show trends
- ✅ **Reference line** - Shows average for context
- ✅ **Simple design** - No clutter, just the trend
- ✅ **2/3 width** - Prominent but not dominant

**Why 14 days?**
- 30 days = too much noise
- 7 days = too short to see trends
- 14 days = sweet spot for actionable insights

**Why line chart?**
- Shows trend direction clearly
- Easy to spot improvements/declines
- Familiar pattern for users

### 3. "Who Needs Attention Today" List

**Purpose:** Immediate action items - who to contact right now

**UX Decisions:**
- ✅ **Top 10 only** - Focused, actionable list
- ✅ **Ranked by urgency** - Most urgent first
- ✅ **Visual hierarchy** - Risk badges, revenue shown
- ✅ **Direct links** - One click to member detail
- ✅ **1/3 width** - Compact but readable
- ✅ **Rank numbers** - Clear priority order

**Why top 10?**
- More than 10 = overwhelming
- Less than 10 = might miss urgent cases
- 10 = manageable action list for one day

**Why ranked by risk score + days inactive?**
- Risk score = likelihood to churn
- Days inactive = urgency
- Combined = most urgent first

**Why show monthly revenue?**
- Helps prioritize high-value members
- Shows financial impact of each member
- Quick ROI calculation

## Color Coding System

### Risk Levels
- **Red** - High risk (urgent action needed)
- **Yellow** - Medium risk (monitor closely)
- **Green** - Low risk / Success (good news)

### Metric Cards
- **Default** - Normal state (gray border)
- **Warning** - Needs attention (yellow border/background)
- **Danger** - Critical (red border/background)
- **Success** - Positive (green border/background)

## Information Hierarchy

### Primary (Above the fold)
1. At-risk member count
2. Revenue at risk
3. Who needs attention today

### Secondary (Below the fold)
1. Average commitment score
2. Revenue saved
3. Habit decay trend

**Why this order?**
- Owners care most about: "What's wrong?" and "What do I do?"
- Financial impact is critical
- Trends are important but less urgent

## Empty States

### No At-Risk Members
- ✅ Celebration message ("All clear!")
- ✅ Positive reinforcement
- ✅ No negative messaging

### No Data
- ✅ Helpful message
- ✅ Guidance on what to do next
- ✅ Not scary or confusing

## Loading States

- ✅ Skeleton screens (not spinners)
- ✅ Shows structure while loading
- ✅ Reduces perceived wait time

## Responsive Design

### Desktop (>1024px)
- 4-column metric grid
- 2/3 + 1/3 layout for chart/list
- Full information visible

### Tablet (768-1024px)
- 2-column metric grid
- Stacked chart/list
- Still readable

### Mobile (<768px)
- 1-column metric grid
- Stacked everything
- Prioritized information

## Performance Considerations

### API Optimization
- ✅ Single endpoint for all metrics
- ✅ Batch database queries
- ✅ Cached calculations where possible
- ✅ Simplified trend calculation (uses current avg)

### Client-Side
- ✅ Client components for interactivity
- ✅ Server components for data fetching
- ✅ Minimal re-renders
- ✅ Efficient chart rendering

## Accessibility

- ✅ Semantic HTML
- ✅ ARIA labels where needed
- ✅ Keyboard navigation
- ✅ Color contrast (WCAG AA)
- ✅ Screen reader friendly

## Future Enhancements (Not in MVP)

Potential additions:
- [ ] Date range selector for trends
- [ ] Export dashboard data
- [ ] Customizable metrics
- [ ] Drill-down interactions
- [ ] Real-time updates
- [ ] Comparison periods (vs last month)

## Key UX Principles Applied

1. **Clarity over cleverness** - Simple, obvious design
2. **Action over analysis** - Focus on what to do, not just data
3. **Speed over perfection** - Fast loading, essential info only
4. **ROI over features** - Only show what drives retention actions

## Comparison to Alternatives

### Why not a traditional analytics dashboard?
- ❌ Too much data = analysis paralysis
- ❌ Charts without context = confusion
- ❌ No clear actions = wasted time

### Why not just a list of members?
- ❌ No context = can't prioritize
- ❌ No trends = reactive not proactive
- ❌ No metrics = can't measure success

### Why this design?
- ✅ Answers "what's wrong?" immediately
- ✅ Shows "what to do?" clearly
- ✅ Tracks "is it working?" over time
- ✅ Balances detail with simplicity

## User Flow

1. **Owner opens dashboard**
   - Sees at-risk count immediately
   - Sees revenue impact
   - Knows urgency level

2. **Owner scans "Who Needs Attention"**
   - Sees top 10 urgent members
   - Clicks member → goes to detail page
   - Takes action (sends campaign, calls, etc.)

3. **Owner checks trend**
   - Sees if overall engagement improving
   - Validates retention efforts
   - Adjusts strategy if needed

**Total time to action: <30 seconds**

## Success Metrics

Dashboard is successful if:
- ✅ Owner knows what to do within 30 seconds
- ✅ Owner takes action on at-risk members
- ✅ Owner understands their retention health
- ✅ Owner feels in control, not overwhelmed

## See Also

- Dashboard Page: `app/(protected)/dashboard/page.tsx`
- Metrics API: `app/api/dashboard/metrics/route.ts`
- Components: `components/dashboard/`
