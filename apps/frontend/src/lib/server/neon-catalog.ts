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

type NeonRow = {
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
  country_slug: string;
  country_name: string;
  iso_alpha_2: string | null;
  region: string | null;
};

function toIso(d: unknown): string {
  if (d instanceof Date) return d.toISOString();
  if (typeof d === 'string') return d;
  return new Date().toISOString();
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

function rowToProduct(row: NeonRow): Product {
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
  const productTitle = [row.country_name, label].filter(Boolean).join(' — ').slice(0, 200);

  const fk = row.file_key?.trim();

  return {
    id: row.id,
    title: productTitle || label || row.country_name,
    slug: `nf-${row.id.toLowerCase()}`,
    detailPath: `/gallery/${row.country_slug}`,
    description: null,
    countryCode: row.iso_alpha_2?.trim()?.toUpperCase() ?? null,
    region: row.region,
    categoryId: SEED_IDS.catCountry,
    tags: [],
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
       c.slug AS country_slug,
       c.name AS country_name,
       c.iso_alpha_2,
       c.region::text AS region
     FROM country_flag_files cff
     INNER JOIN countries c ON c.id = cff.country_id
     WHERE cff.status = 'published'
     ORDER BY c.name ASC, cff.created_at ASC`
  );
  return res.rows.map(rowToProduct);
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
       c.slug AS country_slug,
       c.name AS country_name,
       c.iso_alpha_2,
       c.region::text AS region
     FROM country_flag_files cff
     INNER JOIN countries c ON c.id = cff.country_id
     WHERE cff.id = $1::uuid AND cff.status = 'published'
     LIMIT 1`,
    [id]
  );
  const row = res.rows[0];
  return row ? rowToProduct(row) : null;
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
    gallery_slug: string;
    file_title: string | null;
    variant_name: string | null;
    file_name: string;
    country_name: string;
  }>(
    `SELECT c.slug AS gallery_slug,
            cff.title AS file_title,
            cff.variant_name,
            cff.file_name,
            c.name AS country_name
     FROM country_flag_files cff
     INNER JOIN countries c ON c.id = cff.country_id
     WHERE cff.id = $1::uuid AND cff.status = 'published'
     LIMIT 1`,
    [id]
  );
  const row = res.rows[0];
  if (!row) return null;
  const label = (row.file_title?.trim() || row.variant_name?.trim() || row.file_name).trim();
  const title = [row.country_name, label].filter(Boolean).join(' — ');
  return { gallerySlug: row.gallery_slug, title: title || row.country_name };
}
