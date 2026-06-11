-- ============================================================================
-- MIGRATION 034: Missing schema for production launch
-- ============================================================================
-- Adds columns used by the app but not yet in prior migrations.
-- Required for: gym onboarding, campaign segment targeting, member CSV upload.
-- ============================================================================

-- Gym address fields (onboarding gym-info, settings profile)
ALTER TABLE gyms
  ADD COLUMN IF NOT EXISTS address_line1 TEXT,
  ADD COLUMN IF NOT EXISTS address_line2 TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS postcode TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS latitude NUMERIC,
  ADD COLUMN IF NOT EXISTS longitude NUMERIC;

COMMENT ON COLUMN gyms.address_line1 IS 'Gym address line 1';
COMMENT ON COLUMN gyms.city IS 'Gym city';
COMMENT ON COLUMN gyms.postcode IS 'Gym postcode';

-- Campaign segment targeting (create/run campaigns)
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS target_segment TEXT DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS include_cancelled BOOLEAN DEFAULT false;

COMMENT ON COLUMN campaigns.target_segment IS 'Risk segment to target: low, medium, high, or all';
COMMENT ON COLUMN campaigns.include_cancelled IS 'Whether to include cancelled members in audience';

-- Member billing/geo (CSV upload, distance calculation)
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS billing_address_line1 TEXT,
  ADD COLUMN IF NOT EXISTS billing_address_line2 TEXT,
  ADD COLUMN IF NOT EXISTS billing_city TEXT,
  ADD COLUMN IF NOT EXISTS billing_postcode TEXT,
  ADD COLUMN IF NOT EXISTS billing_country TEXT,
  ADD COLUMN IF NOT EXISTS latitude NUMERIC,
  ADD COLUMN IF NOT EXISTS longitude NUMERIC;

COMMENT ON COLUMN members.billing_address_line1 IS 'Member billing address line 1';
COMMENT ON COLUMN members.latitude IS 'Member latitude (geocoded from address)';
COMMENT ON COLUMN members.longitude IS 'Member longitude (geocoded from address)';
