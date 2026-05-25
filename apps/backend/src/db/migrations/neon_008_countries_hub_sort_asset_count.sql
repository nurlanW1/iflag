-- Neon: country hub indexing (additive, idempotent).
-- sort_name drives A→Z when name has articles; asset_count caches distinct designs per hub.

ALTER TABLE countries ADD COLUMN IF NOT EXISTS sort_name TEXT;
ALTER TABLE countries ADD COLUMN IF NOT EXISTS asset_count INTEGER DEFAULT 0;

COMMENT ON COLUMN countries.sort_name IS 'Lowercase sort key — default lower(name); backfill may normalize articles';
COMMENT ON COLUMN countries.asset_count IS 'Distinct design count (asset groups) published for this hub — maintained by backfill';

CREATE INDEX IF NOT EXISTS idx_countries_sort_name_lower ON countries (lower(trim(sort_name)));

