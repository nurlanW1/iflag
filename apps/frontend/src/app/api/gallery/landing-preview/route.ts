import { NextResponse } from 'next/server';
import { getDb } from '@/lib/server/db';
import { filterLandingCountryFolders } from '@/lib/gallery/canonical-country-hubs';
import {
  applyGalleryDisplayNames,
  fetchGalleryCountriesFromDb,
} from '@/lib/server/gallery-from-db';

/** Fisher–Yates shuffle */
function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Landing gallery preview:
 * - Default: random 24-tile preview from uploaded R2-backed countries.
 * - `?full=1`: all uploaded R2-backed countries for marquee/game use.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const full = searchParams.get('full') === '1';

    const rowsBuilt =
      process.env.DATABASE_URL?.trim() ?
        await fetchGalleryCountriesFromDb(getDb(), null)
      : [];

    const rows = filterLandingCountryFolders(applyGalleryDisplayNames(rowsBuilt)).filter((country) =>
      Boolean(country.webp_cover_url?.trim() || country.thumbnail?.trim() || country.thumbnail_url?.trim()),
    );
    const sorted = [...rows].sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json(
      { countries: full ? sorted : shuffle(sorted).slice(0, 24) },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('Error building landing gallery preview:', error);
    return NextResponse.json({ countries: [] }, { status: 200 });
  }
}
