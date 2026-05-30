/**
 * When Vercel has no DATABASE_URL (or Neon is empty), hydrate gallery hubs from Railway
 * `GET /api/assets` (same `country_flag_files` table on the backend).
 */

import { getCountryCode } from '@/lib/country-mapping';
import { resolveGalleryDisplayName } from '@/lib/gallery-display-name';
import { joinBackendApiPath, resolveBackendApiBase } from '@/lib/auth/backend-url';
import { resolveGalleryAssetUrl } from '@/lib/server/blob-site-proxy';
import { getPublicR2FileUrl } from '@/lib/server/cloudflare-r2';
import { previewDisplayUrlCandidates, resolvedFlagPublicHref } from '@/lib/server/flag-asset-url';
import { slugLooksLikeFileAsset } from '@/lib/gallery/canonical-country-hubs';
import { isPackFallbackFlagThumbnail } from '@/lib/server/gallery-from-db';
import type { GalleryCountrySummary } from '@/types/gallery-country-hub';
import { isPreviewOnlyFormat } from '@/lib/server/flag-preview-formats';

type BackendFlagRow = {
  id: string;
  country_slug: string | null;
  country_name: string | null;
  iso_alpha_2?: string | null;
  file_key: string | null;
  file_url: string | null;
  preview_url: string | null;
  thumbnail_url: string | null;
  premium_tier: string | null;
  format: string;
  asset_group_key?: string | null;
};

function thumbForRow(row: BackendFlagRow): string {
  const href = resolvedFlagPublicHref({
    fileKey: row.file_key,
    fallbackRawUrls: previewDisplayUrlCandidates({
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

export async function fetchGalleryCountriesFromBackendApi(): Promise<GalleryCountrySummary[]> {
  const resolved = resolveBackendApiBase();
  if (!resolved.ok) return [];

  const url = joinBackendApiPath(resolved.baseUrl, '/assets?limit=500&sort=newest');
  let payload: { data?: BackendFlagRow[] };
  try {
    const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(12_000) });
    if (!res.ok) {
      console.warn('[gallery/backend-fallback] assets list failed', res.status);
      return [];
    }
    payload = (await res.json()) as { data?: BackendFlagRow[] };
  } catch (e) {
    console.warn('[gallery/backend-fallback] fetch error', e instanceof Error ? e.message : e);
    return [];
  }

  const rows = payload.data ?? [];
  if (!rows.length) return [];

  type Hub = {
    slug: string;
    name: string;
    code: string | null;
    files: number;
    designKeys: Set<string>;
    webpCover: string;
  };

  const hubs = new Map<string, Hub>();

  for (const row of rows) {
    const slug = row.country_slug?.trim().toLowerCase();
    if (!slug || slugLooksLikeFileAsset(slug)) continue;

    const name =
      row.country_name?.trim() ||
      slug
        .split(/[-_]+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

    let hub = hubs.get(slug);
    if (!hub) {
      hub = {
        slug,
        name,
        code: row.iso_alpha_2?.trim()?.toUpperCase() || getCountryCode(name)?.toUpperCase() || null,
        files: 0,
        designKeys: new Set<string>(),
        webpCover: '',
      };
      hubs.set(slug, hub);
    }

    hub.files += 1;
    if (!isPreviewOnlyFormat(row.format)) {
      const gk = row.asset_group_key?.trim() || `solo:${row.id}`;
      hub.designKeys.add(gk);
    }

    if (row.format.toLowerCase() === 'webp') {
      const thumb = thumbForRow(row);
      if (thumb && !isPackFallbackFlagThumbnail(thumb)) {
        hub.webpCover = thumb;
      }
    }
  }

  const out: GalleryCountrySummary[] = [];
  for (const hub of hubs.values()) {
    if (slugLooksLikeFileAsset(hub.slug)) continue;
    const hasWebp = Boolean(hub.webpCover?.trim());
    if (!hasWebp) continue;

    const displayName = resolveGalleryDisplayName(hub.name, hub.code, hub.slug);
    const designs = hub.designKeys.size || hub.files;
    out.push({
      id: `backend-hub:${hub.slug}`,
      name: displayName,
      slug: hub.slug,
      code: hub.code,
      has_webp_cover: hasWebp,
      webp_cover_url: hasWebp ? hub.webpCover : null,
      thumbnail_url: hasWebp ? hub.webpCover : '',
      thumbnail: hasWebp ? hub.webpCover : '',
      flag_count: hub.files,
      design_count: designs,
      count: hub.files,
    });
  }

  return out.sort((a, b) => a.name.localeCompare(b.name));
}
