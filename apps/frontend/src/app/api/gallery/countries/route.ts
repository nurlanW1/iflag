import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getCountryCode } from '@/lib/country-mapping';
import { getCountryName } from '@/lib/country-code-to-name';
import { countries, hasFlag } from 'country-flag-icons';
import { getDb } from '@/lib/server/db';
import { fetchGalleryCountriesFromDb, type GalleryCountrySummary } from '@/lib/server/gallery-from-db';

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
  const extra = stockList.filter((c) => !seen.has(c.slug.toLowerCase()));
  return [...dbList, ...extra].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Loads gallery countries from local `flag_stock` (legacy / dev). Safe on Vercel when folder is absent.
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
  const codeMap = new Map<string, string>();

  countries.forEach((code) => {
    if (hasFlag(code)) {
      const countryName = getCountryName(code) || code;
      const countrySlug = countryToSlug(countryName);

      if (!codeMap.has(code)) {
        codeMap.set(code, countryName);
        countryMap.set(countryName, {
          name: countryName,
          slug: countrySlug,
          code: code,
          count: 0,
          thumbnail: `https://purecatamphetamine.github.io/country-flag-icons/3x2/${code}.svg`,
        });
      }
    }
  });

  try {
    const files = fs.readdirSync(flagStockPath);

    files.forEach((file) => {
      const lowerFile = file.toLowerCase();
      if (lowerFile.endsWith('.jpg') || lowerFile.endsWith('.jpeg')) {
        const countryName = filenameToCountryName(file);
        const countrySlug = countryToSlug(countryName);
        const countryCode = getCountryCode(countryName);

        let existingCountry = countryMap.get(countryName);

        if (!existingCountry && countryCode && codeMap.has(countryCode)) {
          const mappedName = codeMap.get(countryCode)!;
          existingCountry = countryMap.get(mappedName);
        }

        if (existingCountry) {
          existingCountry.count += 1;
          existingCountry.thumbnail = `/api/gallery/image?file=${encodeURIComponent(file)}`;
        } else if (countryCode && codeMap.has(countryCode)) {
          const mappedName = codeMap.get(countryCode)!;
          const existing = countryMap.get(mappedName);
          if (existing) {
            existing.count += 1;
            existing.thumbnail = `/api/gallery/image?file=${encodeURIComponent(file)}`;
          }
        } else {
          countryMap.set(countryName, {
            name: countryName,
            slug: countrySlug,
            code: countryCode,
            count: 1,
            thumbnail: `/api/gallery/image?file=${encodeURIComponent(file)}`,
          });
          if (countryCode) {
            codeMap.set(countryCode, countryName);
          }
        }
      }
    });
  } catch (err) {
    console.error(`Error reading directory ${flagStockPath}:`, err);
  }

  return Array.from(countryMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export async function GET() {
  try {
    const stockCountries = loadFromFlagStock();

    if (process.env.DATABASE_URL?.trim()) {
      try {
        const pool = getDb();
        const fromDb = await fetchGalleryCountriesFromDb(pool);
        if (fromDb.length > 0) {
          return NextResponse.json(
            { countries: mergeStockOnlyIntoDb(fromDb, stockCountries) },
            { headers: { 'Cache-Control': 'no-store' } }
          );
        }
      } catch (err) {
        console.error('[gallery/countries] database gallery failed, falling back to flag_stock only:', err);
      }
    }

    if (stockCountries.length === 0) {
      console.log('[gallery/countries] no flag_stock and no published DB rows');
    }

    return NextResponse.json({ countries: stockCountries });
  } catch (error) {
    console.error('Error loading countries:', error);
    return NextResponse.json({ countries: [] }, { status: 500 });
  }
}
