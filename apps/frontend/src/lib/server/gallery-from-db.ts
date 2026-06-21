import type { Pool } from 'pg';
import { getCountryCode } from '@/lib/country-mapping';
import {
  FLAG_THUMB_PLACEHOLDER_DATA_URL,
  flagThumbPlaceholderForFileId,
} from '@/lib/flag-thumbnail-fallback';
import {
  AUTONOMY_REGIONAL_SLUGS,
  assignContinentToCountryHub,
  normalizeGalleryRegionParam,
} from '@/lib/gallery/country-continent';
import { resolveGalleryDisplayName } from '@/lib/gallery-display-name';
import { slugFromAssetGroupKey } from '@/lib/marketplace/group-flag-products';
import { isSafePublicFlagObjectPath, resolveGalleryAssetUrl } from '@/lib/server/blob-site-proxy';
import { getPublicR2FileUrl } from '@/lib/server/cloudflare-r2';
import { hrefLooksLikeNonBrowserMaster, pickFormatPreviewUrl } from '@/lib/flag-preview-display';
import {
  fallbackUrlsForGalleryListThumb,
  galleryVariantPlaybackCandidates,
  galleryVariantDisplayHref,
  resolvedFlagPublicHref,
} from '@/lib/server/flag-asset-url';
import { isPreviewOnlyFormat } from '@/lib/server/flag-preview-formats';
import { hrefLooksLikeFlagVideo, isFlagVideoFormat, isFlagVideoDesignType } from '@/lib/flag-video-formats';
import { publishedFlagHasMediaSql } from '@/lib/server/gallery-published-media';
import { galleryOptionalColumns, resetGallerySchemaCache } from '@/lib/server/gallery-schema';
import { buildCountryHubDescription } from '@/lib/gallery/country-hub-copy';
import { variantFormatsArePremium } from '@/lib/gallery/flag-preview-watermark';
import { urlLooksLikeWebpAsset } from '@/lib/gallery/country-hub-cover';

import type { GalleryCountrySummary } from '@/types/gallery-country-hub';

export type { GalleryCountrySummary };

/** Narrow gallery list — matches `countries.region` / `countries.category` in Postgres. */
export type GalleryCountryListFilters = {
  region?: string | null;
  dbCategory?: 'country' | 'us-states' | 'autonomy' | 'organization' | 'historical' | 'football' | null;
};

export type GalleryPremiumTier = 'free' | 'freemium' | 'paid';

type FlagFileRow = {
  id: string;
  file_url: string;
  file_name: string;
  file_size_bytes: string;
  format: string;
  variant_name: string | null;
  width: number | null;
  height: number | null;
  premium_tier: string | null;
  thumbnail_url: string | null;
  preview_url: string | null;
  file_key: string | null;
  storage_provider: string | null;
  asset_group_key: string | null;
  display_title: string | null;
  sort_title: string | null;
  design_type: string | null;
};

export function formatToCategory(fmt: string): 'vector' | 'raster' | 'video' {
  const f = fmt.toLowerCase();
  if (isFlagVideoFormat(f)) return 'video';
  if (f === 'svg' || f === 'eps' || f === 'pdf' || f === 'ai') return 'vector';
  if (f === 'psd') return 'raster';
  if (f === 'png' || f === 'jpg' || f === 'jpeg' || f === 'webp') return 'raster';
  return 'raster';
}

function formatDisplayName(fmt: string): string {
  const f = fmt.toLowerCase();
  if (f === 'jpeg' || f === 'jpg') return 'JPG';
  return fmt.toUpperCase();
}

function formatExtension(fmt: string): string {
  const f = fmt.toLowerCase();
  return f === 'jpeg' ? 'jpg' : f;
}

function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return 'Unknown';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function normalizePremiumTier(raw: string | null | undefined): GalleryPremiumTier {
  const t = (raw ?? 'free').toLowerCase();
  if (t === 'freemium' || t === 'paid') return t;
  return 'free';
}

