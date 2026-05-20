import { NextResponse } from 'next/server';
import { getDb } from '@/lib/server/db';
import { applyGalleryDisplayNames } from '@/lib/server/gallery-from-db';
import { fallbackUrlsForGalleryListThumb, resolvedFlagPublicHref } from '@/lib/server/flag-asset-url';

/** Fisher–Yates shuffle (random preview order each request). */
function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const LANDING_COVER_FORMATS = "'png','jpg','jpeg','webp','svg'" as const;

/**
 * Landing gallery preview: Neon-backed covers resolved through R2/public URL helpers (same as main gallery).
 * - Default: random 24-tile preview.
 * - `?full=1`: full list (home “Explore Our Flag Collection”), sorted by country name.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const full = searchParams.get('full') === '1';

    type Row = {
      name: string;
      slug: string;
      iso_alpha_2: string | null;
      cnt: string | number;
      thumbnail_file_key: string | null;
      thumbnail_file_url: string | null;
      thumbnail_preview_url: string | null;
      thumbnail_thumb_url: string | null;
      tier_pick: string | null;
    };

    const rowsBuilt: Row[] = [];
    if (process.env.DATABASE_URL?.trim()) {
      const result = await getDb().query<Row>(
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
             AND lower(f.format) IN (${LANDING_COVER_FORMATS})
           ORDER BY
             (NULLIF(trim(f.file_key), '') IS NOT NULL) DESC,
             (lower(trim(coalesce(f.storage_provider, ''))) = 'r2') DESC,
             CASE lower(f.format)
               WHEN 'png' THEN 0
               WHEN 'svg' THEN 1
               WHEN 'webp' THEN 2
               WHEN 'jpg' THEN 3
               WHEN 'jpeg' THEN 3
               ELSE 9
             END,
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
         WHERE
           tn.thumbnail_file_key IS NOT NULL
           OR tn.thumbnail_file_url IS NOT NULL
           OR tn.thumbnail_preview_url IS NOT NULL
           OR tn.thumbnail_thumb_url IS NOT NULL
         GROUP BY c.id, c.name, c.slug, c.iso_alpha_2,
           tn.thumbnail_file_key,
           tn.thumbnail_file_url,
           tn.thumbnail_preview_url,
           tn.thumbnail_thumb_url,
           tn.tier_pick
         ORDER BY c.name ASC`,
      );

      rowsBuilt.push(...result.rows);
    }

    const rows = applyGalleryDisplayNames(
      rowsBuilt.map((row) => {
        const count =
          typeof row.cnt === 'string' ? Number.parseInt(String(row.cnt), 10) : Number(row.cnt);
        const thumb = resolvedFlagPublicHref({
          fileKey: row.thumbnail_file_key,
          fallbackRawUrls: fallbackUrlsForGalleryListThumb({
            premiumTierRaw: row.tier_pick,
            fileUrl: row.thumbnail_file_url,
            previewUrl: row.thumbnail_preview_url,
            thumbnailUrl: row.thumbnail_thumb_url,
          }),
        });

        return {
          name: row.name,
          slug: row.slug,
          code: row.iso_alpha_2?.trim()?.toUpperCase() || null,
          count: Number.isFinite(count) ? count : 0,
          thumbnail: thumb,
        };
      }),
    ).filter((c) => c.thumbnail?.trim());

    const sorted = [...rows].sort((a, b) => a.name.localeCompare(b.name));

    if (full) {
      return NextResponse.json(
        { countries: sorted },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const limit = 24;
    return NextResponse.json(
      { countries: shuffle(sorted).slice(0, limit) },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('Error building landing gallery preview:', error);
    return NextResponse.json({ countries: [] }, { status: 200 });
  }
}
