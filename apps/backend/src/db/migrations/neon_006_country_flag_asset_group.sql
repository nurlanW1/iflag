-- Neon: country_flag_files — logical product grouping for multi-format designs (additive).

ALTER TABLE country_flag_files ADD COLUMN IF NOT EXISTS asset_group_key TEXT;
ALTER TABLE country_flag_files ADD COLUMN IF NOT EXISTS display_title TEXT;

COMMENT ON COLUMN country_flag_files.asset_group_key IS 'Stable slug identifying one design across formats (e.g. uzbekistan-flag).';
COMMENT ON COLUMN country_flag_files.display_title IS 'Human-readable product/design title shown in catalogs.';

CREATE INDEX IF NOT EXISTS idx_country_flag_files_asset_group_country
  ON country_flag_files (country_id, asset_group_key)
  WHERE asset_group_key IS NOT NULL AND btrim(asset_group_key) <> '';

CREATE INDEX IF NOT EXISTS idx_country_flag_files_asset_group_key_pub
  ON country_flag_files (lower(trim(asset_group_key)))
  WHERE status = 'published' AND asset_group_key IS NOT NULL AND btrim(asset_group_key) <> '';
