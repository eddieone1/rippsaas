-- ============================================================================
-- MIGRATION 036: Additional promo codes for trial extension
-- ============================================================================
-- Adds EXTEND7 and EXTEND30 codes. Safe to re-run (ON CONFLICT DO NOTHING).
-- ============================================================================

INSERT INTO promo_codes (code, extension_days, max_uses)
VALUES 
  ('EXTEND7', 7, 50),
  ('EXTEND30', 30, 10)
ON CONFLICT (code) DO NOTHING;