/** Raster + SVG work in <img>; EPS/PDF need a generated thumb. */
function isImgPreviewableFormat(fmt: string): boolean {
  const f = fmt.toLowerCase();
  return ['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(f);
}

export function applyGalleryDisplayNames(rows: GalleryCountrySummary[]): GalleryCountrySummary[] {
  return rows.map((c) => ({
    ...c,
    name: resolveGalleryDisplayName(c.name, c.code, c.slug),
  }));
}

/** Host + DB name only (never password/query). Safe for diagnostic logs. */
export function galleryDbTargetForLogs(databaseUrl?: string | null): string {
  const raw = databaseUrl?.trim();
  if (!raw) return '(no DATABASE_URL)';
  try {
    const normalized = /^postgres(?:ql)?:\/\//i.test(raw) ? raw : `postgresql://${raw}`;
    const u = new URL(normalized.replace(/^postgres:/i, 'postgresql:'));
    const dbSegment = u.pathname.replace(/^\//, '').split('/')[0]?.trim();
    const db = dbSegment && dbSegment.length > 0 ? dbSegment : '(default)';
    const host = u.hostname || '(unknown-host)';
    const port = u.port ? `:${u.port}` : '';
    return `${host}${port}/${db}`;
  } catch {
    return '(DATABASE_URL unparsable)';
  }
}

/** Quick row counts for `/api/gallery/countries` (no secrets). */
export async function logGalleryCountriesStats(pool: Pool): Promise<void> {
  const read = async (sql: string): Promise<number> => {
    const r = await pool.query<{ n: string | number }>(sql);
    const v = r.rows[0]?.n;
    if (v === undefined || v === null) return 0;
    return typeof v === 'string' ? Number.parseInt(String(v), 10) : Number(v);
  };

  try {
    const totalCountries = await read(`SELECT COUNT(*)::int AS n FROM countries`);
    const totalFlagFiles = await read(`SELECT COUNT(*)::int AS n FROM country_flag_files`);
    const totalPublishedFiles = await read(
      `SELECT COUNT(*)::int AS n FROM country_flag_files f
       WHERE lower(trim(coalesce(f.status::text, ''))) = 'published'
         AND ${publishedFlagHasMediaSql('f')}`,
    );
    const joinedCount = await read(
      `SELECT COUNT(DISTINCT c.id)::int AS n
       FROM countries c
       INNER JOIN country_flag_files f ON f.country_id = c.id
       WHERE lower(trim(coalesce(f.status::text, ''))) = 'published'
         AND ${publishedFlagHasMediaSql('f')}`,
    );
    console.log('[gallery/countries] total countries', totalCountries);
    console.log('[gallery/countries] total country_flag_files', totalFlagFiles);
    console.log('[gallery/countries] total published files', totalPublishedFiles);
    console.log('[gallery/countries] joined count', joinedCount);
  } catch (e) {
    console.warn(
      '[gallery/countries] stats query failed',
      e instanceof Error ? e.message : e,
    );
  }
}

/** SVG packs / generic placeholders — not site-upload previews. */
export function isPackFallbackFlagThumbnail(url: string | null | undefined): boolean {
  if (!url?.trim()) return true;
  const u = url.trim().toLowerCase();
  return (
    u.includes('purecatamphetamine.github.io') ||
    u.includes('country-flag-icons/3x2/') ||
    u === '/placeholder-flag.jpg'
  );
}

/**
 * Public gallery: countries with at least one published flag file in Neon (R2 or legacy Blob URLs).
 * List thumbnails avoid exposing paid `file_url` when tier is non-free and there is no
 * `thumbnail_url` — in that case we still list the country and use an inline SVG placeholder so
 * the grid is not silently empty while detail pages resolve previews per-row.
 */
function isMissingColumnPgError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    String((err as { code: string }).code) === '42703'
  );
}

