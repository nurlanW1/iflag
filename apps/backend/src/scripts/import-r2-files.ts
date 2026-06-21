/**
 * List Cloudflare R2 objects and upsert rows into Neon `country_flag_files`.
 *
 * Supports arbitrary key layouts — not only `flags/{slug}/...`.
 *
 * Env: DATABASE_URL, CLOUDFLARE_R2_* (see ../storage/r2.ts)
 * Optional: IMPORT_R2_MAX, IMPORT_R2_PREFIX
 *
 * After `npm run build` in apps/backend:
 *   npm run import:r2
 */

import dotenv from 'dotenv';
import { basename, dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import type { R2Config } from '../storage/r2.js';
import { listR2ObjectSummaries, requireR2Config, slugifySegment } from '../storage/r2.js';
import { deriveAssetGroupKeyFromParts, deriveDisplayTitle } from '../lib/asset-group-key.js';
import { classifyFlagDesign } from '../lib/flag-design-classify.js';
import { FLAG_VIDEO_FORMATS } from '../lib/flag-video-formats.js';
import {
  getCanonicalCountryForSlug,
  loadCountrySlugIndex,
  resolveCanonicalCountrySlugWithIndex,
  type CountrySlugIndex,
} from '../lib/resolve-canonical-country-slug.js';
import { createScriptPool, verifyScriptDbConnection } from '../lib/script-db-pool.js';
/** Always load apps/backend/.env (not cwd). Never log env contents. */
const __scriptDir = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__scriptDir, '../../.env') });

const ALLOWED_FORMATS = new Set([
  'png',
  'svg',
  'jpg',
  'jpeg',
  'webp',
  'eps',
  'pdf',
  'ai',
  'psd',
  ...FLAG_VIDEO_FORMATS,
]);

const MIME_BY_EXT: Record<string, string> = {
  png: 'image/png',
  svg: 'image/svg+xml',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  pdf: 'application/pdf',
  eps: 'application/postscript',
  ai: 'application/vnd.adobe.illustrator',
  psd: 'image/vnd.adobe.photoshop',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
};

/** Normalized slug tokens stripped when inferring country from folder/filename text. */
const STOP_WORDS = new Set([
  'flag',
  'flags',
  'vector',
  'sphere',
  'wave',
  'waves',
  'waving',
  'circle',
  'heart',
  'image',
  'images',
  'flagpole',
  'flagpoles',
  'map',
  'converted',
  'folder',
  'round',
  'glossy',
  'national',
  'as',
  'on',
  'of',
  'the',
  'a',
  'an',
  'and',
  'or',
  'for',
  'graphic',
  'graphics',
]);

/** Folder names that should not overwrite a basename-derived country slug. */
const GENERIC_FOLDER_SLUGS = new Set([
  'misc',
  'miscellaneous',
  'uploads',
  'upload',
  'assets',
  'images',
  'img',
  'tmp',
  'temp',
  'exports',
  'export',
  'public',
  'downloads',
  'bucket',
  'stock',
  'catalog',
  'flags',
]);

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

/**
 * Turn free-text (folder or filename stem) into a URL slug token (lowercase, hyphens).
 * Drops decorative words ("flag", "vector", ...) then slugifies remainder.
 */
function deriveCountrySlugFromText(raw: string): string | null {
  let s = raw.trim();
  if (!s) return null;

  /** Underscores / runs of punctuation → breaks so "National_flag_of_Pakistan" tokenizes cleanly. */
  s = s.replace(/[_]+/g, ' ');
  s = s.replace(/[^\p{L}\p{N}\s-]+/gu, ' ');
  const tokens = s
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.replace(/^-+|-+$/g, ''))
    .filter(Boolean);

  const kept = tokens.filter((t) => !STOP_WORDS.has(t));
  if (kept.length === 0) return null;

  const joined = kept.join(' ');
  const slug = slugifySegment(joined, 96);
  if (!slug || slug === 'file') return null;
  return slug;
}

