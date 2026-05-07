import { NextResponse } from 'next/server';
import { countries, hasFlag } from 'country-flag-icons';
import { getCountryName } from '@/lib/country-code-to-name';

function countryToSlug(country: string): string {
  return country.toLowerCase().replace(/\s+/g, '-');
}

/** CDN-only flag list for the home page grid — no local `flag_stock` folder required. */
export async function GET() {
  try {
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
    const limit = 24;
    return NextResponse.json({ countries: rows.slice(0, limit) });
  } catch (error) {
    console.error('Error building landing gallery preview:', error);
    return NextResponse.json({ countries: [] }, { status: 500 });
  }
}
