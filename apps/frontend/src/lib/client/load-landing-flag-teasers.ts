import type { GalleryPreviewItem } from '@/components/landing/LandingFlagGalleryPreview';

type GalleryCountryRow = {
  slug: string;
  name: string;
  thumbnail?: string | null;
  thumbnail_url?: string | null;
};

/**
 * Loads landing teasers: random grouped catalog previews first, then gallery countries (with thumbnails).
 */
export async function loadLandingFlagTeasers(opts: {
  /** Target number of tiles; preview API may oversample internally. */
  limit: number;
}): Promise<GalleryPreviewItem[]> {
  const { limit } = opts;
  const cap = Math.min(48, Math.max(6, limit * 4));

  try {
    const res = await fetch(`/api/gallery/preview?limit=${cap}&random=true`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const j = (await res.json()) as { data?: GalleryPreviewItem[] };
      const data = j.data ?? [];
      if (data.length > 0) return data.slice(0, limit);
    }
  } catch {
    /* fall through */
  }

  try {
    const res = await fetch('/api/gallery/countries', { cache: 'no-store' });
    if (!res.ok) return [];
    const j = (await res.json()) as { countries?: GalleryCountryRow[] };
    const countries = j.countries ?? [];
    const withThumb = countries.filter((c) => String(c.thumbnail || c.thumbnail_url || '').trim());
    const step = Math.max(1, Math.floor(withThumb.length / Math.max(limit, 1)));
    const out: GalleryPreviewItem[] = [];
    for (let i = 0; i < withThumb.length && out.length < limit; i += step) {
      const co = withThumb[i]!;
      const imageUrl = (co.thumbnail || co.thumbnail_url)!.trim();
      out.push({
        id: `country-hub:${co.slug}`,
        title: co.name,
        country_slug: co.slug,
        preview_url: null,
        thumbnail_url: null,
        file_url: null,
        image_url: imageUrl,
        available_formats: [],
        asset_group_key: null,
        slug: co.slug,
        detailHref: `/gallery/${encodeURIComponent(co.slug)}`,
      });
    }
    return out;
  } catch {
    return [];
  }
}
