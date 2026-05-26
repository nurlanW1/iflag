/**
 * Shared SQL predicate: a published `country_flag_files` row has a resolvable preview or master.
 * Do not require `file_url` alone — imports may only persist `file_key` until backfill.
 */
export const PUBLISHED_FLAG_HAS_MEDIA_SQL = `(
  NULLIF(trim(file_url::text), '') IS NOT NULL
  OR NULLIF(trim(file_key::text), '') IS NOT NULL
  OR NULLIF(trim(preview_url::text), '') IS NOT NULL
  OR NULLIF(trim(thumbnail_url::text), '') IS NOT NULL
)`;
