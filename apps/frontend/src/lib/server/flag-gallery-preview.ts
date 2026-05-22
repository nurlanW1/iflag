/**
 * Random grouped landing preview tiles — bounded DB read + deterministic grouping parity with marketplace.
 */

import { neonLikeRowGroupKey, type NeonLikeFlagRow } from '@/lib/marketplace/group-flag-products';
import { buildCatalogProductFromFlagBundle, NEON_SELECT_FIELDS } from '@/lib/server/neon-catalog';
import { getDb } from '@/lib/server/db';

/** Fisher–Yates shuffle */
function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

function previewRankForPick(format: string): number {
  const f = format.toLowerCase();
  const order = ['png', 'jpg', 'jpeg', 'webp', 'svg'];
  const i = order.indexOf(f);
  return i < 0 ? 50 + (f.charCodeAt(0) || 0) : i;
}

function rowTs(row: NeonLikeFlagRow): number {
  const t = Date.parse(row.updated_at || row.created_at);
  return Number.isFinite(t) ? t : 0;
}

/** Row used for metadata fields — prefer raster/web over EPS/PDF for listed URLs when possible */
function pickMetadataRow(bundle: NeonLikeFlagRow[]): NeonLikeFlagRow {
  const nonPrint = bundle.filter((r) => !['eps', 'pdf'].includes(r.format.toLowerCase()));
  const candidates = nonPrint.length ? nonPrint : bundle;
  const sorted = [...candidates].sort(
    (a, b) =>
      previewRankForPick(a.format) - previewRankForPick(b.format) || rowTs(b) - rowTs(a)
  );
  return sorted[0]!;
}

export type GalleryPreviewItemDTO = {
  id: string;
  title: string;
  country_slug: string | null;
  preview_url: string | null;
  thumbnail_url: string | null;
  file_url: string | null;
  /** Resolved safe URL for <img /> (respects Neon/R2 helpers inside Product build). */
  image_url: string;
  available_formats: string[];
  asset_group_key: string | null;
  slug: string;
};

const DEFAULT_SAMPLE = 380;

export async function fetchRandomGalleryPreviewItems(opts: {
  limit: number;
  sample?: number;
}): Promise<GalleryPreviewItemDTO[]> {
  const pool = getDb();
  const limit = Math.min(48, Math.max(1, opts.limit));
  const sample = Math.min(2000, Math.max(limit * 12, opts.sample ?? DEFAULT_SAMPLE));

  const res = await pool.query<NeonLikeFlagRow>(
    `SELECT ${NEON_SELECT_FIELDS}
     FROM country_flag_files cff
     LEFT JOIN countries c ON c.id = cff.country_id
     WHERE cff.status = 'published'
       AND cff.file_url IS NOT NULL
       AND trim(cff.file_url) <> ''
     ORDER BY random()
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

  const keys = shuffle([...buckets.keys()]);
  const pickedKeys = keys.slice(0, limit);

  const out: GalleryPreviewItemDTO[] = [];
  for (const key of pickedKeys) {
    const bundle = buckets.get(key);
    if (!bundle?.length) continue;

    const product = buildCatalogProductFromFlagBundle(bundle);
    const imageUrl = product?.thumbnailUrl?.trim() || product?.previewUrl?.trim();
    if (!product || !imageUrl) continue;

    const rep = pickMetadataRow(bundle);
    const formats = [
      ...new Set(bundle.map((b) => String(b.format || '').toLowerCase()).filter(Boolean)),
    ].sort();

    out.push({
      id: product.id,
      title: product.title,
      country_slug: product.countrySlug ?? null,
      preview_url: rep.preview_url?.trim() ?? null,
      thumbnail_url: rep.thumbnail_url?.trim() ?? null,
      file_url: rep.file_url?.trim() ?? null,
      image_url: imageUrl,
      available_formats: formats,
      asset_group_key: rep.asset_group_key?.trim() || null,
      slug: product.slug,
    });
  }

  return shuffle(out);
}
