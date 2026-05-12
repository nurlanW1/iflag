import { NextResponse } from 'next/server';
import { getDb } from '@/lib/server/db';
import { applyGalleryDisplayNames, type GalleryCountrySummary } from '@/lib/server/gallery-from-db';
import { siteProxiedBlobUrl } from '@/lib/server/blob-site-proxy';

/** Fisher–Yates shuffle (random preview order each request). */
function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Landing gallery preview: use real uploaded raster files (PNG/JPG/JPEG) as folder covers.
 * - Default: random 24-tile preview.
 * - `?full=1`: full list, sorted by country name.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const full = searchParams.get('full') === '1';

    let rows: GalleryCountrySummary[] = [];
    if (process.env.DATABASE_URL?.trim()) {
      const result = await getDb().query<{
        name: string;
        slug: string;
        iso_alpha_2: string | null;
        cnt: string | number;
        thumbnail_url: string;
      }>(
        `SELECT
           c.name,
           c.slug,
           c.iso_alpha_2,
           COUNT(cff.id)::int AS cnt,
           (
             SELECT trim(f.file_url)
             FROM country_flag_files f
             WHERE f.country_id = c.id
               AND f.status = 'published'
               AND lower(f.format) IN ('png', 'jpg', 'jpeg')
               AND NULLIF(trim(f.file_url), '') IS NOT NULL
             ORDER BY
               CASE lower(f.format)
                 WHEN 'png' THEN 0
                 WHEN 'jpg' THEN 1
                 WHEN 'jpeg' THEN 1
                 ELSE 2
               END,
               f.created_at DESC
             LIMIT 1
           ) AS thumbnail_url
         FROM countries c
         INNER JOIN country_flag_files cff
           ON cff.country_id = c.id AND cff.status = 'published'
         GROUP BY c.id, c.name, c.slug, c.iso_alpha_2
         HAVING (
           SELECT trim(f.file_url)
           FROM country_flag_files f
           WHERE f.country_id = c.id
             AND f.status = 'published'
             AND lower(f.format) IN ('png', 'jpg', 'jpeg')
             AND NULLIF(trim(f.file_url), '') IS NOT NULL
           ORDER BY
             CASE lower(f.format)
               WHEN 'png' THEN 0
               WHEN 'jpg' THEN 1
               WHEN 'jpeg' THEN 1
               ELSE 2
             END,
             f.created_at DESC
           LIMIT 1
         ) IS NOT NULL
         ORDER BY c.name ASC`,
      );

      rows = applyGalleryDisplayNames(
        result.rows.map((row) => {
          const count =
            typeof row.cnt === 'string' ? Number.parseInt(row.cnt, 10) : Number(row.cnt);

          return {
            name: row.name,
            slug: row.slug,
            code: row.iso_alpha_2?.trim()?.toUpperCase() || null,
            count: Number.isFinite(count) ? count : 0,
            thumbnail: siteProxiedBlobUrl(row.thumbnail_url),
          };
        }),
      );
    }

    rows = [...rows].sort((a, b) => a.name.localeCompare(b.name));

    if (full) {
      return NextResponse.json(
        { countries: rows },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const limit = 24;
    return NextResponse.json(
      { countries: shuffle(rows).slice(0, limit) },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('Error building landing gallery preview:', error);
    return NextResponse.json({ countries: [] }, { status: 200 });
  }
}
