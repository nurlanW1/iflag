import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getCountryCode } from '@/lib/country-mapping';
import { getCountryName } from '@/lib/country-code-to-name';
import { countries, hasFlag } from 'country-flag-icons';

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

export async function GET() {
  try {
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
      console.log('Flag stock directory not found. Tried paths:', possiblePaths);
      return NextResponse.json({ countries: [] });
    }

    const countryMap = new Map<
      string,
      { name: string; slug: string; code: string | null; count: number; thumbnail: string }
    >();
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

    const countriesList = Array.from(countryMap.values()).sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ countries: countriesList });
  } catch (error) {
    console.error('Error loading countries:', error);
    return NextResponse.json({ countries: [] }, { status: 500 });
  }
}
