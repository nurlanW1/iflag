/**
 * Map inferred R2 folder/filename slugs to an existing `countries.slug` when possible.
 * Prevents forks like `dz`, `algerie`, `national-algeria` splitting one country across rows.
 */

import type { Pool } from 'pg';
import {
  CANONICAL_COUNTRIES,
  getCanonicalCountryBySlug,
} from './canonical-countries.js';
import { slugifySegment } from '../storage/r2.js';

/** Common slug aliases → canonical slug (lowercase). */
const SLUG_ALIASES: Record<string, string> = {
  algerie: 'algeria',
  'national-algeria': 'algeria',
  'united-states-of-america': 'united-states',
  usa: 'united-states',
  uk: 'united-kingdom',
  england: 'united-kingdom',
  holland: 'netherlands',
  burma: 'myanmar',
  czechia: 'czech-republic',
  ivorycoast: 'ivory-coast',
  'cote-divoire': 'ivory-coast',
};

/** ISO-3166 alpha-2 → canonical slug (subset; DB iso match is preferred). */
const ISO_TO_SLUG: Record<string, string> = {
  dz: 'algeria',
  us: 'united-states',
  gb: 'united-kingdom',
  uk: 'united-kingdom',
  uz: 'uzbekistan',
  be: 'belgium',
  tr: 'turkey',
  fr: 'france',
  de: 'germany',
  pk: 'pakistan',
};

export type CountrySlugIndex = {
  bySlug: Map<string, string>;
  byIso: Map<string, string>;
  byName: Map<string, string>;
};

function normSlug(s: string): string {
  return s.trim().toLowerCase().replace(/^-+|-+$/g, '');
}

function tokensFromSlug(slug: string): string[] {
  return normSlug(slug)
    .split(/[-_]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

/** `national-algeria` → `algeria` when trailing token is a known country slug. */
function stripNationalPrefix(slug: string): string | null {
  const t = tokensFromSlug(slug);
  if (t.length < 2 || t[0] !== 'national') return null;
  const tail = t.slice(1).join('-');
  return tail.length >= 2 ? tail : null;
}

export async function loadCountrySlugIndex(pool: Pool): Promise<CountrySlugIndex> {
  const res = await pool.query<{
    slug: string;
    iso_alpha_2: string | null;
    name: string | null;
  }>(
    `SELECT lower(trim(slug)) AS slug,
            NULLIF(trim(iso_alpha_2::text), '') AS iso_alpha_2,
            NULLIF(trim(name::text), '') AS name
     FROM countries`,
  );

  const bySlug = new Map<string, string>();
  const byIso = new Map<string, string>();
  const byName = new Map<string, string>();

  for (const country of CANONICAL_COUNTRIES) {
    const slug = normSlug(country.slug);
    bySlug.set(slug, slug);
    byIso.set(country.code.toLowerCase(), slug);

    const nameKey = country.name.toLowerCase();
    byName.set(nameKey, slug);
    byName.set(nameKey.replace(/\s+/g, '-'), slug);
    byName.set(slug, slug);
  }

  for (const row of res.rows) {
    const slug = normSlug(row.slug);
    if (!slug) continue;
    bySlug.set(slug, slug);

    const iso = row.iso_alpha_2?.trim().toLowerCase();
    if (iso && iso.length === 2 && !byIso.has(iso)) byIso.set(iso, slug);

    const name = row.name?.trim();
    if (name) {
      const nameKey = name.toLowerCase();
      if (!byName.has(nameKey)) byName.set(nameKey, slug);
      const hyphenName = nameKey.replace(/\s+/g, '-');
      if (!byName.has(hyphenName)) byName.set(hyphenName, slug);
    }
  }

  return { bySlug, byIso, byName };
}

export function resolveCanonicalCountrySlugWithIndex(
  inferredSlug: string,
  index: CountrySlugIndex,
): string {
  const raw = normSlug(inferredSlug);
  if (!raw) return inferredSlug;

  const alias = SLUG_ALIASES[raw];
  if (alias) return alias;

  const nationalTail = stripNationalPrefix(raw);
  if (nationalTail) {
    const aliased = SLUG_ALIASES[nationalTail] ?? nationalTail;
    const hit = index.bySlug.get(aliased);
    if (hit) return hit;
  }

  const existing = index.bySlug.get(raw);
  if (existing) return existing;

  if (raw.length === 2) {
    const fromDb = index.byIso.get(raw);
    if (fromDb) return fromDb;
    const isoSlug = ISO_TO_SLUG[raw];
    if (isoSlug && index.bySlug.has(isoSlug)) return isoSlug;
    if (isoSlug) return isoSlug;
  }

  const humanized = raw.replace(/-/g, ' ');
  const byName = index.byName.get(humanized) ?? index.byName.get(raw);
  if (byName) return byName;

  const slugified = slugifySegment(humanized, 96);
  if (slugified && slugified !== raw) {
    const again = index.bySlug.get(slugified);
    if (again) return again;
  }

  return raw;
}

export function getCanonicalCountryForSlug(slug: string) {
  return getCanonicalCountryBySlug(normSlug(slug));
}

export async function resolveCanonicalCountrySlug(
  pool: Pool,
  inferredSlug: string,
  index?: CountrySlugIndex,
): Promise<string> {
  const idx = index ?? (await loadCountrySlugIndex(pool));
  return resolveCanonicalCountrySlugWithIndex(inferredSlug, idx);
}
