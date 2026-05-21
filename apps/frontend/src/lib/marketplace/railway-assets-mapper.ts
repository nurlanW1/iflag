/**
 * Map Railway `GET /api/assets` JSON rows → marketplace `PublicProduct`.
 * Keeps Neon/R2 thumbnails policy in sync with `neon-catalog` (no exposing paid `file_url` in grids when avoidable).
 */

import type { Product, ProductFile } from '@/types/marketplace';
import { toPublicProduct, type PublicProduct } from '@/lib/marketplace/product-mapper';

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
  format: string;
  premium_tier?: string | null;
  price_cents?: number | null;
  file_url?: string | null;
  thumbnail_url?: string | null;
  preview_url?: string | null;
  mime_type?: string | null;
  file_size_bytes?: number | null;
  tags?: string[] | null;
  created_at: string;
  updated_at: string;
  iso_alpha_2?: string | null;
  region?: string | null;
};

function toIso(d: unknown): string {
  if (d instanceof Date) return d.toISOString();
  if (typeof d === 'string') return d;
  return new Date().toISOString();
}

function humanizeSlugForTitle(slug: string): string {
  return slug
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function pickThumb(a: RailwayPublishedFlagAsset): string | null {
  const tierRaw = (a.premium_tier ?? 'free').toLowerCase();
  const free = tierRaw === 'free';
  const pick = (...cands: Array<string | null | undefined>): string | null => {
    for (const c of cands) {
      const s = c?.trim();
      if (s) return s;
    }
    return null;
  };
  if (free) {
    return pick(a.preview_url, a.thumbnail_url, a.file_url);
  }
  return pick(a.preview_url, a.thumbnail_url);
}

function tagsFrom(a: RailwayPublishedFlagAsset): string[] {
  const t = a.tags;
  if (!Array.isArray(t)) return [];
  return t.map((x) => String(x).trim()).filter(Boolean);
}

/** Convert Railway catalog row → `PublicProduct` for landing / browse parity. */
export function railwayPublishedFlagToPublicProduct(a: RailwayPublishedFlagAsset): PublicProduct {
  const countrySlugRaw =
    a.country_slug?.trim() ||
    a.country_name?.trim()?.toLowerCase().replace(/\s+/g, '-') ||
    null;
  const countrySlug =
    countrySlugRaw && countrySlugRaw.length > 0 ? countrySlugRaw : 'unknown';

  const countryNameDisplay =
    a.country_name?.trim() ||
    humanizeSlugForTitle(countrySlug === 'unknown' ? 'Imported' : countrySlug);

  const tierRaw = (a.premium_tier ?? 'free').toLowerCase();
  const isFree = tierRaw === 'free';
  const thumb = pickThumb(a);
  const fmt = String(a.format ?? '').toLowerCase();
  const imgLike = ['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(fmt);
  const publicUrlForPreview = isFree && imgLike ? thumb : null;

  const size = a.file_size_bytes;

  const file: ProductFile = {
    id: a.id,
    productId: a.id,
    tier: isFree ? 'preview_free' : 'pro',
    format: a.format || 'svg',
    qualityLabel: 'Master',
    storageKey: (a.file_key ?? '').trim(),
    publicUrl: publicUrlForPreview,
    fileName: a.file_name,
    mimeType: (a.mime_type ?? 'application/octet-stream').trim() || 'application/octet-stream',
    bytes:
      typeof size === 'number' && Number.isFinite(size)
        ? size
        : typeof size === 'string' && Number.parseInt(size, 10)
          ? Number.parseInt(size, 10)
          : null,
    sortOrder: 0,
    createdAt: toIso(a.created_at),
    updatedAt: toIso(a.updated_at),
  };

  const label = (a.title?.trim() || a.variant_name?.trim() || a.file_name || '').trim();
  const productTitle = [countryNameDisplay, label].filter(Boolean).join(' — ').slice(0, 200);

  const fk = a.file_key?.trim();

  const product: Product = {
    id: a.id,
    title: productTitle || label || countryNameDisplay,
    slug: `nf-${String(a.id).toLowerCase()}`,
    detailPath: `/gallery/${countrySlug}`,
    description: null,
    countryCode: a.iso_alpha_2?.trim()?.toUpperCase() ?? null,
    region: a.region ?? null,
    categoryId: SEED_CAT_COUNTRY_ID,
    tags: tagsFrom(a),
    thumbnailUrl: thumb,
    previewUrl: thumb,
    freeDownloadUrl: isFree ? publicUrlForPreview : null,
    proFileKeys:
      !isFree && fk
        ? [{ fileId: a.id, format: a.format || 'svg', qualityLabel: 'Master', storageKey: fk }]
        : [],
    files: [file],
    license: {
      summary: 'License terms apply at checkout and on the product page.',
      detail: null,
    },
    priceCents: Math.max(0, a.price_cents ?? 0),
    currency: 'USD',
    isFeatured: false,
    isPublished: true,
    seo: { metaTitle: null, metaDescription: null, canonicalPath: null, ogImageUrl: null },
    createdAt: toIso(a.created_at),
    updatedAt: toIso(a.updated_at),
  };

  return toPublicProduct(product);
}
