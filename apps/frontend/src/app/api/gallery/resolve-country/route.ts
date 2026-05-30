import { NextResponse } from 'next/server';
import { getDb } from '@/lib/server/db';
import {
  applyGalleryDisplayNames,
  fetchGalleryCountriesFromDb,
} from '@/lib/server/gallery-from-db';
import { fetchGalleryCountriesFromBackendApi } from '@/lib/server/gallery-backend-fallback';
import { filterGalleryCountryFolders } from '@/lib/gallery/canonical-country-hubs';
import { resolveGalleryCountrySlugFromQuery } from '@/lib/gallery/resolve-country-search';

export const dynamic = 'force-dynamic';

async function loadCountrySearchCatalog() {
  if (process.env.DATABASE_URL?.trim()) {
    try {
      const rows = await fetchGalleryCountriesFromDb(getDb(), null);
      if (rows.length > 0) {
        return applyGalleryDisplayNames(filterGalleryCountryFolders(rows));
      }
    } catch (err) {
      console.warn('[gallery/resolve-country] Neon lookup failed:', err);
    }
  }

  const fromBackend = await fetchGalleryCountriesFromBackendApi();
  return applyGalleryDisplayNames(filterGalleryCountryFolders(fromBackend));
}

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get('q')?.trim() ?? '';
  if (!q) {
    return NextResponse.json({ slug: null }, { headers: { 'Cache-Control': 'no-store' } });
  }

  try {
    const countries = await loadCountrySearchCatalog();
    const slug = resolveGalleryCountrySlugFromQuery(q, countries);
    return NextResponse.json({ slug }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[gallery/resolve-country]', error);
    return NextResponse.json({ slug: null }, { status: 500 });
  }
}
