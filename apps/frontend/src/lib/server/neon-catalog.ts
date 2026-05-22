/**
 * Map published `country_flag_files` (+ countries) into grouped marketplace `Product` rows
 * so multi-format designs surface as one card with several files.
 */

import { SEED_IDS } from '@/services/marketplace/seed';
import type { Product } from '@/types/marketplace';
import { getDb } from '@/lib/server/db';
import {
  fallbackUrlsForGalleryListThumb,
  resolvedFlagPublicHref,
} from '@/lib/server/flag-asset-url';
import {
  productsFromNeonLikeRows,
  slugFromAssetGroupKey,
  type NeonLikeFlagRow,
} from '@/lib/marketplace/group-flag-products';

export type CountryFlagCatalogRow = NeonLikeFlagRow;

function thumbForCatalogRow(row: NeonLikeFlagRow): string | null {
  const href = resolvedFlagPublicHref({
    fileKey: row.file_key,
    fallbackRawUrls: fallbackUrlsForGalleryListThumb({
      premiumTierRaw: row.premium_tier,
      fileUrl: row.file_url,
      previewUrl: row.preview_url,
      thumbnailUrl: row.thumbnail_url,
    }),
  });
  return href?.trim() ? href : null;
}

function publicPreviewUrlForRow(row: NeonLikeFlagRow, thumb: string | null): string | null {
  const tierRaw = (row.premium_tier ?? 'free').toLowerCase();
  const isFree = tierRaw === 'free';
  const fmt = row.format.toLowerCase();
  const imgLike = ['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(fmt);
  return isFree && imgLike ? thumb : null;
}

const catalogBuildDeps = {
  thumbForRow: thumbForCatalogRow,
  publicPreviewUrlForRow,
  categoryId: SEED_IDS.catCountry,
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const NEON_SELECT_FIELDS = `
       cff.id,
       cff.file_name,
       cff.variant_name,
       cff.ratio,
       cff.title,
       cff.asset_group_key,
       cff.display_title,
       cff.format,
       cff.premium_tier,
       cff.price_cents,
       cff.created_at,
       cff.updated_at,
       cff.file_key,
       cff.file_url,
       cff.preview_url,
       cff.thumbnail_url,
       cff.mime_type,
       cff.file_size_bytes,
       cff.tags,
       COALESCE(NULLIF(trim(c.slug), ''), NULLIF(trim(cff.country_slug), '')) AS country_slug,
       COALESCE(NULLIF(trim(c.name), ''), NULLIF(trim(cff.country_slug), '')) AS country_name,
       c.iso_alpha_2,
       c.region::text AS region`;

/**
 * Published flag rows from Neon — safe to call only from server (Route Handler / RSC).
 * Returns one grouped product when `asset_group_key` matches across formats.
 */
export async function fetchNeonCatalogProducts(): Promise<Product[]> {
  const pool = getDb();
  const res = await pool.query<CountryFlagCatalogRow>(
    `SELECT ${NEON_SELECT_FIELDS}
     FROM country_flag_files cff
     LEFT JOIN countries c ON c.id = cff.country_id
     WHERE cff.status = 'published'
     ORDER BY COALESCE(c.name, cff.country_slug, '') ASC, cff.created_at ASC`
  );
  return productsFromNeonLikeRows(res.rows as NeonLikeFlagRow[], catalogBuildDeps);
}

/** Map a browse/search row directly to a singleton product bundle (utilities / tooling). */
export function countryFlagCatalogRowToProduct(row: CountryFlagCatalogRow): Product {
  return productsFromNeonLikeRows([row], catalogBuildDeps)[0]!;
}

/** Single grouped or solo marketplace product built from matching file rows (e.g. random landing preview). */
export function buildCatalogProductFromFlagBundle(rows: NeonLikeFlagRow[]): Product | null {
  if (!rows.length) return null;
  return productsFromNeonLikeRows(rows, catalogBuildDeps)[0] ?? null;
}

function slugCandidatesForLookup(rawSlug: string): string[] {
  const t = rawSlug.trim().toLowerCase();
  const norm = slugFromAssetGroupKey(rawSlug).toLowerCase();
  return [...new Set([t, norm].filter((x) => x.length > 0))];
}

/**
 * Neon product by slug:
 * - `nf-{uuid}` — legacy Neon file (`country_flag_files.id`)
 * - otherwise — hyphenated grouped slug matched against `asset_group_key` (+ normalized variant).
 */
export async function getNeonCatalogProductBySlug(slug: string): Promise<Product | null> {
  const raw = slug.trim();
  const lower = raw.toLowerCase();
  const pool = getDb();

  if (lower.startsWith('nf-')) {
    const id = raw.slice(3).trim();
    if (UUID_RE.test(id)) {
      const res = await pool.query<CountryFlagCatalogRow>(
        `SELECT ${NEON_SELECT_FIELDS}
         FROM country_flag_files cff
         LEFT JOIN countries c ON c.id = cff.country_id
         WHERE cff.id = $1::uuid AND cff.status = 'published'
         LIMIT 1`,
        [id]
      );
      const row = res.rows[0];
      return row ? productsFromNeonLikeRows([row as NeonLikeFlagRow], catalogBuildDeps)[0]! : null;
    }
    return null;
  }

  const candidates = slugCandidatesForLookup(raw);
  const res = await pool.query<CountryFlagCatalogRow>(
    `SELECT ${NEON_SELECT_FIELDS}
     FROM country_flag_files cff
     LEFT JOIN countries c ON c.id = cff.country_id
     WHERE cff.status = 'published'
       AND trim(cff.asset_group_key) <> ''
       AND lower(trim(cff.asset_group_key)) = ANY($1::text[])`,
    [candidates]
  );

  const rows = res.rows as NeonLikeFlagRow[];
  return rows.length ? productsFromNeonLikeRows(rows, catalogBuildDeps)[0]! : null;
}

export async function getNeonGalleryRedirectForProductSlug(
  slug: string
): Promise<{ gallerySlug: string; title: string } | null> {
  const p = await getNeonCatalogProductBySlug(slug);
  if (!p) return null;
  return {
    gallerySlug: (p.countrySlug ?? 'browse').trim() || 'browse',
    title: p.title,
  };
}