/** Encode each `/` segment for a valid public HTTPS URL while preserving slashes. */
function publicUrlFromR2Key(cfg: R2Config, key: string): string {
  const base = cfg.publicUrlBase.replace(/\/+$/, '');
  const k = key.replace(/^\/+/, '');
  const path = k
    .split('/')
    .filter(Boolean)
    .map((seg) => encodeURIComponent(seg))
    .join('/');
  return `${base}/${path}`;
}

type ParsedKey = {
  countrySlug: string;
  variantFolder: string;
  folderSegments: string[];
  baseStem: string;
  fileSegment: string;
  format: string;
  fileName: string;
  title: string;
  variantName: string;
};

/**
 * Parses R2 keys:
 * - `flags/{slug}/.../{file}`
 * - `Pakistan/File.png`
 * - ` uzbekistan_flag.svg` (bucket root)
 * - `Turkey Flag Sphere Vector.jpg`
 */
function parseObjectKey(objectKey: string): ParsedKey | null {
  const parts = objectKey.split('/').filter(Boolean);
  if (!parts.length) return null;

  const fileSegment = parts[parts.length - 1]!;
  const dirParts = parts.slice(0, -1);

  const extRaw = extname(fileSegment).replace(/^\./, '').toLowerCase();
  const format = normalizeFormat(extRaw);
  if (!format) return null;

  const baseNoExt = basename(fileSegment, extname(fileSegment)).trim();

  /** Legacy structured layout kept for compatibility */
  let countrySlug: string | null = null;
  let variantFolder = '';

  if (dirParts[0]?.toLowerCase() === 'flags' && dirParts.length >= 2) {
    const seg = dirParts[1]!.trim();
    let cs = deriveCountrySlugFromText(seg) ?? slugifySegment(seg, 96);
    if (!cs || cs === 'file') {
      cs = slugifySegment(seg.replace(/[^\p{L}\p{N}-]+/gu, '-'), 96);
    }
    if (!cs || cs === 'file') {
      cs = seg.toLowerCase();
    }
    countrySlug = cs;

    variantFolder = dirParts.length > 2 ? dirParts.slice(2).join('/') : '';
    if (!variantFolder.trim()) variantFolder = '';
  }

  /** Heuristic slug from folders (deepest first), skipping generic directory names */
  let inferredFromPath: string | null = countrySlug;

  if (!inferredFromPath) {
    for (let i = dirParts.length - 1; i >= 0; i--) {
      const segment = dirParts[i]!;
      const candidate =
        deriveCountrySlugFromText(segment) ?? slugifySegment(segment.replace(/[^\p{L}\p{N}_ -]+/gu, ''), 96);
      if (!candidate) continue;

      const cLow = candidate.toLowerCase().replace(/^-+|-+$/g, '');
      if (GENERIC_FOLDER_SLUGS.has(cLow)) continue;

      if (candidate.length >= 2) {
        inferredFromPath = candidate;
        const parentVariant = [...dirParts.slice(0, i), ...dirParts.slice(i + 1)].join('/');
        variantFolder = parentVariant.trim();
        break;
      }
    }
  }

  const fromFileName = deriveCountrySlugFromText(baseNoExt);

  let finalSlug: string | null = inferredFromPath;

  /** Root files or generic parent folders rely on filename; prefer filename slug when folders are unreliable */
  if (dirParts.length === 0) {
    finalSlug = fromFileName ?? null;
  } else if (fromFileName) {
    if (!finalSlug || (GENERIC_FOLDER_SLUGS.has(finalSlug.toLowerCase()) && fromFileName)) {
      finalSlug = fromFileName;
    } else if (fromFileName && finalSlug !== fromFileName) {
      /** If filename confidently names a longer country slug, prefer it when folder was short/noise */
      if (fromFileName.length > finalSlug.length + 3) finalSlug = fromFileName;
    }
  }

  if (!finalSlug && fromFileName) finalSlug = fromFileName;
  if (!finalSlug) return null;

  const slugNorm =
    deriveCountrySlugFromText(finalSlug) ?? slugifySegment(finalSlug.replace(/_/g, ' '), 96) ?? finalSlug.toLowerCase();
  const countrySlugOut = slugNorm.trim().replace(/^-+|-+$/g, '') || slugNorm.toLowerCase();
  if (!countrySlugOut) return null;

  const titleFromFile =
    baseNoExt.replace(/^\d{10,}-/, '').replace(/^\d+-/, '').replace(/[_-]+/g, ' ').trim() ||
    humanizeSlug(countrySlugOut);
  const titleFromVariant = variantFolder.replace(/[-_/]+/g, ' ').trim();
  const titleParts = [titleFromVariant, titleFromFile].filter(Boolean);
  const title = (titleParts.length ? titleParts.join(' — ') : fileSegment).slice(0, 200);
  const variantName = title.slice(0, 100);
  const fileName = fileSegment.slice(0, 255);

  return {
    countrySlug: countrySlugOut.toLowerCase(),
    variantFolder,
    folderSegments: dirParts,
    baseStem: baseNoExt,
    fileSegment,
    format,
    fileName,
    title,
    variantName,
  };
}

