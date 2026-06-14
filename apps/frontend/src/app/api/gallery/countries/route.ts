import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getCountryCode } from '@/lib/country-mapping';
import { getDb } from '@/lib/server/db';
import {
  applyGalleryDisplayNames,
  fetchGalleryCountriesFromDb,
  galleryDbTargetForLogs,
  isPackFallbackFlagThumbnail,
  logGalleryCountriesStats,
  type GalleryCountrySummary,
  type GalleryCountryListFilters,
} from '@/lib/server/gallery-from-db';
import { fetchGalleryCountriesFromBackendApi } from '@/lib/server/gallery-backend-fallback';
import {
  filterGalleryCountryFolders,
  mergeCanonicalCountryHubs,
} from '@/lib/gallery/canonical-country-hubs';
import { filterCountryHubsByGalleryRegion } from '@/lib/gallery/country-continent';

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
  return mergeCanonicalCountryHubs([...dbList, ...extra]);
}

function finalizeCountryHubList(
  list: GalleryCountrySummary[],
  filters: GalleryCountryListFilters | null,
): GalleryCountrySummary[] {
  const folders = filterGalleryCountryFolders(list);
  const named = applyGalleryDisplayNames(folders);
  if (filters?.region?.trim()) {
    return filterCountryHubsByGalleryRegion(named, filters.region);
  }
  return named;
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
      if (!(lowerFile.endsWith('.jpg') || lowerFile.endsWith('.jpeg') || lowerFile.endsWith('.png'))) return;

      const countryName = filenameToCountryName(file);
      const countrySlug = countryToSlug(countryName);
      const countryCode = getCountryCode(countryName);
      const thumbnail = `/api/gallery/image?file=${encodeURIComponent(file)}`;

      const existing = countryMap.get(countryName);
      if (existing) {
        existing.count += 1;
        existing.flag_count += 1;
        existing.thumbnail = thumbnail;
        existing.thumbnail_url = thumbnail;
        return;
      }

      countryMap.set(countryName, {
        id: `flag-stock:${countrySlug}`,
        name: countryName,
        slug: countrySlug,
        code: countryCode,
        flag_count: 1,
        design_count: 1,
        count: 1,
        has_webp_cover: false,
        webp_cover_url: null,
        thumbnail_url: thumbnail,
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

        await logGalleryCountriesStats(pool);

        const fromDb = await fetchGalleryCountriesFromDb(pool, filters ?? null);

        /** Local `flag_stock` JPEGs — opt-in merge so production home/gallery stays DB+R2-only. */
        const mergeLegacyFlagStock =
          process.env.FLAG_STOCK_MERGE_WITH_DB === 'true' ||
          process.env.NEXT_PUBLIC_FLAG_STOCK_MERGE_WITH_DB === 'true';

        // Region / taxonomy filters: DB only (flag_stock rows have no region metadata).
        if (filters != null) {
          return NextResponse.json(
            { countries: finalizeCountryHubList(fromDb, filters) },
            { headers: { 'Cache-Control': 'no-store' } },
          );
        }
        if (fromDb.length > 0) {
          const merged =
            mergeLegacyFlagStock ? mergeStockOnlyIntoDb(fromDb, stockCountries) : fromDb;
          return NextResponse.json(
            { countries: finalizeCountryHubList(merged, filters) },
            { headers: { 'Cache-Control': 'no-store' } },
          );
        }

        const fromBackend = await fetchGalleryCountriesFromBackendApi();
        if (fromBackend.length > 0) {
          console.info(
            `[gallery/countries] Neon empty (${galleryDbTargetForLogs(process.env.DATABASE_URL)}); served ${fromBackend.length} hubs from backend API`,
          );
          const merged =
            mergeLegacyFlagStock ? mergeStockOnlyIntoDb(fromBackend, stockCountries) : fromBackend;
          return NextResponse.json(
            { countries: finalizeCountryHubList(merged, filters) },
            { headers: { 'Cache-Control': 'no-store' } },
          );
        }
      } catch (err) {
        console.error('[gallery/countries] database gallery failed, falling back to flag_stock only:', err);
      }
    } else {
      const fromBackend = await fetchGalleryCountriesFromBackendApi();
      if (fromBackend.length > 0) {
        console.info(
          `[gallery/countries] DATABASE_URL unset; served ${fromBackend.length} hubs from backend API`,
        );
        const merged =
          process.env.FLAG_STOCK_MERGE_WITH_DB === 'true' ||
          process.env.NEXT_PUBLIC_FLAG_STOCK_MERGE_WITH_DB === 'true'
            ? mergeStockOnlyIntoDb(fromBackend, stockCountries)
            : fromBackend;
        return NextResponse.json(
          { countries: finalizeCountryHubList(merged, filters) },
          { headers: { 'Cache-Control': 'no-store' } },
        );
      }
    }

    if (filters != null) {
      return NextResponse.json({ countries: [] }, { headers: { 'Cache-Control': 'no-store' } });
    }

    if (stockCountries.length === 0) {
      console.log('[gallery/countries] no flag_stock and no published DB rows');
    }

    const stockOnlyReal = stockCountries.filter((c) => !isPackFallbackFlagThumbnail(c.thumbnail));
    return NextResponse.json({ countries: finalizeCountryHubList(stockOnlyReal, null) });
  } catch (error) {
    console.error('Error loading countries:', error);
    return NextResponse.json({ countries: [] }, { status: 500 });
  }
}
