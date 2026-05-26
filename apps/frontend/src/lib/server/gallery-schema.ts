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

/** True only when Postgres can resolve the column (guards stale information_schema). */
async function columnQueryable(pool: Pool, table: string, column: string): Promise<boolean> {
  try {
    await pool.query(`SELECT ${column} FROM ${table} WHERE false LIMIT 0`);
    return true;
  } catch (e) {
    const code =
      typeof e === 'object' && e !== null && 'code' in e ? String((e as { code: string }).code) : '';
    if (code === '42703') return false;
    throw e;
  }
}

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
      countryCoverImageUrl: false,
      fileIsCountryCover: false,
      fileDesignType: false,
      fileSortTitle: false,
      countrySortName: false,
    };

    if (set.has('countries.cover_image_url')) {
      cols.countryCoverImageUrl = await columnQueryable(pool, 'countries', 'cover_image_url');
    }
    if (set.has('countries.sort_name')) {
      cols.countrySortName = await columnQueryable(pool, 'countries', 'sort_name');
    }
    if (set.has('country_flag_files.is_country_cover')) {
      cols.fileIsCountryCover = await columnQueryable(pool, 'country_flag_files', 'is_country_cover');
    }
    if (set.has('country_flag_files.design_type')) {
      cols.fileDesignType = await columnQueryable(pool, 'country_flag_files', 'design_type');
    }
    if (set.has('country_flag_files.sort_title')) {
      cols.fileSortTitle = await columnQueryable(pool, 'country_flag_files', 'sort_title');
    }

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
