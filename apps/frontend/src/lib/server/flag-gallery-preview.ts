/**
 * Random grouped landing preview tiles — bounded DB read + deterministic grouping parity with marketplace.
 */

import { neonLikeRowGroupKey, type NeonLikeFlagRow } from '@/lib/marketplace/group-flag-products';
import { buildCatalogProductFromFlagBundle, NEON_SELECT_FIELDS } from '@/lib/server/neon-catalog';
import { getDb } from '@/lib/server/db';
import { publishedFlagHasMediaSql } from '@/lib/server/gallery-published-media';
import { resolveGalleryAssetUrl } from '@/lib/server/blob-site-proxy';
import { getPublicR2FileUrl } from '@/lib/server/cloudflare-r2';
import {
  fallbackUrlsForGalleryListThumb,
  previewDisplayUrlCandidates,
} from '@/lib/server/flag-asset-url';

/** Fisher–Yates shuffle */
function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** Preview-safe formats only (landing / cards). JPG → PNG → WEBP → SVG. No EPS/PDF/AI previews. */
const NON_BROWSER_PREVIEW_FMT = new Set(['eps', 'pdf', 'ai', 'psd']);

function previewRankForPick(format: string): number {
  const f = format.toLowerCase();
  const order = ['jpg', 'jpeg', 'png', 'webp', 'svg'];
  const i = order.indexOf(f);
  return i < 0 ? 50 + (f.charCodeAt(0) || 0) : i;
}

function rowTs(row: NeonLikeFlagRow): number {
  const t = Date.parse(row.updated_at || row.created_at);
  return Number.isFinite(t) ? t : 0;
}

/** Row used for URLs + badges — raster/web previews only where possible */
function pickMetadataRow(bundle: NeonLikeFlagRow[]): NeonLikeFlagRow {
  const imageLike = bundle.filter((r) => !NON_BROWSER_PREVIEW_FMT.has(r.format.toLowerCase()));
  const candidates = imageLike.length ? imageLike : bundle;
  const sorted = [...candidates].sort(
    (a, b) =>
      previewRankForPick(a.format) - previewRankForPick(b.format) || rowTs(b) - rowTs(a)
  );
  return sorted[0]!;
}

/**
 * Prefer `preview_url` → `thumbnail_url` → `file_url` (free rows only) before R2 object key resolution
 * so grid slots never inflate with premium originals when previews exist on the CDN.
 */
function landingCardImageHref(row: NeonLikeFlagRow): string {
  for (const raw of fallbackUrlsForGalleryListThumb({
    premiumTierRaw: row.premium_tier,
    previewUrl: row.preview_url,
    thumbnailUrl: row.thumbnail_url,
    fileUrl: row.file_url,
  })) {
    const out = resolveGalleryAssetUrl(raw);
    if (out) return out;
  }
  const key = row.file_key?.trim();
  if (key) {
    const href = getPublicR2FileUrl(key);
    if (href) return resolveGalleryAssetUrl(href);
  }
  return '';
}

function isFreeTier(raw: string | null | undefined): boolean {
  return (raw ?? 'free').toLowerCase() === 'free';
}

export type GalleryPreviewItemDTO = {
  id: string;
  title: string;
  country_slug: string | null;
  preview_url: string | null;
  thumbnail_url: string | null;
  file_url: string | null;
  /** Primary preview row format (browser-safe picks rank higher). */
  format: string;
  /** Resolved display URL — thumbnail → preview → file → keyed R2 fallback. */
  image_url: string;
  available_formats: string[];
  asset_group_key: string | null;
  slug: string;
};

const DEFAULT_SAMPLE = 380;

export type GalleryPreviewFetchOrder = 'random' | 'latest';

export async function fetchRandomGalleryPreviewItems(opts: {
  limit: number;
  sample?: number;
  /** `random`: varied tiles; `latest`: newest-published rows before grouping/shuffle-out. */
  order?: GalleryPreviewFetchOrder;
}): Promise<GalleryPreviewItemDTO[]> {
  const pool = getDb();
  const limit = Math.min(48, Math.max(1, opts.limit));
  const sample = Math.min(2000, Math.max(limit * 12, opts.sample ?? DEFAULT_SAMPLE));
  const order: GalleryPreviewFetchOrder = opts.order ?? 'random';
  const orderSql =
    order === 'latest'
      ? `ORDER BY COALESCE(cff.updated_at, cff.created_at) DESC NULLS LAST`
      : `ORDER BY random()`;

  const res = await pool.query<NeonLikeFlagRow>(
    `SELECT ${NEON_SELECT_FIELDS}
     FROM country_flag_files cff
     LEFT JOIN countries c ON c.id = cff.country_id
     WHERE cff.status = 'published'
       AND ${publishedFlagHasMediaSql('cff')}
     ${orderSql}
     LIMIT $1`,
    [sample]
  );

  const rows = res.rows;
  if (!rows.length) return [];

  const buckets = new Map<string, NeonLikeFlagRow[]>();
  for (const r of rows) {
    const k = neonLikeRowGroupKey(r);
    const arr = buckets.get(k) ?? [];
    arr.push(r);
    buckets.set(k, arr);
  }

  function bundleFreshness(bundle: NeonLikeFlagRow[]): number {
    return bundle.reduce((m, r) => Math.max(m, rowTs(r)), 0);
  }

  const keyList = [...buckets.keys()];
  const orderedKeys =
    order === 'latest'
      ? keyList.sort(
          (a, b) =>
            bundleFreshness(buckets.get(b)!) - bundleFreshness(buckets.get(a)!),
        )
      : shuffle(keyList);
  const pickedKeys = orderedKeys.slice(0, limit);

  const out: GalleryPreviewItemDTO[] = [];
  for (const key of pickedKeys) {
    const bundle = buckets.get(key);
    if (!bundle?.length) continue;

    const rep = pickMetadataRow(bundle);

    const product = buildCatalogProductFromFlagBundle(bundle);
    const imageUrl = landingCardImageHref(rep);
    if (!product || !imageUrl) continue;

    const formats = [
      ...new Set(bundle.map((b) => String(b.format || '').toLowerCase()).filter(Boolean)),
    ].sort();

    const fm = rep.format?.trim().toLowerCase();
    const previewFmt =
      fm && !NON_BROWSER_PREVIEW_FMT.has(fm)
        ? fm
        : [...formats].sort((a, b) => previewRankForPick(a) - previewRankForPick(b)).find((f) => !NON_BROWSER_PREVIEW_FMT.has(f)) ||
          '';

    out.push({
      id: product.id,
      title: product.title,
      country_slug: product.countrySlug ?? null,
      preview_url: rep.preview_url?.trim() ?? null,
      thumbnail_url: rep.thumbnail_url?.trim() ?? null,
      file_url: isFreeTier(rep.premium_tier) ? rep.file_url?.trim() ?? null : null,
      format: previewFmt,
      image_url: imageUrl,
      available_formats: formats,
      asset_group_key: rep.asset_group_key?.trim() || null,
      slug: product.slug,
    });
  }

  return order === 'random' ? shuffle(out) : out;
}
