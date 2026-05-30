/**
 * Build country folder payload from Railway `GET /api/assets?country_slug=…` when Neon is unavailable.
 */

import { getCountryCode } from '@/lib/country-mapping';
import { buildCountryHubDescription } from '@/lib/gallery/country-hub-copy';
import { variantFormatsArePremium } from '@/lib/gallery/flag-preview-watermark';
import { resolveGalleryDisplayName } from '@/lib/gallery-display-name';
import { hrefLooksLikeFlagVideo, isFlagVideoFormat, isFlagVideoDesignType } from '@/lib/flag-video-formats';
import { slugFromAssetGroupKey } from '@/lib/marketplace/group-flag-products';
import { joinBackendApiPath, resolveBackendApiBase } from '@/lib/auth/backend-url';
import { resolveGalleryAssetUrl } from '@/lib/server/blob-site-proxy';
import { getPublicR2FileUrl } from '@/lib/server/cloudflare-r2';
import {
  galleryVariantPlaybackCandidates,
  galleryVariantThumbCandidates,
  resolvedFlagPublicHref,
} from '@/lib/server/flag-asset-url';
import type { CountryGalleryPayload } from '@/lib/server/gallery-from-db';
import { formatToCategory, isPackFallbackFlagThumbnail } from '@/lib/server/gallery-from-db';
import { isPreviewOnlyFormat } from '@/lib/server/flag-preview-formats';

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

type FormatRow = CountryGalleryPayload['variants'][number]['formats'][number];

function previewForRow(row: BackendFlagRow): string {
  const mediaInput = {
    format: row.format,
    premiumTierRaw: row.premium_tier,
    previewUrl: row.preview_url,
    thumbnailUrl: row.thumbnail_url,
    fileUrl: row.file_url,
  };
  const href = resolvedFlagPublicHref({
    fileKey: row.file_key,
    fallbackRawUrls: isFlagVideoFormat(row.format)
      ? galleryVariantPlaybackCandidates(mediaInput)
      : galleryVariantThumbCandidates(mediaInput),
  });
  if (href) return resolveGalleryAssetUrl(href);
  const key = row.file_key?.trim();
  if (key) {
    const built = getPublicR2FileUrl(key);
    if (built) return resolveGalleryAssetUrl(built);
  }
  return '';
}

function designBucketKey(row: BackendFlagRow): string {
  const ag = row.asset_group_key?.trim();
  if (ag) return `ag:${ag.toLowerCase()}`;
  const named = row.variant_name?.trim();
  if (named) return `n:${named.toLowerCase()}`;
  const base = row.file_name.replace(/\.[^.]+$/, '').trim();
  return `f:${base.toLowerCase()}`;
}

function pickVariantCover(
  formats: FormatRow[],
  builderThumb: string,
  folderWebp: string,
  variantId: string,
): string {
  const raster = formats
    .map((f) => f.previewUrl)
    .find((u) => u && !hrefLooksLikeFlagVideo(u) && !isPackFallbackFlagThumbnail(u));
  if (raster) return raster;
  if (builderThumb && !isPackFallbackFlagThumbnail(builderThumb)) return builderThumb;
  const video = formats.map((f) => f.previewUrl).find((u) => u && hrefLooksLikeFlagVideo(u));
  if (video) return video;
  const any = formats.map((f) => f.previewUrl).find((u) => u && u.trim());
  return any || folderWebp || '';
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

  type VariantBuilder = {
    id: string;
    productSlug: string;
    name: string;
    type: string;
    thumbnail: string;
    formats: FormatRow[];
  };

  const builders = new Map<string, VariantBuilder>();
  let variantIdx = 0;

  for (const row of rows) {
    if (isPreviewOnlyFormat(row.format)) continue;

    const preview = previewForRow(row);
    const key = designBucketKey(row);
    const agTrim = row.asset_group_key?.trim();
    let builder = builders.get(key);

    if (!builder) {
      builder = {
        id: `${slug}-design-${variantIdx++}`,
        productSlug: agTrim ? slugFromAssetGroupKey(agTrim) : `nf-${row.id}`,
        name:
          row.display_title?.trim() ||
          row.variant_name?.trim() ||
          row.file_name.replace(/\.[^.]+$/, '') ||
          'Design',
        type: (row.design_type ?? 'design').replace(/_/g, ' '),
        thumbnail: '',
        formats: [],
      };
      builders.set(key, builder);
    }

    const sz =
      row.file_size_bytes != null
        ? Number.parseInt(String(row.file_size_bytes), 10)
        : NaN;
    const previewOnly = isPreviewOnlyFormat(row.format);
    const tier = (row.premium_tier ?? 'free').toLowerCase() === 'free' ? 'free' : 'paid';
    const fmt = row.format.toLowerCase();
    const ext = fmt === 'jpeg' ? 'jpg' : fmt;

    builder.formats.push({
      id: row.id,
      format: row.format.toUpperCase(),
      formatCode: ext,
      category: formatToCategory(row.format),
      file: row.file_name,
      previewUrl: preview,
      premiumTier: previewOnly ? 'paid' : tier === 'free' ? 'free' : 'paid',
      downloadProtected: previewOnly || tier !== 'free',
      size: Number.isFinite(sz) ? `${sz} B` : 'Unknown',
      dimensions: isFlagVideoFormat(row.format) ? 'Video' : 'Original',
    });

    if (preview) {
      const isVideo = isFlagVideoFormat(row.format);
      const hasStill = builder.formats.some(
        (f) => f.category === 'raster' || f.category === 'vector',
      );
      if (!isVideo || !hasStill) {
        builder.thumbnail = preview;
      } else if (!builder.thumbnail || row.format.toLowerCase() === 'png') {
        builder.thumbnail = preview;
      }
    }
  }

  let webpCover = '';
  for (const row of rows) {
    if (row.format.toLowerCase() !== 'webp') continue;
    const p = previewForRow(row);
    if (p && !isPackFallbackFlagThumbnail(p)) {
      webpCover = p;
      break;
    }
  }

  const variants = [...builders.values()]
    .filter((b) => b.formats.length > 0)
    .map((b) => {
      const sortedFormats = [...b.formats].sort((a, c) => a.format.localeCompare(c.format));
      const cover = pickVariantCover(sortedFormats, b.thumbnail, webpCover, b.id);
      const hasVideo = sortedFormats.some((f) => f.category === 'video');
      const hasStill = sortedFormats.some(
        (f) => f.category === 'raster' || f.category === 'vector',
      );
      const type =
        isFlagVideoDesignType(b.type) || (hasVideo && !hasStill)
          ? 'video'
          : b.type.replace(/_/g, ' ') || 'design';
      return {
        id: b.id,
        productSlug: b.productSlug,
        name: b.name,
        type,
        thumbnail: cover,
        isPremiumDesign: variantFormatsArePremium(sortedFormats),
        formats: sortedFormats,
      };
    });

  if (!variants.length) return null;

  const fileCount = rows.filter((r) => !isPreviewOnlyFormat(r.format)).length;
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
