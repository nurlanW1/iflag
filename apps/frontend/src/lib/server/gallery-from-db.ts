import type { Pool } from 'pg';
import { getCountryCode } from '@/lib/country-mapping';
import {
  FLAG_THUMB_PLACEHOLDER_DATA_URL,
  flagThumbPlaceholderForFileId,
} from '@/lib/flag-thumbnail-fallback';
import { resolveGalleryDisplayName } from '@/lib/gallery-display-name';
import { isSafePublicFlagObjectPath, resolveGalleryAssetUrl } from '@/lib/server/blob-site-proxy';
import { getPublicR2FileUrl } from '@/lib/server/cloudflare-r2';
import {
  fallbackUrlsForGalleryListThumb,
  resolvedFlagPublicHref,
} from '@/lib/server/flag-asset-url';

/** Gallery/country tiles — canonical API fields (`id`, `thumbnail_url`, `flag_count`) plus legacy `thumbnail`/`count` for browsers. */
export type GalleryCountrySummary = {
  id: string;
  name: string;
  slug: string;
  code: string | null;
  /** Resolved URL for `<img>` (proxied when needed). */
  thumbnail_url: string;
  /** Canonical count label for `/api/gallery/countries`. */
  flag_count: number;
  /** Alias of `thumbnail_url`; kept for existing components. */
  thumbnail: string;
  /** Alias of `flag_count`; kept for existing components. */
  count: number;
};

/** Narrow gallery list — matches `countries.region` / `countries.category` in Postgres. */
export type GalleryCountryListFilters = {
  region?: string | null;
  dbCategory?: 'country' | 'autonomy' | 'organization' | 'historical' | null;
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
};

