import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getCountryCode } from '@/lib/country-mapping';
import { getDb } from '@/lib/server/db';
import {
  applyGalleryDisplayNames,
  fetchGalleryCountriesFromDb,
  isPackFallbackFlagThumbnail,
  type GalleryCountrySummary,
  type GalleryCountryListFilters,
} from '@/lib/server/gallery-from-db';

export const dynamic = 'force-dynamic';

function filenameToCountryName(filename: string): string {
  let name = filename.replace(/_flag\.(jpg|jpeg)$/i, '');
  name = name.replace(/_/g, ' ');
  return name
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function countryToSlug(country: string): string {
  return country.toLowerCase().replace(/\s+/g, '-');
}

function mergeStockOnlyIntoDb(dbList: GalleryCountrySummary[], stockList: GalleryCountrySummary[]) {
  const seen = new Set(dbList.map((c) => c.slug.toLowerCase()));
  const extra = stockList.filter(
    (c) => !seen.has(c.slug.toLowerCase()) && !isPackFallbackFlagThumbnail(c.thumbnail),
  );
  return [...dbList, ...extra].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * `kind` mirrors home “Browse by region” tiles (organizations, autonomy, historical).
 */
function parseGalleryListFilters(searchParams: URLSearchParams): GalleryCountryListFilters | null {
  const kindRaw = searchParams.get('kind')?.trim().toLowerCase() || '';
  const kindMap: Partial<Record<string, NonNullable<GalleryCountryListFilters['dbCategory']>>> = {
    organization: 'organization',
    organizations: 'organization',
    autonomy: 'autonomy',
    historical: 'historical',
    'historical-flag': 'historical',
  };

  const dbCategory = kindRaw ? kindMap[kindRaw] : undefined;

  const regionRaw = searchParams.get('region')?.trim() || '';

  if (dbCategory) {
    return { dbCategory };
  }
  if (regionRaw) {
    return { region: regionRaw };
  }
  return null;
}

/**
 * Loads gallery countries from local `flag_stock` (legacy / dev). Safe on Vercel when folder is absent.
 * Only includes countries that actually have a real local file — no generic CSS / CDN flag icons are seeded.
 */
function loadFromFlagStock(): GalleryCountrySummary[] {
  const possiblePaths = [
    path.join(process.cwd(), '../../flag_stock'),
    path.join(process.cwd(), '../../../flag_stock'),
    'D:\\flagim\\iflag\\flag_stock',
    path.join(process.cwd(), 'flag_stock'),
    path.join(process.cwd(), '..', 'flag_stock'),
    path.join(process.cwd(), '..', '..', 'flag_stock'),
  ];

  let flagStockPath: string | null = null;
  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      flagStockPath = possiblePath;
      break;
    }
  }

  if (!flagStockPath) {
    return [];
  }

  const countryMap = new Map<string, GalleryCountrySummary>();

  try {
    const files = fs.readdirSync(flagStockPath);

    files.forEach((file) => {
      const lowerFile = file.toLowerCase();
      if (!(lowerFile.endsWith('.jpg') || lowerFile.endsWith('.jpeg'))) return;

      const countryName = filenameToCountryName(file);
      const countrySlug = countryToSlug(countryName);
      const countryCode = getCountryCode(countryName);
      const thumbnail = `/api/gallery/image?file=${encodeURIComponent(file)}`;

      const existing = countryMap.get(countryName);
      if (existing) {
        existing.count += 1;
        existing.thumbnail = thumbnail;
        return;
      }

      countryMap.set(countryName, {
        name: countryName,
        slug: countrySlug,
        code: countryCode,
        count: 1,
        thumbnail,
      });
    });
  } catch (err) {
    console.error(`Error reading directory ${flagStockPath}:`, err);
  }

  return Array.from(countryMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export async function GET(request: Request) {
  try {
    const filters = parseGalleryListFilters(new URL(request.url).searchParams);

    const stockCountries = loadFromFlagStock();

    if (process.env.DATABASE_URL?.trim()) {
      try {
        const pool = getDb();
        const fromDb = await fetchGalleryCountriesFromDb(pool, filters ?? null);

        /** Local `flag_stock` JPEGs — opt-in merge so production home/gallery stays DB+R2-only. */
        const mergeLegacyFlagStock =
          process.env.FLAG_STOCK_MERGE_WITH_DB === 'true' ||
          process.env.NEXT_PUBLIC_FLAG_STOCK_MERGE_WITH_DB === 'true';

        // Region / taxonomy filters: DB only (flag_stock rows have no region metadata).
        if (filters != null) {
          return NextResponse.json(
            { countries: applyGalleryDisplayNames(fromDb) },
            { headers: { 'Cache-Control': 'no-store' } },
          );
        }
        if (fromDb.length > 0) {
          const merged =
            mergeLegacyFlagStock ? mergeStockOnlyIntoDb(fromDb, stockCountries) : fromDb;
          return NextResponse.json(
            { countries: applyGalleryDisplayNames(merged) },
            { headers: { 'Cache-Control': 'no-store' } },
          );
        }
      } catch (err) {
        console.error('[gallery/countries] database gallery failed, falling back to flag_stock only:', err);
      }
    }

    if (filters != null) {
      return NextResponse.json({ countries: [] }, { headers: { 'Cache-Control': 'no-store' } });
    }

    if (stockCountries.length === 0) {
      console.log('[gallery/countries] no flag_stock and no published DB rows');
    }

    const stockOnlyReal = stockCountries.filter((c) => !isPackFallbackFlagThumbnail(c.thumbnail));
    return NextResponse.json({ countries: applyGalleryDisplayNames(stockOnlyReal) });
  } catch (error) {
    console.error('Error loading countries:', error);
    return NextResponse.json({ countries: [] }, { status: 500 });
  }
}
