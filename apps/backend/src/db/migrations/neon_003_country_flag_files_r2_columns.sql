-- -----------------------------------------------------------------------------
-- Neon: country_flag_files — R2 metadata + preview (additive, idempotent)
-- Run after neon_001 / neon_002. Does NOT delete data.
--
-- TODO(flagswing-storage): Rows with storage_provider = 'vercel_blob' (or NULL +
--   file_url containing blob.vercel-storage.com) are legacy public Blob objects.
--   New uploads must use storage_provider = 'r2'. Optionally migrate Blob → R2 manually.
-- -----------------------------------------------------------------------------

ALTER TABLE country_flag_files ADD COLUMN IF NOT EXISTS file_key TEXT;
ALTER TABLE country_flag_files ADD COLUMN IF NOT EXISTS storage_provider TEXT DEFAULT 'r2';
ALTER TABLE country_flag_files ADD COLUMN IF NOT EXISTS preview_url TEXT;

COMMENT ON COLUMN country_flag_files.file_key IS 'Object key in R2/S3-compatible bucket (no leading slash).';
COMMENT ON COLUMN country_flag_files.storage_provider IS 'r2 | vercel_blob | local — source of file_url bytes.';
COMMENT ON COLUMN country_flag_files.preview_url IS 'Public preview URL for gallery (<img>); may equal file_url for images.';

CREATE INDEX IF NOT EXISTS idx_country_flag_files_storage_provider ON country_flag_files (storage_provider);

UPDATE country_flag_files
   SET storage_provider = 'vercel_blob'
 WHERE storage_provider IS NULL
   AND file_url ILIKE '%blob.vercel-storage.com%';

UPDATE country_flag_files
   SET storage_provider = 'r2'
 WHERE storage_provider IS NULL;
