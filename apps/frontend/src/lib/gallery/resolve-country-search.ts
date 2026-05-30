import { getCountryCode } from '@/lib/country-mapping';
import type { GalleryCountrySummary } from '@/types/gallery-country-hub';
import {
  COUNTRY_SLUG_SEARCH_ALIASES,
  ISO_TO_COUNTRY_HUB_SLUG,
  canonicalHubSlug,
} from '@/lib/gallery/canonical-country-hubs';

export type CountrySearchRow = Pick<GalleryCountrySummary, 'slug' | 'name' | 'code'>;

function slugifyQuery(q: string): string {
  return q
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function aliasSlugForQuery(qLower: string, qSlug: string): string | null {
  return COUNTRY_SLUG_SEARCH_ALIASES[qLower] ?? COUNTRY_SLUG_SEARCH_ALIASES[qSlug] ?? null;
}

function isoSlugForQuery(qLower: string): string | null {
  if (qLower.length !== 2) return null;
  const iso = qLower.toUpperCase();
  return ISO_TO_COUNTRY_HUB_SLUG[iso] ?? null;
}

function findInCatalog(
  countries: readonly CountrySearchRow[],
  predicate: (c: CountrySearchRow, canon: string) => boolean,
): CountrySearchRow[] {
  const seen = new Set<string>();
  const out: CountrySearchRow[] = [];
  for (const c of countries) {
    const canon = canonicalHubSlug(c);
    if (seen.has(canon)) continue;
    if (predicate(c, canon)) {
      seen.add(canon);
      out.push({ ...c, slug: canon });
    }
  }
  return out;
}

/**
 * Resolve a free-text query to one gallery country hub slug, or null when ambiguous / unknown.
 */
export function resolveGalleryCountrySlugFromQuery(
  query: string,
  countries: readonly CountrySearchRow[],
): string | null {
  const raw = query.trim();
  if (!raw) return null;

  const qLower = raw.toLowerCase();
  const qSlug = slugifyQuery(raw);

  const alias = aliasSlugForQuery(qLower, qSlug);
  if (alias) {
    const inCatalog = findInCatalog(countries, (_c, canon) => canon === alias);
    if (inCatalog.length === 1) return inCatalog[0]!.slug;
    if (countries.length === 0) return alias;
  }

  const isoSlug = isoSlugForQuery(qLower);
  if (isoSlug) {
    const byIso = findInCatalog(countries, (c) => c.code?.toUpperCase() === qLower.toUpperCase());
    if (byIso.length === 1) return byIso[0]!.slug;
    const byCanon = findInCatalog(countries, (_c, canon) => canon === isoSlug);
    if (byCanon.length === 1) return byCanon[0]!.slug;
    if (countries.length === 0) return isoSlug;
  }

  const isoFromName = getCountryCode(raw);
  if (isoFromName) {
    const byNameIso = findInCatalog(
      countries,
      (c) => c.code?.toUpperCase() === isoFromName.toUpperCase(),
    );
    if (byNameIso.length === 1) return byNameIso[0]!.slug;
    const mapped = ISO_TO_COUNTRY_HUB_SLUG[isoFromName];
    if (mapped) {
      const byMapped = findInCatalog(countries, (_c, canon) => canon === mapped);
      if (byMapped.length === 1) return byMapped[0]!.slug;
      if (countries.length === 0) return mapped;
    }
  }

  const exactSlug = findInCatalog(
    countries,
    (c, canon) => canon === qSlug || c.slug.toLowerCase() === qLower,
  );
  if (exactSlug.length === 1) return exactSlug[0]!.slug;

  const exactName = findInCatalog(countries, (c) => c.name.trim().toLowerCase() === qLower);
  if (exactName.length === 1) return exactName[0]!.slug;

  const exactCode = findInCatalog(
    countries,
    (c) => c.code?.trim().toLowerCase() === qLower,
  );
  if (exactCode.length === 1) return exactCode[0]!.slug;

  if (qLower.length >= 3) {
    const prefixName = findInCatalog(countries, (c) => {
      const name = c.name.trim().toLowerCase();
      return name.startsWith(qLower) || qLower.startsWith(name);
    });
    if (prefixName.length === 1) return prefixName[0]!.slug;

    const containsName = findInCatalog(countries, (c) => c.name.toLowerCase().includes(qLower));
    if (containsName.length === 1) return containsName[0]!.slug;

    const containsSlug = findInCatalog(countries, (_c, canon) => canon.includes(qSlug));
    if (containsSlug.length === 1) return containsSlug[0]!.slug;
  }

  return null;
}
