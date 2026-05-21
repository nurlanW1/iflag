-- -----------------------------------------------------------------------------
-- Neon: safer list performance for published R2-backed flags + common filters.
-- Re-runnable via IF NOT EXISTS. Does not DELETE or tighten constraints.
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_country_flag_files_pub_created_desc
  ON country_flag_files (created_at DESC)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_country_flag_files_pub_slug_lower
  ON country_flag_files (lower(trim(country_slug)))
  WHERE status = 'published' AND country_slug IS NOT NULL AND trim(country_slug) <> '';

CREATE INDEX IF NOT EXISTS idx_country_flag_files_pub_fmt
  ON country_flag_files (lower(trim(format)))
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_country_flag_files_pub_file_key_nonempty
  ON country_flag_files (file_key)
  WHERE status = 'published' AND file_key IS NOT NULL AND btrim(file_key::text) <> '';
