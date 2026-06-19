import { NextResponse } from 'next/server';
import { getDb } from '@/lib/server/db';
import { filterLandingCountryFolders } from '@/lib/gallery/canonical-country-hubs';
import {
  applyGalleryDisplayNames,
  fetchGalleryCountriesFromDb,
} from '@/lib/server/gallery-from-db';
import type { GalleryCountrySummary } from '@/types/gallery-country-hub';

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
 * Fetch ALL countries from the countries table — no flag-file requirement.
 * Countries without uploads will use flagcdn.com via CountryHubFolderCover.
 */
async function fetchAllCountries(): Promise<GalleryCountrySummary[]> {
  const pool = getDb();
  const res = await pool.query<{
    id: string;
    name: string;
    slug: string;
    iso_alpha_2: string | null;
  }>(
    `SELECT id::text AS id, name, slug, trim(iso_alpha_2) AS iso_alpha_2
     FROM countries
     WHERE iso_alpha_2 IS NOT NULL
       AND length(trim(iso_alpha_2)) = 2
       AND trim(name) <> ''
       AND trim(slug) <> ''
     ORDER BY lower(trim(name)), name`
  );

  return res.rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    code: r.iso_alpha_2 ?? null,
    thumbnail_url: '',
    flag_count: 0,
    design_count: 0,
    thumbnail: '',
    count: 0,
    has_webp_cover: false,
    webp_cover_url: null,
  }));
}

/**
 * Landing gallery preview:
 * - Default: random 24-tile preview (published countries with covers only).
 * - `?full=1`: ALL countries for the marquee belt — uses flagcdn.com for countries without R2 uploads.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const full = searchParams.get('full') === '1';

    if (full) {
      if (!process.env.DATABASE_URL?.trim()) {
        return NextResponse.json({ countries: [] }, { status: 200 });
      }
      const all = await fetchAllCountries();
      return NextResponse.json(
        { countries: all },
        { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } },
      );
    }

    const rowsBuilt =
      process.env.DATABASE_URL?.trim() ?
        await fetchGalleryCountriesFromDb(getDb(), null)
      : [];

    const rows = filterLandingCountryFolders(applyGalleryDisplayNames(rowsBuilt));
    const sorted = [...rows].sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json(
      { countries: shuffle(sorted).slice(0, 24) },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('Error building landing gallery preview:', error);
    return NextResponse.json({ countries: [] }, { status: 200 });
  }
}
