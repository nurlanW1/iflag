/**
 * Map Railway `GET /api/assets` JSON rows → marketplace `PublicProduct` (grouped by `asset_group_key`).
 * Parallels server `neon-catalog` + `group-flag-products` so landing rails match browse.
 */

import type { Product } from '@/types/marketplace';
import { toPublicProduct, type PublicProduct } from '@/lib/marketplace/product-mapper';
import {
  productsFromNeonLikeRows,
  type NeonLikeFlagRow,
} from '@/lib/marketplace/group-flag-products';

/** Matches `SEED_IDS.catCountry` in `seed.ts` — inlined so client bundles avoid `seed.ts` (uses `fs` at import time). */
const SEED_CAT_COUNTRY_ID = '11111111-1111-4111-8111-111111111101';

/** Response item from backend `PublishedCountryFlagDTO`. */
export type RailwayPublishedFlagAsset = {
  id: string;
  title: string | null;
  country_slug: string | null;
  country_name?: string | null;
  file_name: string;
  file_key?: string | null;
  variant_name?: string | null;
  ratio?: string | null;
  asset_group_key?: string | null;
  display_title?: string | null;
  format: string;
  premium_tier?: string | null;
  price_cents?: number | null;
  file_url?: string | null;
  thumbnail_url?: string | null;
  preview_url?: string | null;
  mime_type?: string | null;
  file_size_bytes?: number | string | null;
  tags?: string[] | null;
  created_at: string;
  updated_at: string;
  iso_alpha_2?: string | null;
  region?: string | null;
};

function railToNeonLike(a: RailwayPublishedFlagAsset): NeonLikeFlagRow {
  return {
    id: String(a.id),
    file_name: a.file_name,
    variant_name: a.variant_name ?? null,
    ratio: a.ratio ?? null,
    title: a.title ?? null,
    asset_group_key: a.asset_group_key ?? null,
    display_title: a.display_title ?? null,
    format: String(a.format ?? ''),
    premium_tier: a.premium_tier ?? null,
    price_cents: a.price_cents ?? null,
    created_at: a.created_at,
    updated_at: a.updated_at,
    file_key: a.file_key ?? null,
    file_url: a.file_url ?? null,
    preview_url: a.preview_url ?? null,
    thumbnail_url: a.thumbnail_url ?? null,
    mime_type: a.mime_type ?? null,
    file_size_bytes: a.file_size_bytes ?? null,
    country_slug: a.country_slug ?? null,
    country_name: a.country_name ?? null,
    iso_alpha_2: a.iso_alpha_2 ?? null,
    region: a.region ?? null,
    tags: a.tags ?? null,
  };
}

function pickThumbRow(row: NeonLikeFlagRow): string | null {
  const tierRaw = (row.premium_tier ?? 'free').toLowerCase();
  const free = tierRaw === 'free';
  const pick = (...cands: Array<string | null | undefined>): string | null => {
    for (const c of cands) {
      const s = c?.trim();
      if (s) return s;
    }
    return null;
  };
  if (free) {
    return pick(row.preview_url, row.thumbnail_url, row.file_url);
  }
  return pick(row.preview_url, row.thumbnail_url);
}

function publicPreviewUrlForRow(row: NeonLikeFlagRow, thumb: string | null): string | null {
  const tierRaw = (row.premium_tier ?? 'free').toLowerCase();
  const isFree = tierRaw === 'free';
  const fmt = row.format.toLowerCase();
  const imgLike = ['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(fmt);
  return isFree && imgLike ? thumb : null;
}

const railGroupDeps = {
  thumbForRow: pickThumbRow,
  publicPreviewUrlForRow,
  categoryId: SEED_CAT_COUNTRY_ID,
};

/** Group Railway rows the same way as Neon catalog (one card per logical design when `asset_group_key` set). */
export function railwayPublishedFlagsToGroupedPublicProducts(
  rows: RailwayPublishedFlagAsset[]
): PublicProduct[] {
  const neonLike = rows.map(railToNeonLike);
  const products: Product[] = productsFromNeonLikeRows(neonLike, railGroupDeps);
  return products.map(toPublicProduct);
}

/** @deprecated Prefer `railwayPublishedFlagsToGroupedPublicProducts` for API lists. */
export function railwayPublishedFlagToPublicProduct(a: RailwayPublishedFlagAsset): PublicProduct {
  return railwayPublishedFlagsToGroupedPublicProducts([a])[0]!;
}
