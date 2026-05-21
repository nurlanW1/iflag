-- -----------------------------------------------------------------------------
-- Neon: country_flag_files — denormalized slug/title for imports & search (additive)
-- Safe to re-run. Does not delete or rewrite existing rows.
-- -----------------------------------------------------------------------------

ALTER TABLE country_flag_files ADD COLUMN IF NOT EXISTS country_slug TEXT;
ALTER TABLE country_flag_files ADD COLUMN IF NOT EXISTS title TEXT;

COMMENT ON COLUMN country_flag_files.country_slug IS 'Denormalized countries.slug at import time (optional shortcut for tooling).';
COMMENT ON COLUMN country_flag_files.title IS 'Human title / variant label (import or admin); may mirror variant_name.';

CREATE INDEX IF NOT EXISTS idx_country_flag_files_country_slug_lower
  ON country_flag_files (lower(trim(country_slug)))
  WHERE country_slug IS NOT NULL AND trim(country_slug) <> '';