async function ensureCountryId(pool: pg.Pool, slug: string): Promise<string | null> {
  const sl = slug.toLowerCase().trim();
  if (!sl) return null;
  const canonical = getCanonicalCountryForSlug(sl);
  const category = 'country';

  const found = await pool.query<{ id: string }>(
    'SELECT id FROM countries WHERE lower(trim(slug)) = lower(trim($1)) LIMIT 1',
    [sl]
  );
  if (found.rows[0]?.id) {
    await pool.query(
      `UPDATE countries
       SET category = $1,
           status = COALESCE(NULLIF(trim(status::text), ''), 'published'),
           published_at = COALESCE(published_at, CURRENT_TIMESTAMP),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2::uuid
         AND (
           lower(trim(COALESCE(category::text, ''))) IS DISTINCT FROM lower(trim($1))
           OR lower(trim(COALESCE(status::text, ''))) IS DISTINCT FROM 'published'
           OR published_at IS NULL
         )`,
      [category, found.rows[0].id],
    );
    return found.rows[0].id;
  }

  const displayName =
    sl === 'us-states' ? 'US States' :
    canonical?.name ||
    humanizeSlug(sl.replace(/[^\p{L}\p{N}\s-]/gu, ' ')).replace(/\s+/g, ' ').trim().slice(0, 250) ||
    humanizeSlug(sl).slice(0, 250);
  const isoAlpha2 = canonical?.code.toUpperCase() ?? null;

  if (canonical) {
    const canonicalMatch = await pool.query<{ id: string }>(
      `SELECT id
       FROM countries
       WHERE lower(trim(COALESCE(iso_alpha_2::text, ''))) = lower(trim($1))
          OR lower(trim(name::text)) = lower(trim($2))
       ORDER BY CASE
         WHEN lower(trim(COALESCE(iso_alpha_2::text, ''))) = lower(trim($1)) THEN 0
         ELSE 1
       END
       LIMIT 1`,
      [canonical.code, canonical.name],
    );
    const existingId = canonicalMatch.rows[0]?.id;
    if (existingId) {
      await pool.query(
        `UPDATE countries
         SET slug = $1,
             name = $2,
             iso_alpha_2 = COALESCE(NULLIF(trim(iso_alpha_2::text), ''), $3),
             category = COALESCE(NULLIF(trim(category::text), ''), $5),
             status = COALESCE(NULLIF(trim(status::text), ''), 'published'),
             published_at = COALESCE(published_at, CURRENT_TIMESTAMP),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4::uuid`,
        [sl, displayName, isoAlpha2, existingId, category],
      );
      return existingId;
    }
  }

  await pool.query(
    `INSERT INTO countries (name, slug, iso_alpha_2, category, status, published_at)
     VALUES ($1, $2, $3, $4, 'published', CURRENT_TIMESTAMP)
     ON CONFLICT (slug) DO NOTHING`,
    [displayName, sl, isoAlpha2, category]
  );

  const sel = await pool.query<{ id: string }>(
    'SELECT id FROM countries WHERE lower(trim(slug)) = lower(trim($1)) LIMIT 1',
    [sl]
  );
  return sel.rows[0]?.id ?? null;
}

