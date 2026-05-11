import type { Pool } from 'pg';
import { getCountryCode } from '@/lib/country-mapping';
import { FLAG_THUMB_PLACEHOLDER_DATA_URL } from '@/lib/flag-thumbnail-fallback';
import { resolveGalleryDisplayName } from '@/lib/gallery-display-name';

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
 * Public gallery: countries with at least one published flag file on Blob/DB.
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
    thumbnail_url: string | null;
  }>(
    `SELECT
       c.name,
       c.slug,
       c.iso_alpha_2,
       COUNT(cff.id)::int AS cnt,
       (
         SELECT
           CASE
             WHEN NULLIF(trim(f.thumbnail_url), '') IS NOT NULL THEN trim(f.thumbnail_url)
             WHEN lower(coalesce(f.premium_tier, 'free')) = 'free'
                  AND NULLIF(trim(f.file_url), '') IS NOT NULL THEN trim(f.file_url)
             ELSE NULL
           END
         FROM country_flag_files f
         WHERE f.country_id = c.id
           AND f.status = 'published'
         ORDER BY
           CASE
             WHEN NULLIF(trim(f.thumbnail_url), '') IS NOT NULL THEN 0
             WHEN lower(coalesce(f.premium_tier, 'free')) = 'free'
                  AND NULLIF(trim(f.file_url), '') IS NOT NULL THEN 1
             ELSE 2
           END ASC,
           f.created_at DESC
         LIMIT 1
       ) AS thumbnail_url
     FROM countries c
     INNER JOIN country_flag_files cff
       ON cff.country_id = c.id AND cff.status = 'published'
     WHERE ($1::text IS NULL OR lower(trim(coalesce(c.region::text, ''))) = lower(trim($1)))
       AND (
         $2::text IS NULL
         OR lower(trim(coalesce(c.category::text, 'country'))) = lower(trim($2))
       )
     GROUP BY c.id, c.name, c.slug, c.iso_alpha_2
     ORDER BY c.name ASC`,
    [regionParam, catParam],
  );

  const out: GalleryCountrySummary[] = [];
  for (const row of result.rows) {
    const count =
      typeof row.cnt === 'string' ? Number.parseInt(row.cnt, 10) : Number(row.cnt);
    const code =
      row.iso_alpha_2?.trim()?.toUpperCase() || getCountryCode(row.name)?.toUpperCase() || null;
    let thumb = row.thumbnail_url?.trim() ?? '';
    if (!thumb || isPackFallbackFlagThumbnail(thumb)) {
      thumb = FLAG_THUMB_PLACEHOLDER_DATA_URL;
    }

    out.push({
      name: row.name,
      slug: row.slug,
      code: code || null,
      count: Number.isFinite(count) ? count : 0,
      thumbnail: thumb,
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
            premium_tier, thumbnail_url
     FROM country_flag_files
     WHERE country_id = $1 AND status = 'published'
     ORDER BY variant_name NULLS LAST, format, created_at ASC`,
    [countryRow.id]
  );

  if (fRes.rows.length === 0) return null;

  const iso = countryRow.iso_alpha_2?.trim()?.toUpperCase() || null;
  const mappedCode = iso || getCountryCode(countryRow.name)?.toUpperCase() || null;

  const variants: CountryGalleryPayload['variants'] = [];

  for (const r of fRes.rows) {
    const nbytes = Number.parseInt(String(r.file_size_bytes), 10);
    const sz = Number.isFinite(nbytes) ? nbytes : 0;
    const ext = formatExtension(r.format);
    const tier = normalizePremiumTier(r.premium_tier);

    const dim =
      r.width && r.height && r.width > 0 && r.height > 0
        ? `${r.width}×${r.height} px`
        : 'Original';

    let previewUrl = r.thumbnail_url?.trim() || '';
    const fileUrl = r.file_url?.trim() || '';
    if (!previewUrl && isImgPreviewableFormat(r.format) && fileUrl) {
      previewUrl = fileUrl;
    }
    if (!previewUrl) {
      previewUrl = FLAG_THUMB_PLACEHOLDER_DATA_URL;
    }

    const formatRow: CountryGalleryPayload['variants'][number]['formats'][number] = {
      id: String(r.id),
      format: formatDisplayName(r.format),
      formatCode: ext,
      category: formatToCategory(r.format),
      file: r.file_name,
      previewUrl,
      premiumTier: tier,
      downloadProtected: true,
      size: formatFileSize(sz),
      dimensions: dim,
    };

    const baseLabel = (r.variant_name?.trim() || r.file_name.replace(/\.[^.]+$/, '')).trim() || r.file_name;
    const variantLabel = truncateDisplayPath(`${baseLabel} · ${formatRow.format}`, 96);

    variants.push({
      id: `${countryRow.slug}-file-${r.id}`,
      name: variantLabel,
      type: 'standard',
      thumbnail: formatRow.previewUrl,
      formats: [formatRow],
    });
  }

  return {
    country: {
      name: countryRow.name,
      slug: countryRow.slug,
      code: mappedCode,
    },
    variants,
  };
}
