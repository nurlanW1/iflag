/**
 * Normalize country hub metadata after schema changes / bulk imports:
 * - classify design_type + premium_tier + sort_title from R2 keys
 * - denormalize country_flag_files.region
 * - available_formats arrays per asset group
 * - single is_country_cover winner + countries.cover_image_url
 * - countries.asset_count + sort_name
 *
 *   npm run build --workspace=backend
 *   npm run backfill:country-folders --workspace=backend
 */
import dotenv from 'dotenv';
import pg from 'pg';
import { basename, dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deriveAssetGroupKeyFromParts } from '../lib/asset-group-key.js';
import { classifyFlagDesign } from '../lib/flag-design-classify.js';
import {
  loadCountrySlugIndex,
  resolveCanonicalCountrySlugWithIndex,
} from '../lib/resolve-canonical-country-slug.js';
import { createScriptPool, verifyScriptDbConnection } from '../lib/script-db-pool.js';

const __scriptDir = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__scriptDir, '../../.env') });

type FileRow = {
  id: string;
  file_name: string;
  file_key: string | null;
  file_path: string | null;
  country_id: string;
  format: string | null;
  country_slug: string | null;
  imported_via: string | null;
};

function stemFromFileName(fn: string): string {
  return basename(fn.trim(), extname(fn.trim()));
}

function r2LikeKey(row: FileRow): string {
  const k = row.file_key?.trim() || row.file_path?.trim() || row.file_name;
  return k;
}

async function publishAllImportedRows(pool: pg.Pool): Promise<number> {
  const r = await pool.query(
    `UPDATE country_flag_files
     SET status = 'published',
         processing_status = 'completed',
         updated_at = CURRENT_TIMESTAMP
     WHERE lower(trim(coalesce(status::text, ''))) IS DISTINCT FROM 'published'
       AND NULLIF(trim(file_key::text), '') IS NOT NULL`,
  );
  return r.rowCount ?? 0;
}

async function reconcileCanonicalCountryAssignments(pool: pg.Pool): Promise<number> {
  const slugIndex = await loadCountrySlugIndex(pool);
  const countryRows = await pool.query<{ id: string; slug: string }>(
    `SELECT id, lower(trim(slug)) AS slug FROM countries`,
  );
  const countryIdBySlug = new Map(countryRows.rows.map((r) => [r.slug, r.id]));

  const res = await pool.query<FileRow & { inferred_slug: string }>(
    `SELECT f.id, f.file_name, f.file_key, f.file_path, f.country_id, f.format,
            COALESCE(NULLIF(trim(f.country_slug), ''), NULLIF(trim(c.slug), '')) AS inferred_slug
     FROM country_flag_files f
     LEFT JOIN countries c ON c.id = f.country_id`,
  );
  let moved = 0;
  for (const row of res.rows) {
    const inferred = row.inferred_slug?.trim();
    if (!inferred) continue;
    const canonical = resolveCanonicalCountrySlugWithIndex(inferred, slugIndex);
    const countryId = countryIdBySlug.get(canonical.toLowerCase());
    if (!countryId) continue;

    const stem = stemFromFileName(String(row.file_name || 'asset'));
    const r2Key = r2LikeKey(row);
    const folderSegments = r2Key.split('/').filter(Boolean).slice(0, -1);
    const assetGroupKey = deriveAssetGroupKeyFromParts({
      countrySlug: canonical,
      folderSegments,
      fileStemNoExt: stem,
    }).slice(0, 240);

    const upd = await pool.query(
      `UPDATE country_flag_files SET
          country_id = $1::uuid,
          country_slug = $2,
          variant_name = COALESCE(NULLIF(trim(variant_name), ''), $3),
          asset_group_key = $4,
          updated_at = CURRENT_TIMESTAMP
       WHERE id = $5::uuid
         AND (
           country_id IS DISTINCT FROM $1::uuid
           OR lower(trim(coalesce(country_slug, ''))) IS DISTINCT FROM lower(trim($2))
         )`,
      [countryId, canonical, stem.slice(0, 100), assetGroupKey, row.id],
    );
    if ((upd.rowCount ?? 0) > 0) moved++;
  }
  return moved;
}

