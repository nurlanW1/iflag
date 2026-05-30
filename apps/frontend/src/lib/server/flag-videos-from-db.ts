import type { Pool } from 'pg';
import { getCountryCode } from '@/lib/country-mapping';
import { resolveGalleryDisplayName } from '@/lib/gallery-display-name';
import { slugFromAssetGroupKey } from '@/lib/marketplace/group-flag-products';
import { isFlagVideoFormat } from '@/lib/flag-video-formats';
import {
  FLAG_THUMB_PLACEHOLDER_DATA_URL,
  flagThumbPlaceholderForFileId,
} from '@/lib/flag-thumbnail-fallback';
import {
  galleryVariantPlaybackCandidates,
  galleryVariantThumbCandidates,
  resolvedFlagPublicHref,
} from '@/lib/server/flag-asset-url';
import { publishedFlagHasMediaSql } from '@/lib/server/gallery-published-media';
import type { FlagVideoSummary } from '@/types/flag-video-gallery';

type VideoRow = {
  id: string;
  file_name: string;
  format: string;
  asset_group_key: string | null;
  display_title: string | null;
  sort_title: string | null;
  variant_name: string | null;
  country_slug: string | null;
  country_name: string | null;
  iso_alpha_2: string | null;
  thumbnail_url: string | null;
  preview_url: string | null;
  file_url: string | null;
  file_key: string | null;
};

function sortKeyForRow(r: VideoRow): string {
  return (
    r.sort_title?.trim() ||
    r.display_title?.trim() ||
    r.variant_name?.trim() ||
    r.file_name.replace(/\.[^.]+$/, '').trim()
  ).toLowerCase();
}

function titleForRow(r: VideoRow, countryName: string): string {
  const label =
    r.display_title?.trim() ||
    r.variant_name?.trim() ||
    r.file_name.replace(/\.[^.]+$/, '').trim();
  if (!label) return countryName;
  if (label.toLowerCase().includes(countryName.toLowerCase())) return label;
  return `${countryName} — ${label}`;
}

/**
 * All published MP4/WebM/MOV flag files — alphabetical for Flag videos hub.
 * Each row is one gallery tile (not grouped into country folders).
 */
export async function fetchFlagVideosFromDb(pool: Pool): Promise<FlagVideoSummary[]> {
  const res = await pool.query<VideoRow>(
    `SELECT
       cff.id,
       cff.file_name,
       cff.format,
       cff.asset_group_key,
       cff.display_title,
       cff.sort_title,
       cff.variant_name,
       COALESCE(NULLIF(trim(c.slug), ''), NULLIF(trim(cff.country_slug), '')) AS country_slug,
       COALESCE(NULLIF(trim(c.name), ''), NULLIF(trim(cff.country_slug), '')) AS country_name,
       c.iso_alpha_2,
       cff.thumbnail_url,
       cff.preview_url,
       cff.file_url,
       cff.file_key
     FROM country_flag_files cff
     LEFT JOIN countries c ON c.id = cff.country_id
     WHERE lower(trim(coalesce(cff.status::text, ''))) = 'published'
       AND lower(trim(coalesce(cff.format::text, ''))) IN ('mp4', 'webm', 'mov')
       AND ${publishedFlagHasMediaSql('cff')}
     ORDER BY lower(trim(coalesce(cff.sort_title, cff.display_title, cff.file_name))) ASC,
              cff.file_name ASC`,
  );

  const out: FlagVideoSummary[] = [];

  for (const r of res.rows) {
    const fmt = r.format?.trim().toLowerCase() ?? '';
    if (!isFlagVideoFormat(fmt)) continue;

    const countrySlug =
      r.country_slug?.trim().toLowerCase().replace(/\s+/g, '-') || 'unknown';
    const countryName = resolveGalleryDisplayName(
      r.country_name?.trim() || countrySlug,
      r.iso_alpha_2,
      countrySlug,
    );
    const code =
      r.iso_alpha_2?.trim()?.toUpperCase() || getCountryCode(countryName)?.toUpperCase() || null;

    const mediaInput = {
      format: r.format,
      premiumTierRaw: 'paid' as const,
      previewUrl: r.preview_url,
      thumbnailUrl: r.thumbnail_url,
      fileUrl: r.file_url,
    };

    const videoUrl = resolvedFlagPublicHref({
      fileKey: r.file_key,
      fallbackRawUrls: galleryVariantPlaybackCandidates(mediaInput),
    });

    const poster = resolvedFlagPublicHref({
      fileKey: r.file_key,
      fallbackRawUrls: galleryVariantThumbCandidates(mediaInput),
    });

    if (!videoUrl) continue;

    const ag = r.asset_group_key?.trim();
    const productSlug = ag ? slugFromAssetGroupKey(ag) : `nf-${r.id.toLowerCase()}`;

    out.push({
      id: r.id,
      productSlug,
      title: titleForRow(r, countryName),
      countryName,
      countrySlug,
      countryCode: code,
      format: fmt.toUpperCase(),
      videoUrl: videoUrl || '',
      thumbnail: poster && poster !== videoUrl ? poster : FLAG_THUMB_PLACEHOLDER_DATA_URL,
      sortKey: sortKeyForRow(r),
    });
  }

  return out.sort((a, b) => a.sortKey.localeCompare(b.sortKey) || a.title.localeCompare(b.title));
}