async function fetchGalleryCountriesFromDbOnce(
  pool: Pool,
  filters: GalleryCountryListFilters | null,
): Promise<GalleryCountrySummary[]> {
  const regionParam = filters?.region?.trim() || null;
  const regionNorm = normalizeGalleryRegionParam(regionParam);
  const catParam = filters?.dbCategory?.trim().toLowerCase() || null;
  const schema = await galleryOptionalColumns(pool);

  const countryCoverExpr = schema.countryCoverImageUrl
    ? `NULLIF(trim(c.cover_image_url::text), '')`
    : `NULLIF(trim(c.thumbnail_url::text), '')`;
  const lateralCoverOrder = schema.fileIsCountryCover
    ? `CASE WHEN COALESCE(fx.is_country_cover, FALSE) THEN 0 ELSE 1 END ASC,`
    : '';
  const lateralDesignOrder = schema.fileDesignType
    ? `CASE WHEN lower(trim(COALESCE(fx.design_type::text, ''))) = 'official_flat' THEN 0 ELSE 1 END ASC,`
    : '';
  const countriesOrder = schema.countrySortName
    ? `COALESCE(NULLIF(lower(trim(coalesce(c.sort_name::text, ''))), ''), lower(trim(c.name::text))), c.name ASC`
    : `lower(trim(c.name::text)), c.name ASC`;

  const result = await pool.query<{
    cid: string;
    name: string;
    slug: string;
    iso_alpha_2: string | null;
    stored_region: string | null;
    flag_count: number | string;
    design_count: number | string;
    raw_thumbnail_url: string | null;
    raw_file_url: string | null;
    raw_file_key: string | null;
    hub_cover_hint: string | null;
    country_thumb: string | null;
    country_cover_column: string | null;
    raw_webp_url: string | null;
    raw_webp_preview: string | null;
    raw_webp_thumb: string | null;
    raw_webp_key: string | null;
  }>(
    `SELECT
       c.id::text AS cid,
       c.name,
       c.slug,
       c.iso_alpha_2,
       NULLIF(trim(c.region::text), '') AS stored_region,
       agg.file_cnt AS flag_count,
       agg.design_cnt AS design_count,
       NULLIF(trim(f.thumbnail_url::text), '') AS raw_thumbnail_url,
       NULLIF(trim(COALESCE(f.file_url::text, fx0.file_url::text)), '') AS raw_file_url,
       NULLIF(trim(COALESCE(f.file_key::text, fx0.file_key::text)), '') AS raw_file_key,
       COALESCE(
         NULLIF(trim(f.thumbnail_url::text), ''),
         NULLIF(trim(f.preview_url::text), ''),
         NULLIF(trim(f.file_url::text), ''),
         NULLIF(trim(fx0.thumbnail_url::text), ''),
         NULLIF(trim(fx0.preview_url::text), ''),
         NULLIF(trim(fx0.file_url::text), '')
       ) AS hub_cover_hint,
       NULLIF(trim(c.thumbnail_url::text), '') AS country_thumb,
       ${countryCoverExpr} AS country_cover_column,
       NULLIF(trim(fw.file_url::text), '') AS raw_webp_url,
       NULLIF(trim(fw.preview_url::text), '') AS raw_webp_preview,
       NULLIF(trim(fw.thumbnail_url::text), '') AS raw_webp_thumb,
       NULLIF(trim(fw.file_key::text), '') AS raw_webp_key
     FROM countries c
     INNER JOIN (
       SELECT
         country_id,
         COUNT(*)::int AS file_cnt,
         COUNT(DISTINCT COALESCE(
           NULLIF(trim(variant_name::text), ''),
           regexp_replace(lower(trim(file_name::text)), '\\.[^.]+$', '')
         ))::int AS design_cnt
       FROM country_flag_files
       WHERE lower(trim(coalesce(status::text, ''))) = 'published'
         AND ${publishedFlagHasMediaSql('country_flag_files')}
       GROUP BY country_id
     ) agg ON agg.country_id = c.id
     LEFT JOIN LATERAL (
       SELECT thumbnail_url, preview_url, file_url, file_key
       FROM country_flag_files fx
       WHERE fx.country_id = c.id
         AND lower(trim(coalesce(fx.status::text, ''))) = 'published'
         AND lower(trim(coalesce(fx.format::text, ''))) IN ('webp', 'jpg', 'jpeg', 'png', 'svg')
         AND COALESCE(
           NULLIF(trim(fx.thumbnail_url::text), ''),
           NULLIF(trim(fx.preview_url::text), ''),
           NULLIF(trim(fx.file_url::text), '')
         ) IS NOT NULL
       ORDER BY
         ${lateralCoverOrder}
         ${lateralDesignOrder}
         CASE lower(trim(fx.format::text))
           WHEN 'webp' THEN 0
           WHEN 'jpg' THEN 1
           WHEN 'jpeg' THEN 1
           WHEN 'png' THEN 2
           WHEN 'svg' THEN 3
           ELSE 9
         END ASC,
         COALESCE(fx.updated_at, fx.created_at) DESC NULLS LAST
       LIMIT 1
     ) f ON TRUE
     LEFT JOIN LATERAL (
       SELECT thumbnail_url, preview_url, file_url, file_key
       FROM country_flag_files fw
       WHERE fw.country_id = c.id
         AND lower(trim(coalesce(fw.status::text, ''))) = 'published'
         AND lower(trim(coalesce(fw.format::text, ''))) = 'webp'
         AND ${publishedFlagHasMediaSql('fw')}
       ORDER BY COALESCE(fw.updated_at, fw.created_at) DESC NULLS LAST
       LIMIT 1
     ) fw ON TRUE
     LEFT JOIN LATERAL (
       SELECT thumbnail_url, preview_url, file_url, file_key
       FROM country_flag_files fy
       WHERE fy.country_id = c.id
         AND lower(trim(coalesce(fy.status::text, ''))) = 'published'
       ORDER BY COALESCE(fy.updated_at, fy.created_at) DESC NULLS LAST
       LIMIT 1
     ) fx0 ON TRUE
     WHERE (
         $1::text IS NULL
         OR lower(trim(coalesce(c.category::text, 'country'))) = lower(trim($1))
         OR (
           lower(trim($1)) = 'autonomy'
           AND lower(trim(c.slug::text)) = ANY($2::text[])
         )
         OR (
           lower(trim($1)) = 'us-states'
           AND lower(trim(c.slug::text)) IN (
             'us-states',
             'us-state',
             'usstates',
             'usstate',
             'use-states',
             'use-state',
             'usestates',
             'usestate',
             'usa-states',
             'usa-state',
             'usastates',
             'usastate',
             'u-s-states',
             'united-states-states',
             'american-states'
           )
         )
       )
     ORDER BY ${countriesOrder}`,
    [catParam, [...AUTONOMY_REGIONAL_SLUGS]],
  );

  const out: GalleryCountrySummary[] = [];
  for (const row of result.rows) {
    const flagCountRaw = row.flag_count;
    const count =
      typeof flagCountRaw === 'string' ? Number.parseInt(flagCountRaw, 10) : Number(flagCountRaw);

    const designRaw = row.design_count;
    const designs =
      typeof designRaw === 'string' ? Number.parseInt(String(designRaw), 10) : Number(designRaw);

    const coverPick = row.country_cover_column?.trim() || '';

    const code =
      row.iso_alpha_2?.trim()?.toUpperCase() || getCountryCode(row.name)?.toUpperCase() || null;

    let webpHref = resolvedFlagPublicHref({
      fileKey: row.raw_webp_key,
      fallbackRawUrls: [
        row.raw_webp_preview,
        row.raw_webp_thumb,
        row.raw_webp_url,
      ],
    });
    if (!webpHref && coverPick && urlLooksLikeWebpAsset(coverPick)) {
      webpHref = resolveGalleryAssetUrl(coverPick);
    }
    if (webpHref && isPackFallbackFlagThumbnail(webpHref)) {
      webpHref = '';
    }
    const hasWebp = Boolean(webpHref?.trim());
    const webpCover = hasWebp ? resolveGalleryAssetUrl(webpHref) : null;

    let fallbackCover = '';
    if (!webpCover) {
      const rawFallback = resolvedFlagPublicHref({
        fileKey: row.raw_file_key,
        fallbackRawUrls: [
          row.hub_cover_hint,
          row.raw_thumbnail_url,
          row.raw_file_url,
          row.country_cover_column,
          row.country_thumb,
        ],
      });
      if (rawFallback && !isPackFallbackFlagThumbnail(rawFallback)) {
        fallbackCover = resolveGalleryAssetUrl(rawFallback);
      }
    }

    const n = Number.isFinite(count) ? count : 0;
    const d = Number.isFinite(designs) ? designs : 0;

    out.push(
      assignContinentToCountryHub(
        {
          id: row.cid,
          name: row.name,
          slug: row.slug,
          code,
          has_webp_cover: hasWebp,
          webp_cover_url: webpCover,
          thumbnail_url: webpCover ?? fallbackCover,
          thumbnail: webpCover ?? fallbackCover,
          flag_count: n,
          design_count: d || n,
          count: n,
        },
        row.stored_region,
      ),
    );
  }

  if (!regionNorm) return out;

  return out.filter((c) => c.continent === regionNorm);
}

