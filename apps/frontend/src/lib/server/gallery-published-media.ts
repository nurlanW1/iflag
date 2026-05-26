/**
 * Shared SQL predicate: a published `country_flag_files` row has a resolvable preview or master.
 * Do not require `file_url` alone — imports may only persist `file_key` until backfill.
 */
export function publishedFlagHasMediaSql(tableAlias?: string): string {
  const p = tableAlias?.trim() ? `${tableAlias.trim()}.` : '';
  return `(
  NULLIF(trim(${p}file_url::text), '') IS NOT NULL
  OR NULLIF(trim(${p}file_key::text), '') IS NOT NULL
  OR NULLIF(trim(${p}preview_url::text), '') IS NOT NULL
  OR NULLIF(trim(${p}thumbnail_url::text), '') IS NOT NULL
)`;
}

/** @deprecated use publishedFlagHasMediaSql() */
export const PUBLISHED_FLAG_HAS_MEDIA_SQL = publishedFlagHasMediaSql();
