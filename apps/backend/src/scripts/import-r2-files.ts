/**
 * List Cloudflare R2 objects and upsert rows into Neon `country_flag_files`.
 *
 * Env: DATABASE_URL, CLOUDFLARE_R2_* (see ../storage/r2.ts)
 * Optional: IMPORT_R2_MAX, IMPORT_R2_PREFIX
 *
 * After `npm run build` in apps/backend:
 *   npm run import:r2
 */

import 'dotenv/config';
import { basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { getPublicR2Url, listR2ObjectSummaries, requireR2Config } from '../storage/r2.js';

const ALLOWED_FORMATS = new Set(['png', 'svg', 'jpg', 'jpeg', 'webp', 'eps', 'pdf']);

const MIME_BY_EXT: Record<string, string> = {
  png: 'image/png',
  svg: 'image/svg+xml',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  pdf: 'application/pdf',
  eps: 'application/postscript',
};

export type R2ImportStats = {
  scanned: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: string[];
};

export type R2ImportRunOptions = {
  /** Stop after this many R2 objects (pagination cap). */
  maxObjects?: number;
  /** S3 list prefix, e.g. `flags/`. */
  prefix?: string;
  /** Use app pool when called from Express; otherwise script opens its own pool. */
  pool?: pg.Pool;
};

function humanizeSlug(slug: string): string {
  return slug
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function normalizeFormat(extRaw: string): string | null {
  const e = extRaw.toLowerCase();
  if (e === 'jpe') return 'jpeg';
  if (!ALLOWED_FORMATS.has(e)) return null;
  return e;
}

function mimeForFormat(format: string): string {
  return MIME_BY_EXT[format] ?? 'application/octet-stream';
}

type ParsedKey = {
  countrySlug: string | null;
  variantFolder: string;
  fileSegment: string;
  format: string;
  fileName: string;
  title: string;
  variantName: string;
};

function parseObjectKey(key: string): ParsedKey | null {
  const parts = key.split('/').filter(Boolean);
  let countrySlug: string | null = null;
  let variantFolder = '';
  let fileSegment = basename(key);

  if (parts[0] === 'flags') {
    if (parts.length >= 4) {
      countrySlug = parts[1]!.toLowerCase();
      variantFolder = parts[2]!;
      fileSegment = parts[parts.length - 1]!;
    } else if (parts.length === 3) {
      /** `flags/{countrySlug}/{file.ext}` — no variant folder segment */
      countrySlug = parts[1]!.toLowerCase();
      variantFolder = '';
      fileSegment = parts[2]!;
    }
  }

  const ext = extname(fileSegment).replace(/^\./, '').toLowerCase();
  const format = normalizeFormat(ext);
  if (!format) return null;

  const baseNoExt = basename(fileSegment, extname(fileSegment));
  const titleFromFile =
    baseNoExt
      .replace(/^\d{10,}-/, '')
      .replace(/^\d+-/, '')
      .replace(/-/g, ' ')
      .trim() || baseNoExt;
  const titleFromVariant = variantFolder.replace(/-/g, ' ').trim();

  const titleParts = [titleFromVariant, titleFromFile].filter(Boolean);
  const title = (titleParts.length ? titleParts.join(' — ') : fileSegment).slice(0, 200);
  const variantName = title.slice(0, 100);
  const fileName = fileSegment.slice(0, 255);

  return {
    countrySlug,
    variantFolder,
    fileSegment,
    format,
    fileName,
    title,
    variantName,
  };
}

async function resolveCountryId(pool: pg.Pool, slug: string): Promise<string | null> {
  const found = await pool.query<{ id: string }>(
    'SELECT id FROM countries WHERE lower(slug) = lower($1) LIMIT 1',
    [slug]
  );
  if (found.rows[0]?.id) return found.rows[0].id;

  const name = humanizeSlug(slug);
  const ins = await pool.query<{ id: string }>(
    `INSERT INTO countries (name, slug, category, status)
     VALUES ($1, $2, 'country', 'draft')
     RETURNING id`,
    [name, slug.toLowerCase()]
  );
  return ins.rows[0]?.id ?? null;
}

const METADATA_JSON = JSON.stringify({ imported_via: 'import-r2-files' });

export async function runR2Import(opts: R2ImportRunOptions = {}): Promise<R2ImportStats> {
  const stats: R2ImportStats = {
    scanned: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  const cfg = requireR2Config();
  const url = process.env.DATABASE_URL?.trim();
  if (!url && !opts.pool) {
    throw new Error('DATABASE_URL is required');
  }

  const ownPool = !opts.pool;
  const pool = opts.pool ?? new pg.Pool({ connectionString: url });

  try {
    const summaries = await listR2ObjectSummaries(cfg, {
      prefix: opts.prefix,
      maxObjects: opts.maxObjects,
    });

    for (const obj of summaries) {
      stats.scanned++;
      const parsed = parseObjectKey(obj.key);
      if (!parsed) {
        stats.skipped++;
        continue;
      }

      const { countrySlug, format, fileName, title, variantName } = parsed;
      if (!countrySlug) {
        stats.skipped++;
        stats.errors.push(`No country slug in key (expected flags/{{slug}}/...): ${obj.key}`);
        continue;
      }

      let countryId: string | null;
      try {
        countryId = await resolveCountryId(pool, countrySlug);
      } catch (e) {
        stats.skipped++;
        stats.errors.push(`Country resolve failed for ${countrySlug}: ${String(e)}`);
        continue;
      }
      if (!countryId) {
        stats.skipped++;
        stats.errors.push(`Could not resolve country: ${countrySlug}`);
        continue;
      }

      const fileKey = obj.key.replace(/^\/+/, '');
      const fileUrl = getPublicR2Url(cfg, fileKey);
      const sizeBytes = Math.max(Number(obj.size) || 0, 1);
      const mime = mimeForFormat(format);
      const imgLike = ['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(format);
      const previewUrl = imgLike ? fileUrl : null;
      const thumbUrl = previewUrl;

      const existing = await pool.query<{ id: string }>(
        'SELECT id FROM country_flag_files WHERE file_key = $1 LIMIT 1',
        [fileKey]
      );

      try {
        if (existing.rows[0]) {
          await pool.query(
            `UPDATE country_flag_files SET
              country_id = $1,
              file_name = $2,
              file_path = $3,
              file_url = $4,
              file_size_bytes = $5,
              mime_type = $6,
              format = $7,
              variant_name = $8,
              storage_provider = 'r2',
              preview_url = COALESCE($9::text, preview_url),
              thumbnail_url = COALESCE($10::text, thumbnail_url),
              country_slug = $11,
              title = $12,
              updated_at = CURRENT_TIMESTAMP
            WHERE file_key = $13`,
            [
              countryId,
              fileName,
              fileKey,
              fileUrl,
              sizeBytes,
              mime,
              format,
              variantName,
              previewUrl,
              thumbUrl,
              countrySlug,
              title,
              fileKey,
            ]
          );
          stats.updated++;
        } else {
          await pool.query(
            `INSERT INTO country_flag_files (
              country_id, file_name, file_path, file_url, file_key, storage_provider,
              file_size_bytes, mime_type, format, variant_name, ratio,
              premium_tier, price_cents, tags, metadata, status,
              processing_status, thumbnail_url, preview_url, country_slug, title
            ) VALUES (
              $1, $2, $3, $4, $5, 'r2',
              $6, $7, $8, $9, NULL,
              'free', 0, ARRAY[]::text[], $10::jsonb, 'published',
              'completed', $11, $12, $13, $14
            )`,
            [
              countryId,
              fileName,
              fileKey,
              fileUrl,
              fileKey,
              sizeBytes,
              mime,
              format,
              variantName,
              METADATA_JSON,
              thumbUrl,
              previewUrl,
              countrySlug,
              title,
            ]
          );
          stats.inserted++;
        }
      } catch (e) {
        const code = typeof e === 'object' && e && 'code' in e ? String((e as { code: string }).code) : '';
        const msg = e instanceof Error ? e.message : String(e);
        stats.skipped++;
        stats.errors.push(`DB error for ${fileKey} (${code}): ${msg}`);
      }
    }
  } finally {
    if (ownPool) await pool.end();
  }

  return stats;
}

async function cliMain() {
  const maxObjects = process.env.IMPORT_R2_MAX
    ? Math.max(1, Number(process.env.IMPORT_R2_MAX) || 0)
    : undefined;
  const prefix = process.env.IMPORT_R2_PREFIX?.trim() || undefined;
  const stats = await runR2Import({ maxObjects, prefix });
  console.log(JSON.stringify(stats, null, 2));
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  cliMain().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
