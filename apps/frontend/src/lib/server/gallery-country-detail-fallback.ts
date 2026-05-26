/**
 * Build country folder payload from Railway `GET /api/assets?country_slug=…` when Neon is unavailable.
 */

import { getCountryCode } from '@/lib/country-mapping';
import { buildCountryHubDescription } from '@/lib/gallery/country-hub-copy';
import { resolveGalleryDisplayName } from '@/lib/gallery-display-name';
import { slugFromAssetGroupKey } from '@/lib/marketplace/group-flag-products';
import { joinBackendApiPath, resolveBackendApiBase } from '@/lib/auth/backend-url';
import { resolveGalleryAssetUrl } from '@/lib/server/blob-site-proxy';
import { getPublicR2FileUrl } from '@/lib/server/cloudflare-r2';
import {
  galleryVariantThumbCandidates,
  resolvedFlagPublicHref,
} from '@/lib/server/flag-asset-url';
import type { CountryGalleryPayload } from '@/lib/server/gallery-from-db';
import { isPreviewOnlyFormat } from '@/lib/server/flag-preview-formats';
import { isPackFallbackFlagThumbnail } from '@/lib/server/gallery-from-db';

type BackendFlagRow = {
  id: string;
  country_slug: string | null;
  country_name: string | null;
  iso_alpha_2?: string | null;
  region?: string | null;
  file_name: string;
  file_key: string | null;
  file_url: string | null;
  preview_url: string | null;
  thumbnail_url: string | null;
  premium_tier: string | null;
  format: string;
  asset_group_key?: string | null;
  display_title?: string | null;
  variant_name?: string | null;
  design_type?: string | null;
  file_size_bytes?: number | string | null;
  width?: number | null;
  height?: number | null;
};

function previewForRow(row: BackendFlagRow): string {
  const href = resolvedFlagPublicHref({
    fileKey: row.file_key,
    fallbackRawUrls: galleryVariantThumbCandidates({
      format: row.format,
      premiumTierRaw: row.premium_tier,
      previewUrl: row.preview_url,
      thumbnailUrl: row.thumbnail_url,
      fileUrl: row.file_url,
    }),
  });
  if (href) return resolveGalleryAssetUrl(href);
  const key = row.file_key?.trim();
  if (key) {
    const built = getPublicR2FileUrl(key);
    if (built) return resolveGalleryAssetUrl(built);
  }
  return '';
}

export async function fetchCountryGalleryFromBackendApi(
  slug: string,
): Promise<CountryGalleryPayload | null> {
  const resolved = resolveBackendApiBase();
  if (!resolved.ok) return null;

  const q = encodeURIComponent(slug.trim());
  const url = joinBackendApiPath(resolved.baseUrl, `/assets?country_slug=${q}&limit=500`);
  let rows: BackendFlagRow[] = [];
  try {
    const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return null;
    const j = (await res.json()) as { data?: BackendFlagRow[] };
    rows = j.data ?? [];
  } catch {
    return null;
  }
  if (!rows.length) return null;

  const name =
    rows[0]?.country_name?.trim() ||
    resolveGalleryDisplayName(slug, rows[0]?.iso_alpha_2 ?? null, slug);
  const code =
    rows[0]?.iso_alpha_2?.trim()?.toUpperCase() ||
    getCountryCode(name)?.toUpperCase() ||
    null;

  type VariantAcc = CountryGalleryPayload['variants'][number] & {
    _formats: CountryGalleryPayload['variants'][number]['formats'];
  };

  const groups = new Map<string, VariantAcc>();

  for (const row of rows) {
    const stem =
      row.variant_name?.trim() ||
      row.file_name.replace(/\.[^.]+$/, '').trim() ||
      row.id;
    const key = `stem:${stem.toLowerCase()}`;

    const ag = row.asset_group_key?.trim() || `solo:${row.id}`;
    let v = groups.get(key);
    if (!v) {
      v = {
        id: `${slug}-design-${groups.size}`,
        productSlug: slugFromAssetGroupKey(ag) || `nf-${row.id}`,
        name:
          row.display_title?.trim() ||
          row.variant_name?.trim() ||
          row.file_name.replace(/\.[^.]+$/, '') ||
          'Design',
        type: (row.design_type ?? 'design').replace(/_/g, ' '),
        thumbnail: '',
        formats: [],
        _formats: [],
      };
      groups.set(key, v);
    }

    const preview = previewForRow(row);
    const sz =
      row.file_size_bytes != null
        ? Number.parseInt(String(row.file_size_bytes), 10)
        : NaN;
    const previewOnly = isPreviewOnlyFormat(row.format);
    const tier = (row.premium_tier ?? 'free').toLowerCase() === 'free' ? 'free' : 'paid';

    v._formats.push({
      id: row.id,
      format: row.format.toUpperCase(),
      formatCode: row.format.toLowerCase() === 'jpeg' ? 'jpg' : row.format.toLowerCase(),
      category: ['svg', 'eps', 'pdf', 'ai'].includes(row.format.toLowerCase())
        ? 'vector'
        : 'raster',
      file: row.file_name,
      previewUrl: preview,
      premiumTier: previewOnly ? 'paid' : tier === 'free' ? 'free' : 'paid',
      downloadProtected: previewOnly || tier !== 'free',
      size: Number.isFinite(sz) ? `${sz} B` : 'Unknown',
      dimensions: 'Original',
    });

    if (preview && (!v.thumbnail || row.format.toLowerCase() === 'png')) {
      v.thumbnail = preview;
    }
  }

  const variants = [...groups.values()]
    .filter((v) => v._formats.length > 0)
    .map(({ _formats, ...rest }) => ({
      ...rest,
      formats: _formats,
    }));

  if (!variants.length) return null;

  let webpCover = '';
  for (const row of rows) {
    if (row.format.toLowerCase() !== 'webp') continue;
    const p = previewForRow(row);
    if (p && !isPackFallbackFlagThumbnail(p)) {
      webpCover = p;
      break;
    }
  }

  const fileCount = rows.length;
  const designCount = variants.length;

  return {
    country: {
      name,
      slug: slug.trim().toLowerCase(),
      code,
      region: rows[0]?.region?.trim() || null,
      description: buildCountryHubDescription({
        name,
        slug,
        isoCode: code,
        region: rows[0]?.region ?? null,
        dbDescription: null,
        designCount,
        fileCount,
      }),
      cover_image_url: webpCover || variants[0]?.thumbnail || null,
      has_webp_cover: Boolean(webpCover),
      webp_cover_url: webpCover || null,
      file_count: fileCount,
      design_count: designCount,
    },
    variants,
  };
}
