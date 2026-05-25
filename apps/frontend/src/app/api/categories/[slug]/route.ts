import { NextResponse } from 'next/server';
import { getDb } from '@/lib/server/db';
import {
  applyGalleryDisplayNames,
  fetchGalleryCountriesFromDb,
  type GalleryCountryListFilters,
} from '@/lib/server/gallery-from-db';

export const dynamic = 'force-dynamic';

/**
 * Geography / taxonomy hubs that mirror Neon `countries.region` and `countries.category`.
 * Example: `/api/categories/asia`, `/api/categories/organizations`.
 */
const SLUG_FILTERS: Record<string, GalleryCountryListFilters> = {
  asia: { region: 'Asia' },
  europe: { region: 'Europe' },
  africa: { region: 'Africa' },
  americas: { region: 'Americas' },
  'north-america': { region: 'North America' },
  'south-america': { region: 'South America' },
  oceania: { region: 'Oceania' },
  antarctica: { region: 'Antarctica' },
  organizations: { dbCategory: 'organization' },
  organisation: { dbCategory: 'organization' },
  historical: { dbCategory: 'historical' },
  autonomy: { dbCategory: 'autonomy' },
  sports: { region: 'Sports' },
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    if (!process.env.DATABASE_URL?.trim()) {
      return NextResponse.json({ countries: [] }, { headers: { 'Cache-Control': 'no-store' } });
    }
    const { slug } = await context.params;
    const key = slug?.trim().toLowerCase();
    if (!key) {
      return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
    }
    const filt = SLUG_FILTERS[key];
    if (!filt) {
      return NextResponse.json({ countries: [] }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
    }
    const pool = getDb();
    const rows = await fetchGalleryCountriesFromDb(pool, filt);
    return NextResponse.json(
      { countries: applyGalleryDisplayNames(rows) },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (e) {
    console.error('[api/categories/[slug]]', e);
    return NextResponse.json({ countries: [] }, { status: 500 });
  }
}