async function classifyAllRows(pool: pg.Pool): Promise<number> {
  const res = await pool.query<FileRow & { iso_alpha_2: string | null; country_name: string | null }>(
    `SELECT f.id, f.file_name, f.file_key, f.file_path, f.country_id, f.format,
            COALESCE(NULLIF(trim(c.slug), ''), NULLIF(trim(f.country_slug), '')) AS country_slug,
            NULLIF(trim(c.iso_alpha_2::text), '') AS iso_alpha_2,
            NULLIF(trim(c.name::text), '') AS country_name,
            NULLIF(trim(f.metadata->>'imported_via'), '') AS imported_via
     FROM country_flag_files f
     LEFT JOIN countries c ON c.id = f.country_id`,
  );
  let n = 0;
  for (const row of res.rows) {
    const stem = stemFromFileName(String(row.file_name || 'asset'));
    const parsed = classifyFlagDesign({
      r2Key: r2LikeKey(row),
      fileStem: stem,
      countrySlug: row.country_slug?.trim() ?? '',
      isoAlpha2: row.iso_alpha_2,
      countryName: row.country_name,
      format: row.format?.trim() ?? '',
    });
    const premium = row.imported_via === 'import-r2-files'
      ? 'paid'
      : parsed.premium_tier === 'free' ? 'free' : 'paid';
    await pool.query(
      `UPDATE country_flag_files SET
          design_type = $1::varchar,
          premium_tier = $2::varchar,
          sort_title = COALESCE(NULLIF(trim(sort_title), ''), NULLIF(trim(display_title), ''), NULLIF(trim(title), ''), NULLIF(trim(variant_name), ''), trim($3::text)),
          updated_at = CURRENT_TIMESTAMP
       WHERE id = $4::uuid`,
      [parsed.design_type, premium, stem, row.id],
    );
    n++;
  }
  return n;
}

async function syncRegions(pool: pg.Pool): Promise<void> {
  await pool.query(`
    UPDATE country_flag_files AS f
    SET region = c.region::text,
        updated_at = CURRENT_TIMESTAMP
    FROM countries AS c
    WHERE c.id = f.country_id
      AND (
        f.region IS DISTINCT FROM COALESCE(NULLIF(trim(c.region::text), ''), NULL)
      OR (f.region IS NULL AND c.region IS NOT NULL)
      )
  `);
}

async function syncAvailableFormats(pool: pg.Pool): Promise<void> {
  await pool.query(`
    UPDATE country_flag_files AS f
    SET available_formats = sub.fmts,
        updated_at = CURRENT_TIMESTAMP
    FROM (
      SELECT
        f2.country_id AS cid,
        COALESCE(NULLIF(trim(f2.asset_group_key::text), ''), ('solo:' || f2.id::text)) AS gk,
        ARRAY_AGG(DISTINCT lower(trim(f2.format))) FILTER (
          WHERE NULLIF(trim(f2.format::text), '') IS NOT NULL
            AND lower(trim(f2.format)) NOT IN ('webp')
        ) AS fmts
      FROM country_flag_files f2
      WHERE lower(trim(coalesce(f2.status::text, ''))) = 'published'
      GROUP BY f2.country_id, COALESCE(NULLIF(trim(f2.asset_group_key::text), ''), ('solo:' || f2.id::text))
    ) AS sub
    WHERE f.country_id::uuid = sub.cid::uuid
      AND COALESCE(NULLIF(trim(f.asset_group_key::text), ''), ('solo:' || f.id::text)) = sub.gk
      AND lower(trim(coalesce(f.status::text, ''))) = 'published'
  `);
}

