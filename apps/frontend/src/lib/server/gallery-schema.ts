/**
 * Detect optional Neon columns so gallery SQL works before/after neon_007/008 migrations.
 */

import type { Pool } from 'pg';

export type GalleryOptionalColumns = {
  countryCoverImageUrl: boolean;
  fileIsCountryCover: boolean;
  fileDesignType: boolean;
  fileSortTitle: boolean;
  countrySortName: boolean;
};

let cache: { at: number; cols: GalleryOptionalColumns } | null = null;
const TTL_MS = 60_000;

const DEFAULT_COLS: GalleryOptionalColumns = {
  countryCoverImageUrl: false,
  fileIsCountryCover: false,
  fileDesignType: false,
  fileSortTitle: false,
  countrySortName: false,
};

export async function galleryOptionalColumns(pool: Pool): Promise<GalleryOptionalColumns> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.cols;

  try {
    const res = await pool.query<{ table_name: string; column_name: string }>(
      `SELECT table_name, column_name
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND (
           (table_name = 'countries' AND column_name IN ('cover_image_url', 'sort_name'))
           OR (table_name = 'country_flag_files' AND column_name IN ('is_country_cover', 'design_type', 'sort_title'))
         )`,
    );
    const set = new Set(res.rows.map((r) => `${r.table_name}.${r.column_name}`));
    const cols: GalleryOptionalColumns = {
      countryCoverImageUrl: set.has('countries.cover_image_url'),
      fileIsCountryCover: set.has('country_flag_files.is_country_cover'),
      fileDesignType: set.has('country_flag_files.design_type'),
      fileSortTitle: set.has('country_flag_files.sort_title'),
      countrySortName: set.has('countries.sort_name'),
    };
    cache = { at: Date.now(), cols };
    return cols;
  } catch (e) {
    console.warn('[gallery-schema] column probe failed, using legacy SQL', e);
    cache = { at: Date.now(), cols: DEFAULT_COLS };
    return DEFAULT_COLS;
  }
}

/** Reset probe cache (tests). */
export function resetGallerySchemaCache(): void {
  cache = null;
}
