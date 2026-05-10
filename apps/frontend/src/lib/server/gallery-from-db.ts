import type { Pool } from 'pg';
import { getCountryCode } from '@/lib/country-mapping';

export type GalleryCountrySummary = {
  name: string;
  slug: string;
  code: string | null;
  count: number;
  thumbnail: string;
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

function flagIconFallback(code: string | null): string {
  if (code) {
    return `https://purecatamphetamine.github.io/country-flag-icons/3x2/${code.toUpperCase()}.svg`;
  }
  return '/placeholder-flag.jpg';
}

/**
 * Public gallery: countries with at least one published flag file on Blob/DB.
 * Thumbnails avoid leaking paid `file_url` when a dedicated `thumbnail_url` exists or tier is non-free.
 */
export async function fetchGalleryCountriesFromDb(pool: Pool): Promise<GalleryCountrySummary[]> {
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
             WHEN NULLIF(trim(cff_thumb.thumbnail_url), '') IS NOT NULL THEN trim(cff_thumb.thumbnail_url)
             WHEN lower(coalesce(cff_thumb.premium_tier, 'free')) = 'free'
                  AND NULLIF(trim(cff_thumb.file_url), '') IS NOT NULL THEN trim(cff_thumb.file_url)
             ELSE NULL
           END
         FROM country_flag_files cff_thumb
         WHERE cff_thumb.country_id = c.id
           AND cff_thumb.status = 'published'
         ORDER BY cff_thumb.created_at DESC
         LIMIT 1
       ) AS thumbnail_url
     FROM countries c
     INNER JOIN country_flag_files cff
       ON cff.country_id = c.id AND cff.status = 'published'
     GROUP BY c.id, c.name, c.slug, c.iso_alpha_2
     ORDER BY c.name ASC`
  );

  const out: GalleryCountrySummary[] = [];
  for (const row of result.rows) {
    const count =
      typeof row.cnt === 'string' ? Number.parseInt(row.cnt, 10) : Number(row.cnt);
    const code =
      row.iso_alpha_2?.trim()?.toUpperCase() || getCountryCode(row.name)?.toUpperCase() || null;
    const thumb = row.thumbnail_url?.trim() || flagIconFallback(code);

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
      /** Safe image for <img> — never the paid master when `premiumTier` is paid/freemium without thumbnail. */
      previewUrl: string;
      premiumTier: GalleryPremiumTier;
      /** When true, downloads must use `/api/download/[id]` (Clerk + plan gate). */
      downloadProtected: boolean;
      size: string;
      dimensions: string;
    }[];
  }[];
};

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

  type GroupAcc = {
    displayName: string;
    formats: CountryGalleryPayload['variants'][number]['formats'];
  };

  const groups = new Map<string, GroupAcc>();

  for (const r of fRes.rows) {
    const displayName = (r.variant_name?.trim() || r.file_name).trim();
    const groupKey = displayName.toLowerCase() || String(r.id);
    let g = groups.get(groupKey);
    if (!g) {
      g = {
        displayName,
        formats: [],
      };
      groups.set(groupKey, g);
    }

    const nbytes = Number.parseInt(String(r.file_size_bytes), 10);
    const sz = Number.isFinite(nbytes) ? nbytes : 0;
    const ext = formatExtension(r.format);
    const tier = normalizePremiumTier(r.premium_tier);

    const dim =
      r.width && r.height && r.width > 0 && r.height > 0
        ? `${r.width}×${r.height} px`
        : 'Original';

    let previewUrl = r.thumbnail_url?.trim() || '';
    if (!previewUrl && tier === 'free' && r.file_url?.trim()) {
      previewUrl = r.file_url.trim();
    }
    if (!previewUrl) {
      previewUrl = flagIconFallback(mappedCode);
    }

    g.formats.push({
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
    });
  }

  const variants: CountryGalleryPayload['variants'] = [];
  let idx = 0;
  const thumbOrder = ['png', 'webp', 'jpg', 'jpeg', 'svg', 'pdf', 'eps'];

  function pickThumbnail(formats: GroupAcc['formats']): string {
    const rank = (code: string) => {
      const i = thumbOrder.indexOf(code);
      return i === -1 ? 999 : i;
    };
    const sorted = [...formats].sort((a, b) => rank(a.formatCode) - rank(b.formatCode));
    return sorted[0]?.previewUrl || formats[0]!.previewUrl;
  }

  for (const g of groups.values()) {
    const variantId =
      `${countryRow.slug}-` +
      g.displayName.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase() +
      `-v${idx++}`;
    variants.push({
      id: variantId,
      name: g.displayName,
      type: 'standard',
      thumbnail: pickThumbnail(g.formats),
      formats: g.formats,
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
