-- MIGRATION 039: Audit request CSV file metadata + private storage bucket
-- Requires migration 038 for gyms.plan_id and nurture columns.
-- Creates audit_requests here too if 038 was skipped (safe to re-run).

CREATE TABLE IF NOT EXISTS audit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  active_members TEXT NOT NULL,
  gym_software TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  nurture_day1_sent_at TIMESTAMPTZ,
  csv_storage_path TEXT,
  csv_original_filename TEXT
);

CREATE INDEX IF NOT EXISTS audit_requests_created_at_idx ON audit_requests (created_at);
CREATE INDEX IF NOT EXISTS audit_requests_email_idx ON audit_requests (email);

ALTER TABLE audit_requests
  ADD COLUMN IF NOT EXISTS csv_storage_path TEXT,
  ADD COLUMN IF NOT EXISTS csv_original_filename TEXT;

COMMENT ON TABLE audit_requests IS 'Free Retention Audit lead capture — not a subscription';
COMMENT ON COLUMN audit_requests.nurture_day1_sent_at IS 'When day-1 audit follow-up email was sent';
COMMENT ON COLUMN audit_requests.csv_storage_path IS 'Path in audit-uploads storage bucket';
COMMENT ON COLUMN audit_requests.csv_original_filename IS 'Original filename from upload';

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audit-uploads',
  'audit-uploads',
  false,
  10485760,
  ARRAY['text/csv', 'application/csv', 'text/plain', 'application/vnd.ms-excel']
)
ON CONFLICT (id) DO NOTHING;
