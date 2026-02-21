# Database Migrations Checklist

This document lists all migrations that need to be applied to your Supabase database. Run them in order.

## Migration Order

### ✅ Migration 001: Initial Schema
**File**: `supabase/migrations/001_initial_schema.sql`
**Status**: Should already be applied (base schema)
**Critical**: Yes - Required for the app to work

---

### ⚠️ Migration 005: Branding Fields
**File**: `supabase/migrations/005_add_branding_fields.sql`
**Status**: **NEEDS TO BE APPLIED**
**Critical**: No - App will work without it, but branding features won't function

**SQL to Run**:
```sql
-- Add branding fields to gyms table
ALTER TABLE gyms
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS brand_primary_color TEXT DEFAULT '#2563EB',
  ADD COLUMN IF NOT EXISTS brand_secondary_color TEXT DEFAULT '#1E40AF';

COMMENT ON COLUMN gyms.logo_url IS 'URL or base64 data URL of the gym logo';
COMMENT ON COLUMN gyms.brand_primary_color IS 'Primary brand colour (hex code) used for buttons and links';
COMMENT ON COLUMN gyms.brand_secondary_color IS 'Secondary brand colour (hex code) used for accents';
```

---

### ⚠️ Migration 006: Client Count Range
**File**: `supabase/migrations/006_add_client_count_range.sql`
**Status**: **NEEDS TO BE APPLIED** (You're seeing this error)
**Critical**: No - Signup works without it, but client count data won't be stored

**SQL to Run**:
```sql
ALTER TABLE gyms
  ADD COLUMN IF NOT EXISTS client_count_range TEXT CHECK (client_count_range IN ('0-50', '51-150', '151-500', '501+'));

COMMENT ON COLUMN gyms.client_count_range IS 'Initial client count range selected during signup: 0-50, 51-150, 151-500, 501+';
```

---

### ⚠️ Migration 007: Membership Types
**File**: `supabase/migrations/007_add_membership_types.sql`
**Status**: **NEEDS TO BE APPLIED**
**Critical**: No - App works without it, but membership type features won't function

**SQL to Run**: See file `supabase/migrations/007_add_membership_types.sql` (too long to include here)

---

### ⚠️ Migration 008: Tour Completion Tracking
**File**: `supabase/migrations/008_add_tour_completion_tracking.sql`
**Status**: **NEEDS TO BE APPLIED**
**Critical**: No - App works without it, but tour tracking won't work

**SQL to Run**:
```sql
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS has_completed_tour BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN users.has_completed_tour IS 'Whether the user has completed the product onboarding tour';
```

---

### ⚠️ Migration 009: Intervention Effectiveness Tracking
**File**: `supabase/migrations/009_add_intervention_effectiveness_tracking.sql`
**Status**: **NEEDS TO BE APPLIED**
**Critical**: Yes - Required for campaign outcome tracking and insights

**SQL to Run**: See file `supabase/migrations/009_add_intervention_effectiveness_tracking.sql` (too long to include here)

---

### ⚠️ Migration 018: Gym Sender Identity
**File**: `supabase/migrations/018_gym_sender_identity.sql`
**Status**: **NEEDS TO BE APPLIED**
**Critical**: No - App works without it, but custom sender email/name won't work

**SQL to Run**:
```sql
ALTER TABLE gyms
  ADD COLUMN IF NOT EXISTS sender_name TEXT,
  ADD COLUMN IF NOT EXISTS sender_email TEXT,
  ADD COLUMN IF NOT EXISTS sms_from_number TEXT;

COMMENT ON COLUMN gyms.sender_name IS 'Display name for campaign emails (e.g. "Acme Gym")';
COMMENT ON COLUMN gyms.sender_email IS 'From address for campaign emails; must use a domain verified in Resend';
COMMENT ON COLUMN gyms.sms_from_number IS 'Optional Twilio number for SMS campaigns (e.g. +1234567890)';
```

---

### ⚠️ Migration 019: Member Intelligence Columns
**File**: `supabase/migrations/019_member_intelligence_columns.sql`
**Status**: **NEEDS TO BE APPLIED**
**Critical**: Yes - Required for member profiles and insights to work properly

**SQL to Run**:
```sql
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS member_stage TEXT,
  ADD COLUMN IF NOT EXISTS commitment_score NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS commitment_score_calculated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS churn_probability NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS habit_decay_index NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS emotional_disengagement_flags JSONB,
  ADD COLUMN IF NOT EXISTS behaviour_interpretation TEXT;

COMMENT ON COLUMN members.member_stage IS 'Habit lifecycle stage from member-intelligence (e.g. momentum_identity, win_back_window)';
COMMENT ON COLUMN members.commitment_score IS '0-100 commitment score from commitment-score lib';
COMMENT ON COLUMN members.churn_probability IS 'Churn risk score from churn-risk lib';
```

---

### ⚠️ Migration 020: Organization Invites
**File**: `supabase/migrations/020_organization_invites.sql`
**Status**: **NEEDS TO BE APPLIED**
**Critical**: No - App works without it, but organization invite features won't work

**SQL to Run**: See file `supabase/migrations/020_organization_invites.sql` (too long to include here)

---

### ⚠️ Migration 021: Recalibrate Risk Scoring
**File**: `supabase/migrations/021_recalibrate_risk_scoring.sql`
**Status**: **NEEDS TO BE APPLIED**
**Critical**: Yes - Required for the new risk scoring system

**What it does**: 
- Creates functions to calculate risk level and risk score based on commitment score
- Updates all existing members with new risk calculations
- Risk level thresholds: 1-20=high, 21-60=medium, 61-79=low, 80+=none
- Risk score: base = 100 - commitment_score, multiplied by 1.2 for each 14-day period without visit

**SQL to Run**: See file `supabase/migrations/021_recalibrate_risk_scoring.sql` (103 lines - contains functions and member updates)

---

## Quick Apply All Migrations

You can run all migrations at once by copying the contents of each migration file in order (001, 005, 006, 007, 008, 009, 018, 019, 020, 021) into the Supabase SQL Editor and running them.

## How to Apply Migrations

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste each migration SQL (in order)
4. Click **Run** or press `Ctrl/Cmd + Enter`
5. Verify each migration succeeded

## Critical Migrations (Must Have)

- ✅ 001: Initial Schema
- ⚠️ 009: Intervention Effectiveness Tracking
- ⚠️ 019: Member Intelligence Columns  
- ⚠️ 021: Recalibrate Risk Scoring

## Non-Critical Migrations (Nice to Have)

- ⚠️ 005: Branding Fields
- ⚠️ 006: Client Count Range
- ⚠️ 007: Membership Types
- ⚠️ 008: Tour Completion Tracking
- ⚠️ 018: Gym Sender Identity
- ⚠️ 020: Organization Invites
