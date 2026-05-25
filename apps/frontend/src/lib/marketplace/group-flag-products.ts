/**
 * Group Neon-like flag file rows into one marketplace Product per logical design (asset_group_key).
 * Shared by server-side `neon-catalog` and client-side Railway landing mapper (must stay DB-free).
 */

import { createHash } from 'crypto';
import type { Product, ProductFile, ProductLicenseInfo, ProductSeo } from '@/types/marketplace';
import { ONE_TIME_STOCK } from '@/lib/marketing/pricing-config';

export type NeonLikeFlagRow = {
  id: string;
  file_name: string;
  variant_name: string | null;
  ratio?: string | null;
  title: string | null;
  /** Design slug grouping multiple formats — when null, row is surfaced as its own solo product until backfilled. */
  asset_group_key: string | null;
  display_title: string | null;
  design_type?: string | null;
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

const defaultLicense: ProductLicenseInfo = {
  summary: '',
  detail: null,
};

const emptySeo: ProductSeo = {
  metaTitle: null,
  metaDescription: null,
  canonicalPath: null,
  ogImageUrl: null,
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

function previewRank(format: string): number {
  const f = format.toLowerCase();
  const order = ['png', 'jpg', 'jpeg', 'webp', 'svg'];
  const i = order.indexOf(f);
  return i < 0 ? 50 + f.charCodeAt(0) : i;
}

function rowTimestampMs(row: NeonLikeFlagRow): number {
  const t = Date.parse(row.updated_at || row.created_at);
  return Number.isFinite(t) ? t : 0;
}

/** Same format variants: prefer the newest updated row */
function dedupeRowsByFormat(rows: NeonLikeFlagRow[]): NeonLikeFlagRow[] {
  const m = new Map<string, NeonLikeFlagRow>();
  const sortedNewestFirst = [...rows].sort((a, b) => rowTimestampMs(b) - rowTimestampMs(a));
  for (const r of sortedNewestFirst) {
    const k = `${(r.format || '').toLowerCase()}::${(r.variant_name || '').toLowerCase()}::${(
      r.ratio || ''
    ).toLowerCase()}`;
    if (!m.has(k)) m.set(k, r);
  }
  return [...m.values()].sort(
    (a, b) => previewRank(a.format) - previewRank(b.format) || a.format.localeCompare(b.format)
  );
}

/** Canonical URL/detail slug derived from stored `asset_group_key` — keep aligned with Neon rows. */
export function slugFromAssetGroupKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function compositeGroupKey(row: NeonLikeFlagRow): string | null {
  const ag = row.asset_group_key?.trim();
  if (!ag) return null;
  const cs =
    row.country_slug?.trim().toLowerCase() ||
    row.country_name?.trim()?.toLowerCase().replace(/\s+/g, '-') ||
    'unknown';
  return `${cs}::${ag.toLowerCase()}`;
}

/** Stable bucket id for grouping + random sampling (solo rows → `solo:<uuid>`). */
export function neonLikeRowGroupKey(row: NeonLikeFlagRow): string {
  return compositeGroupKey(row) ?? `solo:${row.id}`;
}

function stableGroupedProductId(countrySlugNorm: string, assetGroupKey: string): string {
  const raw = `${countrySlugNorm.trim().toLowerCase()}::${assetGroupKey.trim().toLowerCase()}`;
  const h = createHash('sha256').update(raw, 'utf8').digest('hex').slice(0, 16);
  return `nf-ag-${h}`;
}

function tagsFromRow(row: NeonLikeFlagRow): string[] {
  const t = row.tags;
  if (!Array.isArray(t)) return [];
  return t.map((x) => String(x).trim()).filter(Boolean);
}

function rowCountrySlug(row: NeonLikeFlagRow): string {
  const countrySlugRaw =
    row.country_slug?.trim() ||
    row.country_name?.trim()?.toLowerCase().replace(/\s+/g, '-') ||
    null;
  return countrySlugRaw && countrySlugRaw.length > 0 ? countrySlugRaw : 'unknown';
}

function rowToProductFile(row: NeonLikeFlagRow, productId: string, sortOrder: number): ProductFile {
  const tierRaw = (row.premium_tier ?? 'free').toLowerCase();
  const isFree = tierRaw === 'free';
  const size =
    row.file_size_bytes != null
      ? typeof row.file_size_bytes === 'string'
        ? Number.parseInt(row.file_size_bytes, 10)
        : Number(row.file_size_bytes)
      : null;

  return {
    id: row.id,
    productId,
    tier: isFree ? 'preview_free' : 'pro',
    format: row.format,
    qualityLabel: 'Master',
    storageKey: row.file_key?.trim() ?? '',
    publicUrl: null,
    fileName: row.file_name,
    mimeType: row.mime_type?.trim() || 'application/octet-stream',
    bytes: Number.isFinite(size) ? size : null,
    sortOrder,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

function pickPreviewRow(rows: NeonLikeFlagRow[], thumbForRow: (r: NeonLikeFlagRow) => string | null): NeonLikeFlagRow {
  const sorted = [...rows].sort((a, b) => {
    const d = previewRank(a.format) - previewRank(b.format);
    if (d !== 0) return d;
    return rowTimestampMs(b) - rowTimestampMs(a);
  });
  for (const r of sorted) {
    if (thumbForRow(r)) return r;
  }
  return sorted[0]!;
}

function mergeTagSets(rows: NeonLikeFlagRow[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const r of rows) {
    for (const t of tagsFromRow(r)) {
      if (!seen.has(t)) {
        seen.add(t);
        out.push(t);
      }
    }
  }
  return out;
}

export function productsFromNeonLikeRows(
  rows: NeonLikeFlagRow[],
  deps: {
    thumbForRow: (r: NeonLikeFlagRow) => string | null;
    publicPreviewUrlForRow: (r: NeonLikeFlagRow, thumb: string | null) => string | null;
    categoryId: string;
  }
): Product[] {
  const solo: NeonLikeFlagRow[] = [];
  const groups = new Map<string, NeonLikeFlagRow[]>();

  for (const r of rows) {
    const k = compositeGroupKey(r);
    if (!k) {
      solo.push(r);
      continue;
    }
    const arr = groups.get(k) ?? [];
    arr.push(r);
    groups.set(k, arr);
  }

  const out: Product[] = [];

  for (const r of solo) {
    out.push(soloRowToProduct(r, deps));
  }

  for (const bundle of groups.values()) {
    out.push(groupedRowsToProduct(bundle, deps));
  }

  return out;
}

function soloRowToProduct(
  row: NeonLikeFlagRow,
  deps: {
    thumbForRow: (r: NeonLikeFlagRow) => string | null;
    publicPreviewUrlForRow: (r: NeonLikeFlagRow, thumb: string | null) => string | null;
    categoryId: string;
  }
): Product {
  const countrySlug = rowCountrySlug(row);
  const countryNameDisplay = row.country_name?.trim() || humanizeSlugForTitle(countrySlug);
  const thumb = deps.thumbForRow(row);
  const tierRaw = (row.premium_tier ?? 'free').toLowerCase();
  const isFree = tierRaw === 'free';
  const fmt = row.format.toLowerCase();
  const imgLike = ['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(fmt);
  const publicUrlForPreview = deps.publicPreviewUrlForRow(row, thumb);
  const previewForFile = isFree && imgLike ? publicUrlForPreview : null;

  const file: ProductFile = {
    ...rowToProductFile(row, row.id, 0),
    publicUrl: previewForFile,
  };

  const label = (row.title?.trim() || row.variant_name?.trim() || row.file_name).trim();
  const productTitle = [countryNameDisplay, label].filter(Boolean).join(' — ').slice(0, 200);

  const fk = row.file_key?.trim();
  const slug = `nf-${row.id.toLowerCase()}`;
  const detailPath = `/assets/${slug}`;
  const canonicalPath = detailPath;

  return {
    id: row.id,
    title: productTitle || label || countryNameDisplay,
    slug,
    countrySlug,
    assetGroupKey: row.asset_group_key?.trim() || null,
    detailPath,
    description: null,
    countryCode: row.iso_alpha_2?.trim()?.toUpperCase() ?? null,
    region: row.region,
    categoryId: deps.categoryId,
    tags: tagsFromRow(row),
    thumbnailUrl: thumb,
    previewUrl: thumb,
    freeDownloadUrl: isFree ? previewForFile : null,
    proFileKeys:
      !isFree && fk
        ? [{ fileId: row.id, format: row.format, qualityLabel: 'Master', storageKey: fk }]
        : [],
    files: [file],
    license: defaultLicense,
    priceCents: isFree
      ? Math.max(0, row.price_cents ?? 0)
      : Math.max(ONE_TIME_STOCK.displayCents, row.price_cents ?? ONE_TIME_STOCK.displayCents),
    currency: 'USD',
    isFeatured: false,
    isPublished: true,
    seo: { ...emptySeo, canonicalPath },
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

function groupedRowsToProduct(
  rowsIn: NeonLikeFlagRow[],
  deps: {
    thumbForRow: (r: NeonLikeFlagRow) => string | null;
    publicPreviewUrlForRow: (r: NeonLikeFlagRow, thumb: string | null) => string | null;
    categoryId: string;
  }
): Product {
  const rows = dedupeRowsByFormat(rowsIn);
  const first = rows[0]!;
  const countrySlug = rowCountrySlug(first);
  const agKey = first.asset_group_key!.trim();
  const productId = stableGroupedProductId(countrySlug, agKey);
  const slugCanon = slugFromAssetGroupKey(agKey);
  const slug = slugCanon.length > 0 ? slugCanon : slugFromHash(productId);
  const detailPath = `/assets/${slug}`;
  const canonicalPath = detailPath;

  const pk = pickPreviewRow(rows, deps.thumbForRow);
  const thumb = deps.thumbForRow(pk);
  const display =
    rows.map((r) => r.display_title?.trim()).find((t) => t && t.length > 0) ||
    [first.country_name?.trim() || humanizeSlugForTitle(countrySlug), agKey.replace(/-/g, ' ')].join(' — ').slice(0, 200);

  const tagUnion = mergeTagSets(rows);

  let maxPrice = 0;
  let anyPaid = false;
  const files: ProductFile[] = [];
  rows.forEach((row, idx) => {
    const tierRaw = (row.premium_tier ?? 'free').toLowerCase();
    const isFree = tierRaw === 'free';
    const fmt = row.format.toLowerCase();
    const imgLike = ['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(fmt);
    const rowThumb = deps.thumbForRow(row);
    const publicUrlForPreview = deps.publicPreviewUrlForRow(row, rowThumb);
    const previewForFile = isFree && imgLike ? publicUrlForPreview : null;

    const base = rowToProductFile(row, productId, idx);
    files.push({ ...base, publicUrl: previewForFile });

    const rawPc = row.price_cents ?? (isFree ? 0 : ONE_TIME_STOCK.displayCents);
    const pc = isFree ? Math.max(0, rawPc) : Math.max(ONE_TIME_STOCK.displayCents, rawPc);
    maxPrice = Math.max(maxPrice, pc);
    if (!isFree || pc > 0) anyPaid = true;
  });

  const fkList = rows
    .filter((r) => (r.premium_tier ?? 'free').toLowerCase() !== 'free')
    .map((r) => ({
      fileId: r.id,
      format: r.format,
      qualityLabel: 'Master' as const,
      storageKey: r.file_key?.trim() ?? '',
    }))
    .filter((x) => x.storageKey.length > 0);

  /** Earliest publish timestamp for sorting */
  const createdAtIso = rows
    .map((r) => toIso(r.created_at))
    .sort()[0];
  const updatedAtIso = rows
    .map((r) => toIso(r.updated_at))
    .sort()
    .pop()!;

  return {
    id: productId,
    title: display,
    slug,
    countrySlug,
    assetGroupKey: agKey,
    detailPath,
    description: null,
    countryCode: first.iso_alpha_2?.trim()?.toUpperCase() ?? null,
    region: first.region,
    categoryId: deps.categoryId,
    tags: tagUnion,
    thumbnailUrl: thumb,
    previewUrl: thumb,
    freeDownloadUrl: files.some((f) => f.publicUrl != null && String(f.publicUrl).trim() !== '')
      ? files.find((f) => f.publicUrl != null && String(f.publicUrl).trim() !== '')?.publicUrl ?? null
      : null,
    proFileKeys: fkList,
    files,
    license: defaultLicense,
    priceCents: anyPaid ? maxPrice : 0,
    currency: 'USD',
    isFeatured: false,
    isPublished: true,
    seo: { ...emptySeo, canonicalPath },
    createdAt: createdAtIso,
    updatedAt: updatedAtIso,
  };
}

function slugFromHash(productId: string): string {
  return productId.replace(/^nf-ag-/, 'flag-pack-');
}
