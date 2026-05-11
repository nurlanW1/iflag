import { NextResponse } from 'next/server';
import { getDb } from '@/lib/server/db';
import { fetchGalleryCountriesFromDb, applyGalleryDisplayNames, type GalleryCountrySummary } from '@/lib/server/gallery-from-db';

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
 * Landing gallery preview: only countries with real uploaded/published preview URLs
 * (same source as `/api/gallery/countries` DB path — no CSS pack or external SVG fallbacks).
 * - Default: random 24-tile preview.
 * - `?full=1`: full list, sorted by country name.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const full = searchParams.get('full') === '1';

    let rows: GalleryCountrySummary[] = [];
    if (process.env.DATABASE_URL?.trim()) {
      rows = applyGalleryDisplayNames(await fetchGalleryCountriesFromDb(getDb()));
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