export function formatToCategory(fmt: string): 'vector' | 'raster' | 'video' {
  const f = fmt.toLowerCase();
  if (f === 'svg' || f === 'eps' || f === 'pdf') return 'vector';
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
      `SELECT COUNT(*)::int AS n FROM country_flag_files
       WHERE lower(trim(coalesce(status::text, ''))) = 'published'
         AND NULLIF(trim(file_url::text), '') IS NOT NULL`,
    );
    const joinedCount = await read(
      `SELECT COUNT(DISTINCT c.id)::int AS n
       FROM countries c
       INNER JOIN country_flag_files f ON f.country_id = c.id
       WHERE lower(trim(coalesce(f.status::text, ''))) = 'published'
         AND NULLIF(trim(f.file_url::text), '') IS NOT NULL`,
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
export async function fetchGalleryCountriesFromDb(
  pool: Pool,
  filters: GalleryCountryListFilters | null = null,
): Promise<GalleryCountrySummary[]> {
  const regionParam = filters?.region?.trim() || null;
  const catParam = filters?.dbCategory?.trim().toLowerCase() || null;

  /**
   * Simple join: only `f.status = 'published'` and `f.file_url IS NOT NULL`.
   * Thumbnail text may be empty — UI uses `file_url` as thumbnail when missing.
   */
  const result = await pool.query<{
    cid: string;
    name: string;
    slug: string;
    iso_alpha_2: string | null;
    flag_count: number | string;
    raw_thumbnail_url: string | null;
    raw_file_url: string | null;
    raw_file_key: string | null;
  }>(
    `SELECT DISTINCT ON (c.id)
       c.id::text AS cid,
       c.name,
       c.slug,
       c.iso_alpha_2,
       agg.cnt AS flag_count,
       NULLIF(trim(f.thumbnail_url::text), '') AS raw_thumbnail_url,
       NULLIF(trim(f.file_url::text), '') AS raw_file_url,
       NULLIF(trim(f.file_key::text), '') AS raw_file_key
     FROM countries c
     INNER JOIN (
       SELECT country_id, COUNT(*)::int AS cnt
       FROM country_flag_files
       WHERE lower(trim(coalesce(status::text, ''))) = 'published'
         AND NULLIF(trim(file_url::text), '') IS NOT NULL
       GROUP BY country_id
     ) agg ON agg.country_id = c.id
     INNER JOIN country_flag_files f ON f.country_id = c.id
       AND lower(trim(coalesce(f.status::text, ''))) = 'published'
       AND NULLIF(trim(f.file_url::text), '') IS NOT NULL
     WHERE ($1::text IS NULL OR lower(trim(coalesce(c.region::text, ''))) = lower(trim($1)))
       AND (
         $2::text IS NULL
         OR lower(trim(coalesce(c.category::text, 'country'))) = lower(trim($2))
       )
     ORDER BY c.id, f.created_at DESC NULLS LAST`,
    [regionParam, catParam],
  );

  const out: GalleryCountrySummary[] = [];
  for (const row of result.rows) {
    const flagCountRaw = row.flag_count;
    const count =
      typeof flagCountRaw === 'string' ? Number.parseInt(flagCountRaw, 10) : Number(flagCountRaw);

    const fileUrlForRow = row.raw_file_url?.trim() || '';
    const thumbStored = row.raw_thumbnail_url?.trim() || '';

    /** If `thumbnail_url` is null/empty, use `file_url` for list display. */
    const effectiveThumbnailUrl = thumbStored || fileUrlForRow || null;
    const effectivePreviewUrl = fileUrlForRow || null;

    const code =
      row.iso_alpha_2?.trim()?.toUpperCase() || getCountryCode(row.name)?.toUpperCase() || null;
    let thumb = resolvedFlagPublicHref({
      fileKey: row.raw_file_key,
      fallbackRawUrls: fallbackUrlsForGalleryListThumb({
        premiumTierRaw: 'free',
        fileUrl: fileUrlForRow || null,
        previewUrl: effectivePreviewUrl,
        thumbnailUrl: effectiveThumbnailUrl,
      }),
    });
    /** DB sometimes stores only object key in `file_url` (no scheme) — build public R2 URL when possible. */
    if (!thumb && fileUrlForRow && !/^https?:\/\//i.test(fileUrlForRow)) {
      const normalizedKey = fileUrlForRow.replace(/^\/+/, '');
      if (isSafePublicFlagObjectPath(normalizedKey)) {
        const built = getPublicR2FileUrl(normalizedKey);
        if (built) thumb = built;
      }
    }
    if (!thumb || isPackFallbackFlagThumbnail(thumb)) {
      thumb = FLAG_THUMB_PLACEHOLDER_DATA_URL;
    }

    const resolvedThumb = resolveGalleryAssetUrl(thumb);
    const n = Number.isFinite(count) ? count : 0;

    out.push({
      id: row.cid,
      name: row.name,
      slug: row.slug,
      code,
      thumbnail_url: resolvedThumb,
      flag_count: n,
      thumbnail: resolvedThumb,
      count: n,
    });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

export type CountryGalleryPayload = {
  country: { name: string; slug: string; code: string | null };
  variants: {
    id: string;
    name: string;
    type: string;
    thumbnail: string;
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
  const cRes = await pool.query<{ id: string; name: string; slug: string; iso_alpha_2: string | null }>(
    'SELECT id, name, slug, iso_alpha_2 FROM countries WHERE lower(slug) = lower($1) LIMIT 1',
    [slug]
  );
  const countryRow = cRes.rows[0];
  if (!countryRow) return null;

  const fRes = await pool.query<FlagFileRow>(
    `SELECT id, file_url, file_name, file_size_bytes::text, format, variant_name, width, height,
            premium_tier, thumbnail_url, preview_url, file_key, storage_provider
     FROM country_flag_files
     WHERE country_id = $1 AND status = 'published'
     ORDER BY variant_name NULLS LAST, format, created_at ASC`,
    [countryRow.id]
  );

  if (fRes.rows.length === 0) return null;

  const iso = countryRow.iso_alpha_2?.trim()?.toUpperCase() || null;
  const mappedCode = iso || getCountryCode(countryRow.name)?.toUpperCase() || null;

  /**
   * Display order: AI → SVG → EPS → JPG → PNG. Anything else falls to the end (e.g. PDF, MP4).
   * Mirrors the 5-slot download grid on the detail page.
   */
  const FORMAT_DISPLAY_ORDER: Record<string, number> = {
    ai: 0,
    svg: 1,
    eps: 2,
    pdf: 2,
    jpg: 3,
    jpeg: 3,
    png: 4,
    webp: 4,
  };

  /** Higher score = better candidate for the variant cover thumbnail (image you can render in `<img>`). */
  function thumbScoreForFormat(fmt: string): number {
    const f = fmt.toLowerCase();
    if (f === 'png') return 5;
    if (f === 'jpg' || f === 'jpeg' || f === 'webp') return 4;
    if (f === 'svg') return 3;
    return 0;
  }

  function variantGroupKey(row: FlagFileRow): string {
    const named = row.variant_name?.trim();
    if (named) return `n:${named.toLowerCase()}`;
    /** Strip extension to merge {name}.png + {name}.jpg + {name}.svg into one design. */
    const base = row.file_name.replace(/\.[^.]+$/, '').trim();
    return `f:${base.toLowerCase()}`;
  }

  type FormatRow = CountryGalleryPayload['variants'][number]['formats'][number];

  type VariantBuilder = {
    id: string;
    name: string;
    type: string;
    thumbnail: string;
    thumbScore: number;
    formats: FormatRow[];
  };

  const builders = new Map<string, VariantBuilder>();
  let variantIdx = 0;

  for (const r of fRes.rows) {
    const nbytes = Number.parseInt(String(r.file_size_bytes), 10);
    const sz = Number.isFinite(nbytes) ? nbytes : 0;
    const ext = formatExtension(r.format);
    const tier = normalizePremiumTier(r.premium_tier);

    const dim =
      r.width && r.height && r.width > 0 && r.height > 0
        ? `${r.width}×${r.height} px`
        : 'Original';

    /** Prefer explicit `preview_url`, then image-capable `file_url`, then thumbnails. */
    const thumbStored = r.thumbnail_url?.trim() || '';
    const previewStored = r.preview_url?.trim() || '';
    const fileUrl = r.file_url?.trim() || '';
    const cascade: string[] = [];
    if (previewStored) {
      cascade.push(previewStored);
    } else if (isImgPreviewableFormat(r.format) && fileUrl) {
      cascade.push(fileUrl);
    } else if (thumbStored) {
      cascade.push(thumbStored);
    } else if (fileUrl) {
      cascade.push(fileUrl);
    }

    let previewUrl = resolvedFlagPublicHref({
      fileKey: r.file_key,
      fallbackRawUrls: cascade,
    });
    if (!previewUrl) {
      previewUrl = flagThumbPlaceholderForFileId(String(r.id));
    }

    /** Always gate file bytes through `/api/download/[id]` — never expose a public direct file URL for client-side grabs. */
    const downloadProtected = true;
    const directDownloadUrl = undefined;

    const formatRow: FormatRow = {
      id: String(r.id),
      format: formatDisplayName(r.format),
      formatCode: ext,
      category: formatToCategory(r.format),
      file: r.file_name,
      url: directDownloadUrl,
      previewUrl,
      premiumTier: tier,
      downloadProtected,
      size: formatFileSize(sz),
      dimensions: dim,
    };

    const key = variantGroupKey(r);
    let builder = builders.get(key);
    if (!builder) {
      const displayName =
        (r.variant_name?.trim() || r.file_name.replace(/\.[^.]+$/, '').trim()) || r.file_name;
      builder = {
        id: `${countryRow.slug}-design-${variantIdx++}`,
        name: truncateDisplayPath(displayName, 96),
        type: 'design',
        thumbnail: '',
        thumbScore: -1,
        formats: [],
      };
      builders.set(key, builder);
    }
    builder.formats.push(formatRow);

    const score = thumbScoreForFormat(r.format);
    if (score > builder.thumbScore) {
      builder.thumbScore = score;
      builder.thumbnail = previewUrl;
    }
  }

  const variants: CountryGalleryPayload['variants'] = Array.from(builders.values()).map((b) => {
    const sortedFormats = [...b.formats].sort((a, c) => {
      const ai = FORMAT_DISPLAY_ORDER[a.formatCode] ?? 9;
      const ci = FORMAT_DISPLAY_ORDER[c.formatCode] ?? 9;
      if (ai !== ci) return ai - ci;
      return a.file.localeCompare(c.file);
    });
    const cover =
      b.thumbnail || sortedFormats[0]?.previewUrl || flagThumbPlaceholderForFileId(b.id);
    return {
      id: b.id,
      name: b.name,
      type: b.type,
      thumbnail: cover,
      formats: sortedFormats,
    };
  });
  variants.sort((a, b) => a.name.localeCompare(b.name));

  return {
    country: {
      name: countryRow.name,
      slug: countryRow.slug,
      code: mappedCode,
    },
    variants,
  };
}
