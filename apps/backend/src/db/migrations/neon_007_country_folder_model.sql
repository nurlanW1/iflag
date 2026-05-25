-- Neon: folder/collection metadata for gallery + importer (additive, idempotent).

-- country_flag_files — design grouping & cover selection support
ALTER TABLE country_flag_files ADD COLUMN IF NOT EXISTS design_type VARCHAR(48);
ALTER TABLE country_flag_files ADD COLUMN IF NOT EXISTS is_country_cover BOOLEAN DEFAULT false;
ALTER TABLE country_flag_files ADD COLUMN IF NOT EXISTS sort_title TEXT;
ALTER TABLE country_flag_files ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE country_flag_files ADD COLUMN IF NOT EXISTS available_formats TEXT[];

COMMENT ON COLUMN country_flag_files.design_type IS 'logical design variant: official_flat, wave, circle, heart, sphere, map, other, …';
COMMENT ON COLUMN country_flag_files.is_country_cover IS 'row is preferred candidate thumbnail for countries.cover_image_url selection';
COMMENT ON COLUMN country_flag_files.sort_title IS 'stable sort/display title inside country folder lists';
COMMENT ON COLUMN country_flag_files.region IS 'denormalized countries.region snapshot for filtering — set at import/backfill';
COMMENT ON COLUMN country_flag_files.available_formats IS 'all formats published for same asset_group_key+country — filled by backfill';

CREATE INDEX IF NOT EXISTS idx_country_flag_files_design_type_pub
  ON country_flag_files (country_id, design_type)
  WHERE status = 'published' AND design_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_country_flag_files_cover_candidates
  ON country_flag_files (country_id)
  WHERE status = 'published' AND COALESCE(is_country_cover, false) = true;

-- countries — persisted folder cover URL (webp/jpg/png preferred via backfill/import)
ALTER TABLE countries ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

COMMENT ON COLUMN countries.cover_image_url IS 'Official flat WEBP/JPG/PNG/SVG thumbnail for hub cards — never EPS/AI';
