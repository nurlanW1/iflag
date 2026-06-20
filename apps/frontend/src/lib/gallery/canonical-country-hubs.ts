import type { GalleryCountrySummary } from '@/types/gallery-country-hub';
import { isPackFallbackFlagThumbnail } from '@/lib/server/gallery-from-db';
import { COUNTRIES } from '@/lib/countries';

/** Slug aliases → canonical country hub slug (lowercase). */
export const COUNTRY_SLUG_SEARCH_ALIASES: Record<string, string> = {
  algerie: 'algeria',
  dz: 'algeria',
  'national-algeria': 'algeria',
  usa: 'united-states',
  'united-states-of-america': 'united-states',
  uk: 'united-kingdom',
  england: 'united-kingdom',
  holland: 'netherlands',
  burma: 'myanmar',
  czechia: 'czech-republic',
  ivorycoast: 'ivory-coast',
  'cote-divoire': 'ivory-coast',
  korea: 'south-korea',
  'republic-of-korea': 'south-korea',
  rok: 'south-korea',
  southkorea: 'south-korea',
  srilanka: 'sri-lanka',
  ceylon: 'sri-lanka',
};

export const ISO_TO_COUNTRY_HUB_SLUG: Record<string, string> = {
  DZ: 'algeria',
  US: 'united-states',
  GB: 'united-kingdom',
  UZ: 'uzbekistan',
  KR: 'south-korea',
  KP: 'north-korea',
};

function compactKey(s: string): string {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
}

const COMPACT_COUNTRY_HUB_SLUGS = new Map<string, string>();
for (const country of COUNTRIES) {
  COMPACT_COUNTRY_HUB_SLUGS.set(compactKey(country.slug), country.slug);
  COMPACT_COUNTRY_HUB_SLUGS.set(compactKey(country.name), country.slug);
}

/** Slugs that look like imported file stems, not country folders. */
export function slugLooksLikeFileAsset(slug: string): boolean {
  const s = slug.trim().toLowerCase();
  if (!s || s.length < 2) return true;
  if (s.includes('_')) return true;
  if (
    /\b(flag|flags|vector|wave|circle|heart|sphere|mockup|banner|icon|pack|background|grunge)\b/.test(
      s,
    )
  ) {
    return true;
  }
  return false;
}

export function canonicalHubSlug(row: Pick<GalleryCountrySummary, 'slug' | 'code'>): string {
  const raw = row.slug.trim().toLowerCase();
  const aliased = COUNTRY_SLUG_SEARCH_ALIASES[raw];
  if (aliased) return aliased;
  const compact = COMPACT_COUNTRY_HUB_SLUGS.get(compactKey(raw));
  if (compact) return compact;
  const iso = row.code?.trim().toUpperCase();
  if (iso && ISO_TO_COUNTRY_HUB_SLUG[iso]) return ISO_TO_COUNTRY_HUB_SLUG[iso];
  return raw;
}

function mergeKey(row: GalleryCountrySummary): string {
  const iso = row.code?.trim().toUpperCase();
  if (iso) return `iso:${iso}`;
  return `slug:${canonicalHubSlug(row)}`;
}

function pickBetterHub(a: GalleryCountrySummary, b: GalleryCountrySummary): GalleryCountrySummary {
  if (a.has_webp_cover && !b.has_webp_cover) return a;
  if (b.has_webp_cover && !a.has_webp_cover) return b;
  if ((a.design_count || 0) > (b.design_count || 0)) return a;
  if ((b.design_count || 0) > (a.design_count || 0)) return b;
  if ((a.flag_count || 0) > (b.flag_count || 0)) return a;
  return b;
}

/**
 * One tile per country hub — merges alias slugs (usa → united-states) and drops file-like slugs.
 */
export function mergeCanonicalCountryHubs(
  countries: GalleryCountrySummary[],
): GalleryCountrySummary[] {
  const map = new Map<string, GalleryCountrySummary>();

  for (const row of countries) {
    if (slugLooksLikeFileAsset(row.slug)) continue;

    const canon = canonicalHubSlug(row);
    const key = mergeKey(row);
    const normalized: GalleryCountrySummary = {
      ...row,
      slug: canon,
    };

    const existing = map.get(key);
    if (!existing) {
      map.set(key, normalized);
      continue;
    }

    const better = pickBetterHub(existing, normalized);
    const other = better === existing ? normalized : existing;

    map.set(key, {
      ...better,
      slug: canon,
      name: better.name || other.name,
      code: better.code || other.code,
      flag_count: (existing.flag_count || 0) + (normalized.flag_count || 0),
      design_count: Math.max(existing.design_count || 0, normalized.design_count || 0),
      count: (existing.count || 0) + (normalized.count || 0),
      has_webp_cover: existing.has_webp_cover || normalized.has_webp_cover,
      webp_cover_url: existing.webp_cover_url || normalized.webp_cover_url,
      thumbnail_url:
        (existing.has_webp_cover ? existing.webp_cover_url : null) ||
        (normalized.has_webp_cover ? normalized.webp_cover_url : null) ||
        better.thumbnail_url ||
        other.thumbnail_url,
      thumbnail:
        (existing.has_webp_cover ? existing.webp_cover_url : null) ||
        (normalized.has_webp_cover ? normalized.webp_cover_url : null) ||
        better.thumbnail ||
        other.thumbnail,
    });
  }

  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** Landing / home: country folders only — no pack placeholders, no file-stem slugs. */
export function filterLandingCountryFolders(
  countries: GalleryCountrySummary[],
): GalleryCountrySummary[] {
  return mergeCanonicalCountryHubs(countries).filter((c) => {
    if ((c.flag_count ?? 0) < 1) return false;
    const thumb = c.webp_cover_url ?? c.thumbnail ?? '';
    if (!thumb.trim()) return false;
    if (isPackFallbackFlagThumbnail(thumb)) return false;
    return true;
  });
}

/**
 * `/gallery` index: one tile per country hub with a WebP folder cover only.
 * Drops file-stem slugs, pack placeholders, and hubs without a preview cover.
 */
export function filterGalleryCountryFolders(
  countries: GalleryCountrySummary[],
): GalleryCountrySummary[] {
  return mergeCanonicalCountryHubs(countries).filter((c) => {
    if (!c.is_fallback_country && (c.flag_count ?? 0) < 1) return false;
    const thumb = c.webp_cover_url ?? c.thumbnail ?? c.thumbnail_url ?? '';
    return Boolean(thumb.trim()) && !isPackFallbackFlagThumbnail(thumb);
  });
}