async function applyCoverWinners(pool: pg.Pool): Promise<number> {
  await pool.query(`UPDATE country_flag_files SET is_country_cover = FALSE`);

  /** One winning preview row per country (official_flat + format rank). Never EPS/PDF/AI. */
  const winners = await pool.query<{ wid: string; country_id: string; cover_url: string }>(
    `WITH ranked AS (
       SELECT id AS wid,
              country_id AS cid,
              COALESCE(NULLIF(trim(thumbnail_url::text), ''),
                       NULLIF(trim(preview_url::text), ''),
                       NULLIF(trim(file_url::text), '')) AS cover_url,
              ROW_NUMBER() OVER (
                PARTITION BY country_id
                ORDER BY
                  CASE WHEN lower(trim(COALESCE(design_type, ''))) = 'official_flat' THEN 0 ELSE 1 END,
                  CASE lower(trim(format))
                    WHEN 'webp' THEN 0
                    WHEN 'jpg' THEN 1
                    WHEN 'jpeg' THEN 1
                    WHEN 'png' THEN 2
                    WHEN 'svg' THEN 3
                    ELSE 9
                  END,
                  COALESCE(updated_at, created_at) DESC NULLS LAST
              ) AS rk
       FROM country_flag_files
       WHERE lower(trim(coalesce(status::text, ''))) = 'published'
         AND lower(trim(coalesce(format::text, ''))) IN ('webp', 'jpg', 'jpeg', 'png', 'svg')
         AND COALESCE(
           NULLIF(trim(thumbnail_url::text), ''),
           NULLIF(trim(preview_url::text), ''),
           NULLIF(trim(file_url::text), '')
         ) IS NOT NULL
     )
     SELECT wid, cid::text AS country_id, cover_url
     FROM ranked
     WHERE rk = 1`,
  );

  let n = 0;
  for (const w of winners.rows) {
    await pool.query(`UPDATE country_flag_files SET is_country_cover = TRUE WHERE id = $1::uuid`, [w.wid]);
    await pool.query(
      `UPDATE countries SET cover_image_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2::uuid`,
      [w.cover_url, w.country_id],
    );
    n++;
  }

  await pool.query(`
    UPDATE countries AS c
    SET cover_image_url = fb.cover_url,
        updated_at = CURRENT_TIMESTAMP
    FROM (
      SELECT DISTINCT ON (f.country_id)
        f.country_id AS cid,
        COALESCE(NULLIF(trim(f.thumbnail_url::text), ''),
                 NULLIF(trim(f.preview_url::text), ''),
                 NULLIF(trim(f.file_url::text), '')) AS cover_url
      FROM country_flag_files AS f
      WHERE lower(trim(coalesce(f.status::text, ''))) = 'published'
        AND lower(trim(coalesce(f.format::text, ''))) NOT IN ('eps', 'pdf', 'ai', 'psd')
        AND COALESCE(
          NULLIF(trim(f.thumbnail_url::text), ''),
          NULLIF(trim(f.preview_url::text), ''),
          NULLIF(trim(f.file_url::text), '')
        ) IS NOT NULL
      ORDER BY f.country_id, COALESCE(f.updated_at, f.created_at) DESC NULLS LAST
    ) AS fb
    WHERE c.id = fb.cid
      AND (c.cover_image_url IS NULL OR trim(c.cover_image_url::text) = '')
      AND fb.cover_url IS NOT NULL
      AND trim(fb.cover_url::text) <> ''
  `);

  return n;
}

async function syncCountryAggregates(pool: pg.Pool): Promise<void> {
  await pool.query(`
    WITH dc AS (
      SELECT country_id::uuid AS cid,
             COUNT(DISTINCT COALESCE(
               NULLIF(trim(variant_name::text), ''),
               regexp_replace(lower(trim(file_name::text)), '\\.[^.]+$', '')
             ))::int AS design_n
      FROM country_flag_files
      WHERE lower(trim(coalesce(status::text, ''))) = 'published'
      GROUP BY country_id
    )
    UPDATE countries AS c
    SET asset_count = COALESCE(dc.design_n, 0),
        sort_name = lower(trim(COALESCE(NULLIF(trim(sort_name::text), ''), NULLIF(trim(name::text), '')))),
        updated_at = CURRENT_TIMESTAMP
    FROM dc
    WHERE c.id = dc.cid
  `);

  /** Countries with no published files stay unchanged for asset_count; optional zeroing */
  await pool.query(`
    UPDATE countries AS c
    SET asset_count = 0,
        sort_name = lower(trim(COALESCE(NULLIF(trim(sort_name::text), ''), NULLIF(trim(name::text), '')))),
        updated_at = CURRENT_TIMESTAMP
    WHERE NOT EXISTS (
      SELECT 1 FROM country_flag_files f
      WHERE f.country_id = c.id AND lower(trim(coalesce(f.status::text,'')))='published'
    )
    AND (c.asset_count IS DISTINCT FROM 0)
  `);
}

async function main() {
  const pool = await createScriptPool();
  await verifyScriptDbConnection(pool);
  try {
    const nPub = await publishAllImportedRows(pool);
    console.log(`[backfill:country-folders] published rows: ${nPub}`);
    const nMove = await reconcileCanonicalCountryAssignments(pool);
    console.log(`[backfill:country-folders] reconciled country assignments: ${nMove}`);
    const nCls = await classifyAllRows(pool);
    console.log(`[backfill:country-folders] classified rows: ${nCls}`);
    await syncRegions(pool);
    console.log('[backfill:country-folders] synced file.region from countries.region');
    await syncAvailableFormats(pool);
    console.log('[backfill:country-folders] synced available_formats');
    const nw = await applyCoverWinners(pool);
    console.log(`[backfill:country-folders] updated country covers (${nw} hubs)`);
    await syncCountryAggregates(pool);
    console.log('[backfill:country-folders] synced countries.asset_count + sort_name');
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
