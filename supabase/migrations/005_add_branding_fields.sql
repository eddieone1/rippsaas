-- Add branding fields to gyms table
-- This includes logo URL and brand colours for customisation

ALTER TABLE gyms
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS brand_primary_color TEXT DEFAULT '#2563EB',
  ADD COLUMN IF NOT EXISTS brand_secondary_color TEXT DEFAULT '#1E40AF';

-- Comments for documentation
COMMENT ON COLUMN gyms.logo_url IS 'URL or base64 data URL of the gym logo';
COMMENT ON COLUMN gyms.brand_primary_color IS 'Primary brand colour (hex code) used for buttons and links';
COMMENT ON COLUMN gyms.brand_secondary_color IS 'Secondary brand colour (hex code) used for accents';
