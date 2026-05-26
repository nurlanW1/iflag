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
import { classifyFlagDesign } from '../lib/flag-design-classify.js';

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
};

function stemFromFileName(fn: string): string {
  return basename(fn.trim(), extname(fn.trim()));
}

function r2LikeKey(row: FileRow): string {
  const k = row.file_key?.trim() || row.file_path?.trim() || row.file_name;
  return k;
}

async function classifyAllRows(pool: pg.Pool): Promise<number> {
  const res = await pool.query<FileRow>(
    `SELECT f.id, f.file_name, f.file_key, f.file_path, f.country_id, f.format,
            COALESCE(NULLIF(trim(c.slug), ''), NULLIF(trim(f.country_slug), '')) AS country_slug
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
      format: row.format?.trim() ?? '',
    });
    const premium = parsed.premium_tier === 'free' ? 'free' : 'paid';
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
        AND lower(trim(coalesce(f.format::text, ''))) NOT IN ('eps', 'pdf', 'ai')
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
             COUNT(DISTINCT COALESCE(NULLIF(lower(trim(asset_group_key)), ''), ('solo:' || id::text))) FILTER (
               WHERE lower(trim(coalesce(format::text, ''))) NOT IN ('webp')
             )::int AS design_n
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
  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw new Error('DATABASE_URL is required');

  const pool = new pg.Pool({ connectionString: url });
  try {
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
