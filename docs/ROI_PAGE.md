# Retention Impact / ROI Page

## Overview

The Retention Impact / ROI page proves the value of the software. It shows concrete metrics that justify the investment.

**Purpose:** Justify the software

## Required Metrics (All Implemented)

### ✅ Members Saved
- **Definition:** Count of members who re-engaged after receiving an intervention
- **Calculation:** Count of `campaign_sends` with `outcome = 're_engaged'`
- **Display:** Large number with icon

### ✅ Revenue Retained
- **Definition:** Estimated revenue from saved members over 3 months
- **Calculation:** 
  - For each saved member, calculate monthly revenue based on membership type
  - Multiply by 3 months (average retention period)
  - Sum all saved members
- **Display:** Currency formatted (£X,XXX)

### ✅ Churn Reduction %
- **Definition:** Percentage of potential churn prevented
- **Calculation:** `(Members Re-engaged / (Members Churned + Members Re-engaged)) × 100`
- **Display:** Percentage with before/after comparison

### ✅ Before vs After Chart
- **Definition:** Monthly trend showing churn vs re-engagement
- **Data:** 
  - Members churned per month
  - Members re-engaged per month
  - Revenue retained per month
- **Display:** Line chart with two lines (churned vs re-engaged)

### ✅ ROI Multiple
- **Definition:** Return on investment ratio
- **Calculation:** `Revenue Retained ÷ Software Cost`
- **Example:** £900 retained ÷ £99/month = 9x ROI
- **Display:** Multiple (e.g., "9x")

## Calculations

### Members Saved
```typescript
const membersSaved = campaignSends.filter(
  (s) => s.outcome === 're_engaged'
).length;
```

### Revenue Retained
```typescript
// For each saved member:
const monthlyRevenue = calculateMonthlyRevenue(member, membershipTypes);
const revenueRetained = monthlyRevenue * 3; // 3 months retention
// Sum all saved members
```

### Churn Reduction %
```typescript
const membersChurned = campaignSends.filter(
  (s) => s.outcome === 'no_response' || s.outcome === 'cancelled'
).length;
const churnReduction = (membersSaved / (membersChurned + membersSaved)) * 100;
```

### ROI Multiple
```typescript
const roiMultiple = revenueRetained / softwareCost;
```

## Page Components

### ROIMetrics Component
- Displays 4 key metric cards
- Time range selector (All Time, 3 Months, 6 Months, Year)
- Includes Before/After chart

### BeforeAfterChart Component
- Two line charts:
  1. Members churned vs re-engaged over time
  2. Revenue retained over time
- Uses Recharts library
- Responsive design

### MetricsExplanation Component
- Explains what each metric means
- Shows calculation methodology
- Includes disclaimer about attribution

## API Endpoint

### GET `/api/roi/metrics`

**Query Parameters:**
- `time_range` - "all" | "3months" | "6months" | "year"

**Response:**
```json
{
  "membersSaved": 15,
  "revenueRetained": 1350,
  "churnReduction": 45.5,
  "roiMultiple": 13.6,
  "baselineChurnRate": 5.2,
  "currentChurnRate": 2.8,
  "softwareCost": 99,
  "timeRange": "all",
  "monthlyTrend": [
    {
      "month": "2025-10",
      "membersAtStart": 150,
      "membersChurned": 5,
      "membersReengaged": 3,
      "revenueRetained": 270
    }
  ]
}
```

## Data Model Usage

### Members Table
- `status` - To identify active members
- `membership_type_id` - For revenue calculation
- `joined_date` - For time range filtering

### Membership Types Table
- `price` - Membership price
- `billing_frequency` - To convert to monthly revenue

### Campaign Sends Table
- `outcome` - 're_engaged' | 'no_response' | 'cancelled'
- `sent_at` - For time range filtering
- `member_id` - To link to members

### Campaigns Table
- `gym_id` - To filter by gym

## Assumptions & Limitations

### Revenue Calculation
- **Assumption:** Saved members stay active for 3 months
- **Rationale:** Conservative estimate for MVP
- **Future:** Could track actual retention duration

### Churn Rate Calculation
- **Limitation:** Simplified baseline calculation
- **Current:** Uses overall cancelled members / total members
- **Future:** Could track cancellation dates for more accuracy

### Attribution Model
- **Model:** Last intervention before re-engagement wins
- **Rationale:** Simple, transparent, MVP-appropriate
- **Future:** Could implement more sophisticated attribution

## UX Design Decisions

### Why These Metrics?
- **Members Saved:** Concrete, easy to understand
- **Revenue Retained:** Directly ties to business value
- **Churn Reduction:** Shows improvement over time
- **ROI Multiple:** Clear justification for software cost

### Why Before/After Chart?
- Visual comparison is powerful
- Shows trend over time
- Easy to see impact

### Why Time Range Selector?
- Allows users to see different time periods
- Useful for tracking progress
- Helps justify ongoing subscription

## Files Created

- `lib/roi/calculations.ts` - Calculation logic
- `app/api/roi/metrics/route.ts` - API endpoint
- `components/roi/ROIMetrics.tsx` - Main metrics component
- `components/roi/BeforeAfterChart.tsx` - Chart component
- `components/roi/MetricsExplanation.tsx` - Explanation component
- `app/(protected)/roi/page.tsx` - Page component
- `docs/ROI_PAGE.md` - This documentation

## See Also

- ROI Page: `app/(protected)/roi/page.tsx`
- Calculations: `lib/roi/calculations.ts`
- API Endpoint: `app/api/roi/metrics/route.ts`
