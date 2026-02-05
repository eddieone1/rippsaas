# Coach Action Inbox

## Overview

The Coach Action Inbox is a **simple task list** for coaches. No dashboards, no analytics - just actions.

**Purpose:** Coach accountability

## Core Principle

**"What do I need to do today?"**

Every action answers this question directly.

## Features

### ✅ Daily Action List
- Actions generated daily based on assigned members
- Only shows incomplete actions
- Prioritized by urgency

### ✅ Simple Task UI
- Clean, focused design
- No clutter
- Just: what, who, when

### ✅ Mark Complete
- One-click completion
- Optional notes
- Timestamp recorded

### ✅ Timestamp Completion
- Records when action was completed
- Records who completed it
- Optional notes for context

## Action Types

### Contact Member
- **When:** High risk member, no visit in 14+ days
- **Priority:** High
- **Action:** Personal outreach needed

### Send Campaign
- **When:** Medium risk, low commitment score
- **Priority:** Medium
- **Action:** Send re-engagement campaign

### Check In
- **When:** No visit in 7-13 days
- **Priority:** Medium
- **Action:** Quick check-in to understand barriers

### Follow Up
- **When:** At-risk member, regular follow-up
- **Priority:** Low
- **Action:** Maintain engagement

### Investigate Issue
- **When:** Low commitment score
- **Priority:** Medium
- **Action:** Review patterns and identify barriers

## Data Model

### coach_actions Table

```sql
CREATE TABLE coach_actions (
  id UUID PRIMARY KEY,
  coach_id UUID NOT NULL,
  member_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL,
  due_date DATE NOT NULL,
  completed_at TIMESTAMPTZ,
  completed_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Key Fields:**
- `due_date` - Action due date (typically today)
- `completed_at` - When action was completed (NULL = incomplete)
- `completed_by` - Who completed it
- `notes` - Optional notes when completing

## Action Generation Logic

Actions are generated based on:
1. **Member risk level** - High/medium risk = more urgent actions
2. **Days since last visit** - Longer gap = more urgent
3. **Commitment score** - Lower score = needs attention
4. **Member status** - Only active members

**Rules:**
- One action per member per day
- Actions generated on-demand when coach views inbox
- Completed actions don't reappear

## Usage

### Access Inbox
Navigate to `/coach/inbox` (coaches only)

### View Actions
- Actions grouped by priority
- High priority first
- Shows member name and action description

### Complete Action
1. Click "Mark Complete"
2. Optionally add notes
3. Click "Confirm"
4. Action disappears from list

### View Member
Click "View [Member Name] →" to see full profile

## API Endpoints

### GET `/api/coach/actions`
Get daily actions for current coach

**Response:**
```json
{
  "actions": [
    {
      "id": "uuid",
      "memberId": "uuid",
      "memberName": "John Doe",
      "actionType": "contact_member",
      "title": "Contact John Doe",
      "description": "High risk member...",
      "priority": "high",
      "dueDate": "2026-01-29",
      "completedAt": null,
      "notes": null
    }
  ],
  "total": 5
}
```

### POST `/api/coach/actions/[id]/complete`
Mark action as complete

**Request:**
```json
{
  "notes": "Called member, discussed barriers"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Action marked as complete"
}
```

## Files Created

- `supabase/migrations/013_add_coach_actions.sql` - Database schema
- `lib/coach-actions/generate.ts` - Action generation logic
- `app/api/coach/actions/route.ts` - Get actions endpoint
- `app/api/coach/actions/[id]/complete/route.ts` - Complete action endpoint
- `app/(protected)/coach/inbox/page.tsx` - Inbox page
- `components/coach/CoachInbox.tsx` - Inbox component
- `components/coach/ActionItem.tsx` - Action item component

## UX Design Decisions

### Why Simple Task UI?
- Coaches need clarity, not data
- Focus on action, not analysis
- Fast workflow

### Why No Dashboards?
- Dashboards = analysis paralysis
- Tasks = action
- MVP principle: action over analysis

### Why Daily Actions?
- Fresh list every day
- Prevents overwhelm
- Clear priorities

### Why Timestamp Completion?
- Accountability
- Track coach activity
- Future analytics (not in MVP)

## Future Enhancements (Not in MVP)

- [ ] Action history view
- [ ] Recurring actions
- [ ] Action templates
- [ ] Bulk actions
- [ ] Action analytics (for owners)
- [ ] Email notifications for new actions

## See Also

- Inbox Page: `app/(protected)/coach/inbox/page.tsx`
- Action Generation: `lib/coach-actions/generate.ts`
- API Endpoints: `app/api/coach/actions/`
