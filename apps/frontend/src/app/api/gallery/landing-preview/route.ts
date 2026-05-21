import { NextResponse } from 'next/server';
import { getDb } from '@/lib/server/db';
import {
  applyGalleryDisplayNames,
  fetchGalleryCountriesFromDb,
  isPackFallbackFlagThumbnail,
} from '@/lib/server/gallery-from-db';

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
 * Landing gallery preview: same Neon/backing query as `/api/gallery/countries` (published + usable `file_url`).
 * - Default: random 24-tile preview.
 * - `?full=1`: full list (home “Explore Our Flag Collection”), sorted by country name.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const full = searchParams.get('full') === '1';

    const rowsBuilt =
      process.env.DATABASE_URL?.trim() ?
        await fetchGalleryCountriesFromDb(getDb(), null)
      : [];

    const rows = applyGalleryDisplayNames(rowsBuilt).filter((c) => {
      const t = c.thumbnail?.trim();
      if (!t) return false;
      return !isPackFallbackFlagThumbnail(t);
    });

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