export async function fetchGalleryCountriesFromDb(
  pool: Pool,
  filters: GalleryCountryListFilters | null = null,
): Promise<GalleryCountrySummary[]> {
  try {
    return await fetchGalleryCountriesFromDbOnce(pool, filters);
  } catch (err) {
    if (!isMissingColumnPgError(err)) throw err;
    console.warn(
      '[gallery/countries] optional column missing — retrying with legacy SQL',
      err instanceof Error ? err.message : err,
    );
    resetGallerySchemaCache();
    return fetchGalleryCountriesFromDbOnce(pool, filters);
  }
}

export type CountryGalleryPayload = {
  country: {
    name: string;
    slug: string;
    code: string | null;
    region: string | null;
    description: string;
    cover_image_url: string | null;
    has_webp_cover: boolean;
    webp_cover_url: string | null;
    file_count: number;
    design_count: number;
  };
  variants: {
    id: string;
    /** Canonical marketplace detail slug (`/assets/[slug]`). */
    productSlug: string;
    name: string;
    type: string;
    thumbnail: string;
    isPremiumDesign: boolean;
    formats: {
      id: string;
      format: string;
      formatCode: string;
      category: 'vector' | 'raster' | 'video';
      file: string;
      /**
       * Legacy disk-only gallery (`flag_stock`). Never set for Neon `country_flag_files` rows —
       * use `previewUrl` + protected download.
       */
      url?: string;
      /** Safe image for <img>; prefers `thumbnail_url`, else public `file_url` for raster/SVG tiers. EPS/PDF need `thumbnail_url`. */
      previewUrl: string;
      premiumTier: GalleryPremiumTier;
      /** When true, downloads must use `/api/download/[id]` (Clerk + plan gate). */
      downloadProtected: boolean;
      size: string;
      dimensions: string;
    }[];
  }[];
};

