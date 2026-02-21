-- Store Mindbody and Glofox API credentials per gym for member data sync.
-- Used by the integration layer (src/integrations) when syncing members, visits, payments.

ALTER TABLE gyms
  ADD COLUMN IF NOT EXISTS mindbody_api_key TEXT,
  ADD COLUMN IF NOT EXISTS mindbody_site_id TEXT,
  ADD COLUMN IF NOT EXISTS mindbody_access_token TEXT,
  ADD COLUMN IF NOT EXISTS glofox_access_token TEXT,
  ADD COLUMN IF NOT EXISTS glofox_base_url TEXT;

COMMENT ON COLUMN gyms.mindbody_api_key IS 'Mindbody API key for this gym; used with site ID and access token';
COMMENT ON COLUMN gyms.mindbody_site_id IS 'Mindbody Site ID';
COMMENT ON COLUMN gyms.mindbody_access_token IS 'Mindbody Bearer token; rotate as needed';
COMMENT ON COLUMN gyms.glofox_access_token IS 'Glofox Bearer token for this gym';
COMMENT ON COLUMN gyms.glofox_base_url IS 'Optional Glofox API base URL (tenant-specific); default https://api.glofox.com/v2';
