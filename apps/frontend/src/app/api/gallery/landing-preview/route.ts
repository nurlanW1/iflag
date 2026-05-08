import { NextResponse } from 'next/server';
import { countries, hasFlag } from 'country-flag-icons';
import { getCountryName } from '@/lib/country-code-to-name';

function countryToSlug(country: string): string {
  return country.toLowerCase().replace(/\s+/g, '-');
}

/** Fisher–Yates shuffle (random preview order each request). */
function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function buildAllRows(): {
  name: string;
  slug: string;
  code: string | null;
  count: number;
  thumbnail: string;
}[] {
  const rows: {
    name: string;
    slug: string;
    code: string | null;
    count: number;
    thumbnail: string;
  }[] = [];

  countries.forEach((code) => {
    if (hasFlag(code)) {
      const countryName = getCountryName(code) || code;
      rows.push({
        name: countryName,
        slug: countryToSlug(countryName),
        code,
        count: 0,
        thumbnail: `https://purecatamphetamine.github.io/country-flag-icons/3x2/${code}.svg`,
      });
    }
  });

  rows.sort((a, b) => a.name.localeCompare(b.name));
  return rows;
}

/**
 * CDN-only flag list for the home page grid — no local `flag_stock` folder required.
 * - Default: random 24-tile preview.
 * - `?full=1`: full list, sorted by country name (same order as expand-on-home).
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const full = searchParams.get('full') === '1';

    const rows = buildAllRows();

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
    return NextResponse.json({ countries: [] }, { status: 500 });
  }
}
