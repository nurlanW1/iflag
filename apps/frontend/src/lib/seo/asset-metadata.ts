import { cache } from 'react';
import { getProductBySlug } from '@/services/marketplace';

export type AssetSeoPayload = {
  title: string;
  description: string | null;
  image: string | null;
  /** When resolved from local marketplace product */
  canonicalPath: string | null;
  priceCents: number | null;
  currency: string | null;
};

/**
 * Resolve SEO fields for a flag/product slug: in-memory marketplace first, then HTTP API if configured.
 * Cached per request to avoid duplicate work between generateMetadata and layouts.
 */
export const resolveAssetSeoBySlug = cache(async (slug: string): Promise<AssetSeoPayload | null> => {
  const local = getProductBySlug(slug);
  if (local) {
    return {
      title: local.title,
      description: local.description,
      image: local.previewUrl || local.thumbnailUrl,
      canonicalPath: local.seo.canonicalPath ?? `/flags/${local.slug}`,
      priceCents: local.priceCents,
      currency: local.currency,
    };
  }

  const base = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!base) {
    return null;
  }

  const url = `${base.replace(/\/$/, '')}/assets/slug/${encodeURIComponent(slug)}`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, unknown>;
    const title = typeof data.title === 'string' ? data.title : null;
    if (!title) return null;
    const description =
      typeof data.description === 'string' ? data.description : null;
    const image =
      (typeof data.thumbnail_url === 'string' && data.thumbnail_url) ||
      (typeof data.preview_file_url === 'string' && data.preview_file_url) ||
      null;
    return {
      title,
      description,
      image,
      canonicalPath: `/flags/${slug}`,
      priceCents: null,
      currency: null,
    };
  } catch {
    return null;
  }
});