const METADATA_JSON = JSON.stringify({ imported_via: 'import-r2-files' });

const MAX_ERROR_LINES = 100;

export async function runR2Import(opts: R2ImportRunOptions = {}): Promise<R2ImportStats> {
  const stats: R2ImportStats = {
    scanned: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  const cfg = requireR2Config();
  if (!opts.pool && !process.env.DATABASE_URL?.trim() && !process.env.DATABASE_POOL_URL?.trim()) {
    throw new Error('DATABASE_URL is required');
  }

  const ownPool = !opts.pool;
  const pool = opts.pool ?? (await createScriptPool());
  if (ownPool) {
    await verifyScriptDbConnection(pool);
  }

  const slugIndex: CountrySlugIndex = await loadCountrySlugIndex(pool);

  type CountryMeta = { region: string | null; iso: string | null; name: string | null };
  const countryMetaCache = new Map<string, CountryMeta>();

  async function cachedCountryMeta(countryUuid: string): Promise<CountryMeta> {
    if (countryMetaCache.has(countryUuid)) return countryMetaCache.get(countryUuid)!;
    const q = await pool.query<{ region: string | null; iso_alpha_2: string | null; name: string | null }>(
      `SELECT region::text AS region,
              NULLIF(trim(iso_alpha_2::text), '') AS iso_alpha_2,
              NULLIF(trim(name::text), '') AS name
       FROM countries WHERE id = $1::uuid LIMIT 1`,
      [countryUuid],
    );
    const meta: CountryMeta = {
      region: q.rows[0]?.region?.trim() || null,
      iso: q.rows[0]?.iso_alpha_2?.trim()?.toUpperCase() || null,
      name: q.rows[0]?.name?.trim() || null,
    };
    countryMetaCache.set(countryUuid, meta);
    return meta;
  }

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
        stats.errors.push(`Unsupported extension or unreadable key: ${obj.key}`);
        if (stats.errors.length > MAX_ERROR_LINES) stats.errors.splice(0, stats.errors.length - MAX_ERROR_LINES);
        continue;
      }

      const countrySlug = resolveCanonicalCountrySlugWithIndex(parsed.countrySlug, slugIndex);
      const countryNameDisp = humanizeSlug(countrySlug);
      const assetGroupKey = deriveAssetGroupKeyFromParts({
        countrySlug,
        folderSegments: parsed.folderSegments,
        fileStemNoExt: parsed.baseStem,
      }).slice(0, 240);
      const displayTitle = deriveDisplayTitle({
        countryName: countryNameDisp,
        fileStemNoExt: parsed.baseStem,
      }).slice(0, 250);

      const { format, fileName, title } = parsed;
      /** Unique per design stem so `unique_country_variant_format` does not drop multi-file imports. */
      const variantName = parsed.baseStem.slice(0, 100) || title.slice(0, 100);
      let countryId: string | null;
      try {
        countryId = await ensureCountryId(pool, countrySlug);
      } catch (e) {
        stats.skipped++;
        const msg = e instanceof Error ? e.message : String(e);
        stats.errors.push(`Country create failed (${countrySlug}): ${msg}`);
        if (stats.errors.length > MAX_ERROR_LINES) stats.errors.splice(0, stats.errors.length - MAX_ERROR_LINES);
        continue;
      }

      if (!countryId) {
        stats.skipped++;
        stats.errors.push(`Could not resolve country slug: ${countrySlug}`);
        if (stats.errors.length > MAX_ERROR_LINES) stats.errors.splice(0, stats.errors.length - MAX_ERROR_LINES);
        continue;
      }

      const fileKey = obj.key.replace(/^\/+/, '');
      const countryMeta = await cachedCountryMeta(countryId);
      const classify = classifyFlagDesign({
        r2Key: fileKey,
        fileStem: parsed.baseStem,
        countrySlug,
        isoAlpha2: countryMeta.iso,
        countryName: countryMeta.name,
        format,
      });
      // Direct R2 imports are the site's owned catalog content; keep them gated as premium.
      const premiumTier = 'paid';
      const designTypeStr = classify.design_type;
      const regionSnap = countryMeta.region;
      const sortTitleValue = displayTitle.slice(0, 250);

      const fileUrl = publicUrlFromR2Key(cfg, fileKey);
      /** Same public URL as primary asset; thumbnails/previews fallback to full file URL when not separate */
      const thumbnailUrl = fileUrl;
      const previewUrl = fileUrl;

      const sizeBytes = Math.max(Number(obj.size) || 0, 1);
      const mime = mimeForFormat(format);

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
              thumbnail_url = $9,
              preview_url = $10,
              country_slug = $11,
              title = $12,
              asset_group_key = $13,
              display_title = $14,
              premium_tier = $15,
              design_type = $16,
              sort_title = COALESCE(NULLIF(trim(sort_title::text), ''), $17),
              region = $18,
              is_country_cover = FALSE,
              status = 'published',
              processing_status = 'completed',
              updated_at = CURRENT_TIMESTAMP
            WHERE file_key = $19`,
            [
              countryId,
              fileName,
              fileKey,
              fileUrl,
              sizeBytes,
              mime,
              format,
              variantName,
              thumbnailUrl,
              previewUrl,
              countrySlug,
              title,
              assetGroupKey,
              displayTitle,
              premiumTier,
              designTypeStr,
              sortTitleValue,
              regionSnap,
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
              processing_status, thumbnail_url, preview_url, country_slug, title,
              asset_group_key, display_title, design_type, sort_title, region, is_country_cover
            ) VALUES (
              $1, $2, $3, $4, $5, 'r2',
              $6, $7, $8, $9, NULL,
              $10, 0, ARRAY[]::text[], $11::jsonb, 'published',
              'completed', $12, $13, $14, $15, $16, $17, $18, $19, $20, FALSE
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
              premiumTier,
              METADATA_JSON,
              thumbnailUrl,
              previewUrl,
              countrySlug,
              title,
              assetGroupKey,
              displayTitle,
              designTypeStr,
              sortTitleValue,
              regionSnap,
            ]
          );
          stats.inserted++;
        }
      } catch (e) {
        const code = typeof e === 'object' && e && 'code' in e ? String((e as { code: string }).code) : '';
        const msg = e instanceof Error ? e.message : String(e);
        stats.skipped++;
        stats.errors.push(`DB error for ${fileKey} (${code}): ${msg}`);
        if (stats.errors.length > MAX_ERROR_LINES) stats.errors.splice(0, stats.errors.length - MAX_ERROR_LINES);
      }
    }
  } finally {
    if (ownPool) await pool.end();
  }

  return stats;
}

function printSummary(stats: R2ImportStats) {
  console.log('[import:r2] scanned', stats.scanned);
  console.log('[import:r2] inserted', stats.inserted);
  console.log('[import:r2] updated', stats.updated);
  console.log('[import:r2] skipped', stats.skipped);
  const errCount = stats.errors.length;
  console.log('[import:r2] errors (count)', errCount);
  if (errCount) {
    console.log('[import:r2] errors (samples):');
    for (const line of stats.errors.slice(-30)) console.log(`  • ${line}`);
  }
}

async function cliMain() {
  const maxObjects = process.env.IMPORT_R2_MAX
    ? Math.max(1, Number(process.env.IMPORT_R2_MAX) || 0)
    : undefined;
  const prefix = process.env.IMPORT_R2_PREFIX?.trim() || undefined;
  const stats = await runR2Import({ maxObjects, prefix });
  printSummary(stats);
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  cliMain().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
