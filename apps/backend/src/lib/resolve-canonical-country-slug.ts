/**
 * Map inferred R2 folder/filename slugs to an existing `countries.slug` when possible.
 * Prevents forks like `dz`, `algerie`, `national-algeria` splitting one country across rows.
 */

import type { Pool } from 'pg';
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

function normSlug(s: string): string {
  return s.trim().toLowerCase().replace(/^\-+|\-+$/g, '');
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

export async function resolveCanonicalCountrySlug(
  pool: Pool,
  inferredSlug: string,
): Promise<string> {
  const raw = normSlug(inferredSlug);
  if (!raw) return inferredSlug;

  const alias = SLUG_ALIASES[raw];
  if (alias) return alias;

  const nationalTail = stripNationalPrefix(raw);
  if (nationalTail) {
    const aliased = SLUG_ALIASES[nationalTail] ?? nationalTail;
    const hit = await pool.query<{ slug: string }>(
      `SELECT slug FROM countries WHERE lower(trim(slug)) = lower(trim($1)) LIMIT 1`,
      [aliased],
    );
    if (hit.rows[0]?.slug) return hit.rows[0].slug.toLowerCase();
  }

  const existing = await pool.query<{ slug: string }>(
    `SELECT slug FROM countries WHERE lower(trim(slug)) = lower(trim($1)) LIMIT 1`,
    [raw],
  );
  if (existing.rows[0]?.slug) return existing.rows[0].slug.toLowerCase();

  if (raw.length === 2) {
    const isoSlug = ISO_TO_SLUG[raw];
    const isoQ = await pool.query<{ slug: string }>(
      `SELECT slug FROM countries
       WHERE upper(trim(coalesce(iso_alpha_2::text, ''))) = upper($1)
       ORDER BY (lower(trim(slug)) = lower($2)) DESC, slug ASC
       LIMIT 1`,
      [raw, isoSlug ?? raw],
    );
    if (isoQ.rows[0]?.slug) return isoQ.rows[0].slug.toLowerCase();
    if (isoSlug) return isoSlug;
  }

  const humanized = raw.replace(/-/g, ' ');
  const byName = await pool.query<{ slug: string }>(
    `SELECT slug FROM countries
     WHERE lower(trim(name::text)) = lower(trim($1))
        OR lower(replace(trim(name::text), ' ', '-')) = lower($2)
     LIMIT 1`,
    [humanized, raw],
  );
  if (byName.rows[0]?.slug) return byName.rows[0].slug.toLowerCase();

  const slugified = slugifySegment(humanized, 96);
  if (slugified && slugified !== raw) {
    const again = await pool.query<{ slug: string }>(
      `SELECT slug FROM countries WHERE lower(trim(slug)) = lower(trim($1)) LIMIT 1`,
      [slugified],
    );
    if (again.rows[0]?.slug) return again.rows[0].slug.toLowerCase();
  }

  return raw;
}
