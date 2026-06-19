import { NextResponse } from 'next/server';
import { getDb } from '@/lib/server/db';
import { filterLandingCountryFolders } from '@/lib/gallery/canonical-country-hubs';
import {
  applyGalleryDisplayNames,
  fetchGalleryCountriesFromDb,
} from '@/lib/server/gallery-from-db';
import { COUNTRIES } from '@/lib/countries';
import type { GalleryCountrySummary } from '@/types/gallery-country-hub';

/** Fisher–Yates shuffle */
function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Static list of all ISO countries — used for marquee belt (no DB dependency). */
function allCountriesStatic(): GalleryCountrySummary[] {
  return [...COUNTRIES]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((c) => ({
      id: `static:${c.slug}`,
      name: c.name,
      slug: c.slug,
      code: c.code.toUpperCase(),
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
 * - Default: random 24-tile preview (published countries with covers).
 * - `?full=1`: ALL ISO countries for the marquee belt via flagcdn.com — no DB needed.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const full = searchParams.get('full') === '1';

    if (full) {
      return NextResponse.json(
        { countries: allCountriesStatic() },
        { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' } },
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
