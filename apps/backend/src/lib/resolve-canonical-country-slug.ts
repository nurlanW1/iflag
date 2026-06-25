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
  algerian: 'algeria',
  'national-algeria': 'algeria',
  'antigua-barbuda': 'antigua-and-barbuda',
  antiguabarbuda: 'antigua-and-barbuda',
  'arabic-emirates': 'united-arab-emirates',
  'arab-emirates': 'united-arab-emirates',
  arabicemirates: 'united-arab-emirates',
  uae: 'united-arab-emirates',
  'bosnia-herzegovina': 'bosnia-and-herzegovina',
  'botswana-verde': 'cabo-verde',
  'united-states-of-america': 'united-states',
  usa: 'united-states',
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

const CONTAINS_ALIASES: ReadonlyArray<[needle: string, slug: string]> = [
  ['palastine', 'palestine'],
  ['palestine', 'palestine'],
  ['tadjikistan', 'tajikistan'],
  ['turkmenistan', 'turkmenistan'],
  ['myanmar', 'myanmar'],
  ['pakistan', 'pakistan'],
  // NOTE: 'korea' removed — it would incorrectly redirect 'north-korea' → 'south-korea'
  ['chile', 'chile'],
];

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
  kr: 'south-korea',
  kp: 'north-korea',
};

export type CountrySlugIndex = {
  bySlug: Map<string, string>;
  byIso: Map<string, string>;
  byName: Map<string, string>;
};

function normSlug(s: string): string {
  return s.trim().toLowerCase().replace(/^-+|-+$/g, '');
}

function compactKey(s: string): string {
  return normSlug(s).replace(/[^a-z0-9]+/g, '');
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
    byName.set(compactKey(nameKey), slug);
    byName.set(compactKey(slug), slug);
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
      const compactName = compactKey(nameKey);
      if (compactName && !byName.has(compactName)) byName.set(compactName, slug);
      const compactSlug = compactKey(slug);
      if (compactSlug && !byName.has(compactSlug)) byName.set(compactSlug, slug);
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

  const contained = CONTAINS_ALIASES.find(([needle]) => raw.includes(needle));
  if (contained) return contained[1];

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
  const byName = index.byName.get(humanized) ?? index.byName.get(raw) ?? index.byName.get(compactKey(raw));
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