function truncateDisplayPath(name: string, max = 80): string {
  const t = name.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export async function fetchCountryGalleryFromDb(pool: Pool, slug: string): Promise<CountryGalleryPayload | null> {
  try {
    return await fetchCountryGalleryFromDbOnce(pool, slug);
  } catch (err) {
    if (!isMissingColumnPgError(err)) throw err;
    console.warn(
      '[gallery/country] optional column missing — retrying with legacy SQL',
      err instanceof Error ? err.message : err,
    );
    resetGallerySchemaCache();
    return fetchCountryGalleryFromDbOnce(pool, slug);
  }
}

async function fetchCountryGalleryFromDbOnce(pool: Pool, slug: string): Promise<CountryGalleryPayload | null> {
  const schema = await galleryOptionalColumns(pool);
  const countryCoverSelect = schema.countryCoverImageUrl
    ? `NULLIF(trim(cover_image_url::text), '') AS cover_image_url,`
    : `NULL::text AS cover_image_url,`;
  const fileExtraSelect = [
    schema.fileSortTitle ? 'sort_title' : null,
    schema.fileDesignType ? 'design_type' : null,
  ]
    .filter(Boolean)
    .join(', ');
  const fileExtraComma = fileExtraSelect ? `, ${fileExtraSelect}` : '';
  const fileOrderBy = schema.fileSortTitle
    ? `COALESCE(NULLIF(trim(sort_title::text), ''), NULLIF(trim(display_title::text), ''), variant_name::text)`
    : `COALESCE(NULLIF(trim(display_title::text), ''), NULLIF(trim(variant_name::text), ''), file_name::text)`;

  const cRes = await pool.query<{
    id: string;
    name: string;
    slug: string;
    iso_alpha_2: string | null;
    region: string | null;
    description: string | null;
    cover_image_url: string | null;
    thumbnail_url: string | null;
  }>(
    `SELECT id, name, slug, iso_alpha_2,
            NULLIF(trim(region::text), '') AS region,
            NULLIF(trim(description::text), '') AS description,
            ${countryCoverSelect}
            NULLIF(trim(thumbnail_url::text), '') AS thumbnail_url
     FROM countries WHERE lower(slug) = lower($1) LIMIT 1`,
    [slug],
  );
  const countryRow = cRes.rows[0];
  if (!countryRow) return null;

  const fRes = await pool.query<FlagFileRow>(
    `SELECT id, file_url, file_name, file_size_bytes::text, format, variant_name, width, height,
            premium_tier, thumbnail_url, preview_url, file_key, storage_provider,
            asset_group_key, display_title${fileExtraComma}
     FROM country_flag_files cff
     WHERE lower(trim(coalesce(cff.status::text, ''))) = 'published'
       AND (
         cff.country_id = $1::uuid
         OR lower(trim(coalesce(cff.country_slug, ''))) = lower(trim($2))
       )
     ORDER BY ${fileOrderBy},
              format NULLS LAST, created_at ASC`,
    [countryRow.id, countryRow.slug],
  );

  if (fRes.rows.length === 0) return null;

  const iso = countryRow.iso_alpha_2?.trim()?.toUpperCase() || null;
  const mappedCode = iso || getCountryCode(countryRow.name)?.toUpperCase() || null;

  const FORMAT_DISPLAY_ORDER: Record<string, number> = {
    ai: 0,
    svg: 1,
    eps: 2,
    pdf: 2,
    jpg: 3,
    jpeg: 3,
    png: 4,
    webp: 4,
    mp4: 5,
    webm: 5,
    mov: 5,
  };

  function thumbScoreForFormat(fmt: string): number {
    const f = fmt.toLowerCase();
    if (f === 'webp') return 6;
    if (f === 'png') return 5;
    if (f === 'jpg' || f === 'jpeg') return 4;
    if (f === 'svg') return 3;
    if (isFlagVideoFormat(f)) return 2;
    return 0;
  }

  function isUnresolvedThumb(url: string): boolean {
    const u = url.trim();
    return !u || u.startsWith('data:image/svg+xml') || isPackFallbackFlagThumbnail(u);
  }

  function pickCountryVariantCover(
    sortedFormats: FormatRow[],
    designWebp: string | undefined,
    folderWebp: string,
    variantId: string,
  ): string {
    const fallbacks = [designWebp, folderWebp].filter((u): u is string => {
      const s = u?.trim() ?? '';
      return Boolean(s) && !isUnresolvedThumb(s) && !hrefLooksLikeNonBrowserMaster(s);
    });
    const picked = pickFormatPreviewUrl(
      sortedFormats.map((f) => ({
        format: f.formatCode,
        formatCode: f.formatCode,
        previewUrl: f.previewUrl,
      })),
      fallbacks,
    );
    if (picked) return picked;
    const video = sortedFormats
      .map((f) => f.previewUrl)
      .find((u) => u && hrefLooksLikeFlagVideo(u));
    if (video) return video;
    return flagThumbPlaceholderForFileId(variantId);
  }

  function variantDisplayType(builderType: string, sortedFormats: FormatRow[]): string {
    if (isFlagVideoDesignType(builderType)) return 'video';
    const hasVideo = sortedFormats.some((f) => f.category === 'video');
    const hasStill =
      sortedFormats.some((f) => f.category === 'raster' || f.category === 'vector') ||
      sortedFormats.some((f) => !hrefLooksLikeFlagVideo(f.previewUrl));
    if (hasVideo && !hasStill) return 'video';
    return builderType.replace(/_/g, ' ') || 'design';
  }

  function variantGroupKey(row: FlagFileRow): string {
    const named = row.variant_name?.trim();
    if (named) return `n:${named.toLowerCase()}`;
    const base = row.file_name.replace(/\.[^.]+$/, '').trim();
    return `f:${base.toLowerCase()}`;
  }

  /** Group by asset design key; fall back to filename stem. */
  function designBucketKey(row: FlagFileRow): string {
    const ag = row.asset_group_key?.trim();
    if (ag) return `ag:${ag.toLowerCase()}`;
    return variantGroupKey(row);
  }

  type FormatRow = CountryGalleryPayload['variants'][number]['formats'][number];

  type VariantBuilder = {
    id: string;
    productSlug: string;
    name: string;
    type: string;
    thumbnail: string;
    thumbScore: number;
    formats: FormatRow[];
  };

  const builders = new Map<string, VariantBuilder>();
  let variantIdx = 0;

  function displayNameForRow(r: FlagFileRow): string {
    return (
      r.display_title?.trim() ||
      r.sort_title?.trim() ||
      r.variant_name?.trim() ||
      r.file_name.replace(/\.[^.]+$/, '').trim() ||
      r.file_name
    );
  }

  function previewUrlForFlagRow(r: FlagFileRow): string {
    return galleryVariantDisplayHref({
      format: r.format,
      premiumTierRaw: r.premium_tier,
      fileKey: r.file_key,
      fileUrl: r.file_url,
      previewUrl: r.preview_url,
      thumbnailUrl: r.thumbnail_url,
    });
  }

  const webpThumbByDesign = new Map<string, string>();
  let folderWebpThumb = '';
  for (const r of fRes.rows) {
    if (r.format?.trim().toLowerCase() !== 'webp') continue;
    const u = previewUrlForFlagRow(r);
    if (!u || isUnresolvedThumb(u)) continue;
    webpThumbByDesign.set(designBucketKey(r), u);
    if (!folderWebpThumb) folderWebpThumb = u;
  }

  for (const r of fRes.rows) {
    const previewOnly = isPreviewOnlyFormat(r.format);
    if (previewOnly) continue;

    const previewUrl = previewUrlForFlagRow(r);

    const key = designBucketKey(r);
    let builder = builders.get(key);
    const agTrim = r.asset_group_key?.trim();

    if (!builder) {
      builder = {
        id: `${countryRow.slug}-design-${variantIdx++}`,
        productSlug: agTrim ? slugFromAssetGroupKey(agTrim) : `nf-${r.id}`,
        name: truncateDisplayPath(displayNameForRow(r), 96),
        type: String(r.design_type ?? 'design'),
        thumbnail: '',
        thumbScore: -1,
        formats: [],
      };
      builders.set(key, builder);
    }

    const nbytes = Number.parseInt(String(r.file_size_bytes), 10);
    const sz = Number.isFinite(nbytes) ? nbytes : 0;
    const ext = formatExtension(r.format);
    const tier = normalizePremiumTier(r.premium_tier);

    const dim =
      isFlagVideoFormat(r.format)
        ? 'Video'
        : r.width && r.height && r.width > 0 && r.height > 0
          ? `${r.width}×${r.height} px`
          : 'Original';

    const downloadProtected =
      previewOnly || String(r.premium_tier ?? 'free').trim().toLowerCase() !== 'free';

    builder.formats.push({
      id: String(r.id),
      format: formatDisplayName(r.format),
      formatCode: ext,
      category: formatToCategory(r.format),
      file: r.file_name,
      url: undefined,
      previewUrl,
      premiumTier: previewOnly ? 'paid' : tier,
      downloadProtected,
      size: formatFileSize(sz),
      dimensions: dim,
    });

    const score = thumbScoreForFormat(r.format);
    const thumbOk =
      previewUrl &&
      !isUnresolvedThumb(previewUrl) &&
      !hrefLooksLikeNonBrowserMaster(previewUrl);
    if (thumbOk && score > builder.thumbScore) {
      builder.thumbScore = score;
      builder.thumbnail = previewUrl;
    } else if (
      isFlagVideoFormat(r.format) &&
      previewUrl &&
      !builder.formats.some((f) => f.category === 'raster' || f.category === 'vector')
    ) {
      builder.thumbnail = previewUrl;
    }
  }

  for (const [bucketKey, builder] of builders) {
    if (builder.thumbnail && !isUnresolvedThumb(builder.thumbnail)) continue;
    const webp = webpThumbByDesign.get(bucketKey);
    if (webp) {
      builder.thumbnail = webp;
      builder.thumbScore = Math.max(builder.thumbScore, thumbScoreForFormat('webp'));
    }
  }

  const variants: CountryGalleryPayload['variants'] = Array.from(builders.entries())
    .filter(([, b]) => b.formats.length > 0)
    .map(([bucketKey, b]) => {
    const sortedFormats = [...b.formats].sort((a, c) => {
      const ai = FORMAT_DISPLAY_ORDER[a.formatCode] ?? 9;
      const ci = FORMAT_DISPLAY_ORDER[c.formatCode] ?? 9;
      if (ai !== ci) return ai - ci;
      return a.file.localeCompare(c.file);
    });
    const cover = pickCountryVariantCover(
      sortedFormats,
      webpThumbByDesign.get(bucketKey),
      folderWebpThumb,
      b.id,
    );
    return {
      id: b.id,
      productSlug: b.productSlug,
      name: b.name,
      type: variantDisplayType(b.type, sortedFormats),
      thumbnail: cover,
      isPremiumDesign: variantFormatsArePremium(sortedFormats),
      formats: sortedFormats,
    };
  });
  variants.sort((a, b) => a.name.localeCompare(b.name));

  let rawHubCover =
    countryRow.cover_image_url?.trim() || countryRow.thumbnail_url?.trim() || variants[0]?.thumbnail || '';

  let resolvedHub = rawHubCover
    ? resolvedFlagPublicHref({
        fallbackRawUrls: [rawHubCover],
      })
    : '';
  if (!resolvedHub && rawHubCover && !/^https?:\/\//i.test(rawHubCover)) {
    const normalizedKey = rawHubCover.replace(/^\/+/, '');
    if (isSafePublicFlagObjectPath(normalizedKey)) {
      const built = getPublicR2FileUrl(normalizedKey);
      if (built) resolvedHub = built;
    }
  }
  const coverPayload = resolvedHub ? resolveGalleryAssetUrl(resolvedHub) : null;

  const webpRow = fRes.rows.find((r) => r.format?.trim().toLowerCase() === 'webp');
  let webpCoverUrl = webpRow ? previewUrlForFlagRow(webpRow) : '';
  if (webpCoverUrl && isPackFallbackFlagThumbnail(webpCoverUrl)) {
    webpCoverUrl = '';
  }
  if (!webpCoverUrl && coverPayload && urlLooksLikeWebpAsset(coverPayload)) {
    webpCoverUrl = coverPayload;
  }
  const hasWebp = Boolean(webpCoverUrl?.trim());

  const fileCount = fRes.rows.length;
  const designCount = variants.length;
  const region = countryRow.region?.trim() || null;

  return {
    country: {
      name: countryRow.name,
      slug: countryRow.slug,
      code: mappedCode,
      region,
      description: buildCountryHubDescription({
        name: countryRow.name,
        slug: countryRow.slug,
        isoCode: mappedCode,
        region,
        dbDescription: countryRow.description,
        designCount,
        fileCount,
      }),
      cover_image_url: hasWebp ? webpCoverUrl : coverPayload,
      has_webp_cover: hasWebp,
      webp_cover_url: hasWebp ? webpCoverUrl : null,
      file_count: fileCount,
      design_count: designCount,
    },
    variants,
  };
}
