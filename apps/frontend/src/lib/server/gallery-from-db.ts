import type { Pool } from 'pg';
import { getCountryCode } from '@/lib/country-mapping';
import {
  FLAG_THUMB_PLACEHOLDER_DATA_URL,
  flagThumbPlaceholderForFileId,
} from '@/lib/flag-thumbnail-fallback';
import { resolveGalleryDisplayName } from '@/lib/gallery-display-name';
import { resolveGalleryAssetUrl } from '@/lib/server/blob-site-proxy';
import {
  fallbackUrlsForGalleryListThumb,
  resolvedFlagPublicHref,
} from '@/lib/server/flag-asset-url';
import { freeTierRequiresSignIn } from '@/lib/server/flagswing-download-policy';

export type GalleryCountrySummary = {
  name: string;
  slug: string;
  code: string | null;
  count: number;
  thumbnail: string;
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

  const result = await pool.query<{
    name: string;
    slug: string;
    iso_alpha_2: string | null;
    cnt: string | number;
    thumbnail_file_key: string | null;
    thumbnail_file_url: string | null;
    thumbnail_preview_url: string | null;
    thumbnail_thumb_url: string | null;
    tier_pick: string | null;
  }>(
    `SELECT
       c.name,
       c.slug,
       c.iso_alpha_2,
       COUNT(cff.id)::int AS cnt,
       tn.thumbnail_file_key,
       tn.thumbnail_file_url,
       tn.thumbnail_preview_url,
       tn.thumbnail_thumb_url,
       tn.tier_pick
     FROM countries c
     INNER JOIN country_flag_files cff
       ON cff.country_id = c.id AND cff.status = 'published'
     LEFT JOIN LATERAL (
       SELECT
         NULLIF(trim(f.file_key), '') AS thumbnail_file_key,
         NULLIF(trim(f.file_url), '') AS thumbnail_file_url,
         NULLIF(trim(f.preview_url), '') AS thumbnail_preview_url,
         NULLIF(trim(f.thumbnail_url), '') AS thumbnail_thumb_url,
         lower(coalesce(f.premium_tier, 'free')) AS tier_pick
       FROM country_flag_files f
       WHERE f.country_id = c.id
         AND f.status = 'published'
       ORDER BY
         (NULLIF(trim(f.file_key), '') IS NOT NULL) DESC,
         (lower(trim(coalesce(f.storage_provider, ''))) = 'r2') DESC,
         CASE
           WHEN NULLIF(trim(f.preview_url), '') IS NOT NULL THEN 0
           WHEN NULLIF(trim(f.thumbnail_url), '') IS NOT NULL THEN 1
           WHEN lower(coalesce(f.premium_tier, 'free')) = 'free'
                AND NULLIF(trim(f.file_url), '') IS NOT NULL THEN 2
           ELSE 3
         END ASC,
         f.created_at DESC
       LIMIT 1
     ) tn ON TRUE
     WHERE ($1::text IS NULL OR lower(trim(coalesce(c.region::text, ''))) = lower(trim($1)))
       AND (
         $2::text IS NULL
         OR lower(trim(coalesce(c.category::text, 'country'))) = lower(trim($2))
       )
     GROUP BY c.id, c.name, c.slug, c.iso_alpha_2,
       tn.thumbnail_file_key,
       tn.thumbnail_file_url,
       tn.thumbnail_preview_url,
       tn.thumbnail_thumb_url,
       tn.tier_pick
     ORDER BY c.name ASC`,
    [regionParam, catParam],
  );

  const out: GalleryCountrySummary[] = [];
  for (const row of result.rows) {
    const count =
      typeof row.cnt === 'string' ? Number.parseInt(row.cnt, 10) : Number(row.cnt);
    const code =
      row.iso_alpha_2?.trim()?.toUpperCase() || getCountryCode(row.name)?.toUpperCase() || null;
    let thumb = resolvedFlagPublicHref({
      fileKey: row.thumbnail_file_key,
      fallbackRawUrls: fallbackUrlsForGalleryListThumb({
        premiumTierRaw: row.tier_pick,
        fileUrl: row.thumbnail_file_url,
        previewUrl: row.thumbnail_preview_url,
        thumbnailUrl: row.thumbnail_thumb_url,
      }),
    });
    if (!thumb || isPackFallbackFlagThumbnail(thumb)) {
      thumb = FLAG_THUMB_PLACEHOLDER_DATA_URL;
    }

    out.push({
      name: row.name,
      slug: row.slug,
      code: code || null,
      count: Number.isFinite(count) ? count : 0,
      thumbnail: resolveGalleryAssetUrl(thumb),
    });
  }
  return out;
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

    const signInForFree = freeTierRequiresSignIn();
    const downloadProtected = tier !== 'free' || signInForFree;
    const canonicalFileHref = resolvedFlagPublicHref({
      fileKey: r.file_key,
      fallbackRawUrls: fileUrl ? [fileUrl] : [],
    });
    const directDownloadUrl =
      tier === 'free' && !signInForFree && canonicalFileHref ? canonicalFileHref : undefined;

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
