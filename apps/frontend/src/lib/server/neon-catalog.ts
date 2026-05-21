/**
 * Map published `country_flag_files` (+ countries) into marketplace `Product` rows
 * so browse/search can surface Neon + R2 inventory alongside seeded catalog JSON.
 */

import { SEED_IDS } from '@/services/marketplace/seed';
import type { Product, ProductFile, ProductLicenseInfo, ProductSeo } from '@/types/marketplace';
import { getDb } from '@/lib/server/db';
import {
  fallbackUrlsForGalleryListThumb,
  resolvedFlagPublicHref,
} from '@/lib/server/flag-asset-url';

const defaultLicense: ProductLicenseInfo = {
  summary: 'License terms apply at checkout and on the product page.',
  detail: null,
};

const defaultSeo: ProductSeo = {
  metaTitle: null,
  metaDescription: null,
  canonicalPath: null,
  ogImageUrl: null,
};

/** Neon `country_flag_files` row joined with countries (nullable when country_id orphaned). */
export type CountryFlagCatalogRow = {
  id: string;
  file_name: string;
  variant_name: string | null;
  title: string | null;
  format: string;
  premium_tier: string | null;
  price_cents: number | null;
  created_at: string;
  updated_at: string;
  file_key: string | null;
  file_url: string | null;
  preview_url: string | null;
  thumbnail_url: string | null;
  mime_type: string | null;
  file_size_bytes: string | number | null;
  country_slug: string | null;
  country_name: string | null;
  iso_alpha_2: string | null;
  region: string | null;
  tags?: string[] | null;
};

type NeonRow = CountryFlagCatalogRow;

function toIso(d: unknown): string {
  if (d instanceof Date) return d.toISOString();
  if (typeof d === 'string') return d;
  return new Date().toISOString();
}

/** Map a published flag row → marketplace `Product` (browse/detail/search). Exported for Railway `/assets` JSON. */
export function countryFlagCatalogRowToProduct(row: CountryFlagCatalogRow): Product {
  return neonRowToProduct(row);
}

