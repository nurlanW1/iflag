import { getCountryCode } from '@/lib/country-mapping';
import { isGenericFlagThumbPlaceholder } from '@/lib/flag-thumbnail-fallback';

export type LandingCountry = {
  name: string;
  slug: string;
  code: string | null;
  count: number;
  thumbnail: string;
};

/** ISO2 for `/api/gallery/iso-flag` (flagcdn PNG + local SVG fallback). */
function isoForRasterPreview(code: string | null | undefined, countryName: string): string | null {
  const raw = code?.trim();
  if (raw && /^[a-zA-Z]{2}$/.test(raw)) {
    const c = raw.toLowerCase();
    return c === 'uk' ? 'gb' : c;
  }
  const fromName = getCountryCode(countryName);
  if (fromName && /^[A-Z]{2}$/.test(fromName)) {
    const c = fromName.toLowerCase();
    return c === 'uk' ? 'gb' : c;
  }
  return null;
}

/**
 * Replace generic star placeholders with same-origin raster/vector previews (PNG when flagcdn works).
 */
export function applyLandingRasterThumbnails(countries: LandingCountry[]): LandingCountry[] {
  return countries.map((c) => {
    if (!isGenericFlagThumbPlaceholder(c.thumbnail)) return c;
    const iso = isoForRasterPreview(c.code, c.name);
    if (!iso) return c;
    return {
      ...c,
      thumbnail: `/api/gallery/iso-flag?code=${encodeURIComponent(iso)}`,
    };
  });
}
