import type { GalleryCountrySummary } from '@/types/gallery-country-hub';
import { isPackFallbackFlagThumbnail } from '@/lib/server/gallery-from-db';
import { COUNTRIES } from '@/lib/countries';

/** Slug aliases → canonical country hub slug (lowercase). */
export const COUNTRY_SLUG_SEARCH_ALIASES: Record<string, string> = {
  algerie: 'algeria',
  algerian: 'algeria',
  dz: 'algeria',
  'national-algeria': 'algeria',
  'antigua-barbuda': 'antigua-and-barbuda',
  antiguabarbuda: 'antigua-and-barbuda',
  'arabic-emirates': 'united-arab-emirates',
  'arab-emirates': 'united-arab-emirates',
  arabicemirates: 'united-arab-emirates',
  uae: 'united-arab-emirates',
  'bosnia-herzegovina': 'bosnia-and-herzegovina',
  'botswana-verde': 'cabo-verde',
  usa: 'united-states',
  'united-states-of-america': 'united-states',
  uk: 'united-kingdom',
  england: 'united-kingdom',
  holland: 'netherlands',
  burma: 'myanmar',
  birmania: 'myanmar',
  'myanmar-birmania': 'myanmar',
  czechia: 'czech-republic',
  czech: 'czech-republic',
  ivorycoast: 'ivory-coast',
  'cote-divoire': 'ivory-coast',
  korea: 'south-korea',
  'republic-of-korea': 'south-korea',
  rok: 'south-korea',
  southkorea: 'south-korea',
  srilanka: 'sri-lanka',
  ceylon: 'sri-lanka',
  palastine: 'palestine',
  'palastine-converted': 'palestine',
  's-o-tom-pr-ncipe': 'sao-tome-and-principe',
  'sao-tome': 'sao-tome-and-principe',
  somali: 'somalia',
  'south-sudan-guinea': 'south-sudan',
  tadjikistan: 'tajikistan',
  'turkmenistan-converted': 'turkmenistan',
  'saint-vincent-grenadines': 'saint-vincent-and-the-grenadines',
  usstate: 'us-states',
  'us-state': 'us-states',
  usstates: 'us-states',
  'us-states': 'us-states',
  usestates: 'us-states',
  'use-state': 'us-states',
  'use-states': 'us-states',
  usastate: 'us-states',
  'usa-state': 'us-states',
  usastates: 'us-states',
  'usa-states': 'us-states',
  'u-s-states': 'us-states',
  'united-states-states': 'us-states',
  'american-states': 'us-states',
};

const COUNTRY_SLUG_CONTAINS_ALIASES: ReadonlyArray<[needle: string, slug: string]> = [
  ['palastine', 'palestine'],
  ['palestine', 'palestine'],
  ['tadjikistan', 'tajikistan'],
  ['turkmenistan', 'turkmenistan'],
  ['myanmar', 'myanmar'],
  ['pakistan', 'pakistan'],
  ['korea', 'south-korea'],
  ['chile', 'chile'],
];

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
const COUNTRY_BY_SLUG = new Map(COUNTRIES.map((country) => [country.slug.toLowerCase(), country]));
for (const country of COUNTRIES) {
  COMPACT_COUNTRY_HUB_SLUGS.set(compactKey(country.slug), country.slug);
  COMPACT_COUNTRY_HUB_SLUGS.set(compactKey(country.name), country.slug);
}

const DECORATIVE_SLUG_TOKENS = new Set([
  'flag',
  'flags',
  'flagpole',
  'flagpoles',
  'vector',
  'wave',
  'waves',
  'waving',
  'circle',
  'heart',
  'sphere',
  'mockup',
  'banner',
  'icon',
  'image',
  'images',
  'pack',
  'background',
  'grunge',
  'as',
  'round',
  'glossy',
  'converted',
  'map',
  'folder',
  'on',
  'of',
  'the',
  'and',
  'for',
]);

function canonicalFromDecorativeSlug(raw: string): string | null {
  const tokens = raw
    .trim()
    .toLowerCase()
    .split(/[-_\s]+/)
    .filter(Boolean)
    .filter((token) => !DECORATIVE_SLUG_TOKENS.has(token));
  if (tokens.length === 0) return null;

  const hyphen = tokens.join('-');
  return (
    COUNTRY_SLUG_SEARCH_ALIASES[hyphen] ??
    COMPACT_COUNTRY_HUB_SLUGS.get(compactKey(hyphen)) ??
    null
  );
}

/** Slugs that look like imported file stems, not country folders. */
export function slugLooksLikeFileAsset(slug: string): boolean {
  const s = slug.trim().toLowerCase();
  if (!s || s.length < 2) return true;
  if (s === 'new-folder') return true;
  if (s.includes('_')) return true;
  if (
    /\b(flag|flags|flagpole|flagpoles|vector|wave|waves|waving|circle|heart|sphere|mockup|banner|icon|image|images|pack|background|grunge|folder)\b/.test(
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
  const contained = COUNTRY_SLUG_CONTAINS_ALIASES.find(([needle]) => raw.includes(needle));
  if (contained) return contained[1];
  const decorative = canonicalFromDecorativeSlug(raw);
  if (decorative) return decorative;
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
    const canon = canonicalHubSlug(row);
    if (slugLooksLikeFileAsset(row.slug) && canon === row.slug.trim().toLowerCase()) continue;
    const canonicalCountry = COUNTRY_BY_SLUG.get(canon.toLowerCase());
    const normalized: GalleryCountrySummary = {
      ...row,
      slug: canon,
      name: canonicalCountry?.name ?? row.name,
      code: row.code || canonicalCountry?.code.toUpperCase() || null,
    };
    const key = mergeKey(normalized);

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