function thumbForRow(row: NeonRow): string | null {
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

function tagsFromRow(row: NeonRow): string[] {
  const t = row.tags;
  if (!Array.isArray(t)) return [];
  return t.map((x) => String(x).trim()).filter(Boolean);
}

function neonRowToProduct(row: NeonRow): Product {
  const countrySlugRaw =
    row.country_slug?.trim() ||
    row.country_name?.trim()?.toLowerCase().replace(/\s+/g, '-') ||
    null;
  const countrySlug =
    countrySlugRaw && countrySlugRaw.length > 0 ? countrySlugRaw : 'unknown';
  const countryNameDisplay = row.country_name?.trim() || humanizeSlugForTitle(countrySlug);

  const tierRaw = (row.premium_tier ?? 'free').toLowerCase();
  const isFree = tierRaw === 'free';
  const thumb = thumbForRow(row);
  const fmt = row.format.toLowerCase();
  const imgLike = ['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(fmt);
  const publicUrlForPreview = isFree && imgLike ? thumb : null;
  const size =
    row.file_size_bytes != null
      ? typeof row.file_size_bytes === 'string'
        ? Number.parseInt(row.file_size_bytes, 10)
        : Number(row.file_size_bytes)
      : null;

  const file: ProductFile = {
    id: row.id,
    productId: row.id,
    tier: isFree ? 'preview_free' : 'pro',
    format: row.format,
    qualityLabel: 'Master',
    storageKey: row.file_key?.trim() ?? '',
    publicUrl: publicUrlForPreview,
    fileName: row.file_name,
    mimeType: row.mime_type?.trim() || 'application/octet-stream',
    bytes: Number.isFinite(size) ? size : null,
    sortOrder: 0,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };

  const label = (row.title?.trim() || row.variant_name?.trim() || row.file_name).trim();
  const productTitle = [countryNameDisplay, label].filter(Boolean).join(' — ').slice(0, 200);

  const fk = row.file_key?.trim();

  return {
    id: row.id,
    title: productTitle || label || countryNameDisplay,
    slug: `nf-${row.id.toLowerCase()}`,
    detailPath: `/gallery/${countrySlug}`,
    description: null,
    countryCode: row.iso_alpha_2?.trim()?.toUpperCase() ?? null,
    region: row.region,
    categoryId: SEED_IDS.catCountry,
    tags: tagsFromRow(row),
    thumbnailUrl: thumb,
    previewUrl: thumb,
    freeDownloadUrl: isFree ? publicUrlForPreview : null,
    proFileKeys:
      !isFree && fk
        ? [{ fileId: row.id, format: row.format, qualityLabel: 'Master', storageKey: fk }]
        : [],
    files: [file],
    license: defaultLicense,
    priceCents: Math.max(0, row.price_cents ?? 0),
    currency: 'USD',
    isFeatured: false,
    isPublished: true,
    seo: defaultSeo,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

function humanizeSlugForTitle(slug: string): string {
  return slug
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/** Published flag files from Neon — safe to call only from server (Route Handler / RSC). */
export async function fetchNeonCatalogProducts(): Promise<Product[]> {
  const pool = getDb();
  const res = await pool.query<NeonRow>(
    `SELECT
       cff.id,
       cff.file_name,
       cff.variant_name,
       cff.title,
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
       c.region::text AS region
     FROM country_flag_files cff
     LEFT JOIN countries c ON c.id = cff.country_id
     WHERE cff.status = 'published'
     ORDER BY COALESCE(c.name, cff.country_slug, '') ASC, cff.created_at ASC`
  );
  return res.rows.map(neonRowToProduct);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Single catalog product for `nf-{uuid}` slugs (API `/api/marketplace/products/[slug]`). */
export async function getNeonCatalogProductBySlug(slug: string): Promise<Product | null> {
  if (!slug.toLowerCase().startsWith('nf-')) return null;
  const id = slug.slice(3).trim();
  if (!UUID_RE.test(id)) return null;
  const pool = getDb();
  const res = await pool.query<NeonRow>(
    `SELECT
       cff.id,
       cff.file_name,
       cff.variant_name,
       cff.title,
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
       c.region::text AS region
     FROM country_flag_files cff
     LEFT JOIN countries c ON c.id = cff.country_id
     WHERE cff.id = $1::uuid AND cff.status = 'published'
     LIMIT 1`,
    [id]
  );
  const row = res.rows[0];
  return row ? neonRowToProduct(row) : null;
}

/** Resolve `nf-{uuid}` slug for metadata when the product is not in the in-memory catalog. */
export async function getNeonGalleryRedirectForProductSlug(
  slug: string
): Promise<{ gallerySlug: string; title: string } | null> {
  if (!slug.toLowerCase().startsWith('nf-')) return null;
  const id = slug.slice(3).trim();
  if (!UUID_RE.test(id)) {
    return null;
  }
  const pool = getDb();
  const res = await pool.query<{
    gallery_slug: string | null;
    slug_fallback: string | null;
    file_title: string | null;
    variant_name: string | null;
    file_name: string;
    country_name: string | null;
  }>(
    `SELECT
       NULLIF(trim(c.slug), '') AS gallery_slug,
       NULLIF(trim(cff.country_slug), '') AS slug_fallback,
       cff.title AS file_title,
       cff.variant_name,
       cff.file_name,
       COALESCE(NULLIF(trim(c.name), ''), NULLIF(trim(cff.country_slug), '')) AS country_name
     FROM country_flag_files cff
     LEFT JOIN countries c ON c.id = cff.country_id
     WHERE cff.id = $1::uuid AND cff.status = 'published'
     LIMIT 1`,
    [id]
  );
  const row = res.rows[0];
  if (!row) return null;
  const resolvedGallerySlug = row.gallery_slug || row.slug_fallback;
  if (!resolvedGallerySlug) return null;
  const cn = row.country_name?.trim() || humanizeSlugForTitle(resolvedGallerySlug);
  const label = (row.file_title?.trim() || row.variant_name?.trim() || row.file_name).trim();
  const title = [cn, label].filter(Boolean).join(' — ');
  return { gallerySlug: resolvedGallerySlug, title: title || cn };
}
