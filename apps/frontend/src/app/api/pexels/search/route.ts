import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type StockFilter = 'all' | 'free' | 'vector' | 'photo' | 'video' | 'png' | 'jpg' | 'icon';

const cache = new Map<string, { data: unknown; expiresAt: number }>();
const ALLOWED_FILTERS = new Set<StockFilter>(['all', 'free', 'vector', 'photo', 'video', 'png', 'jpg', 'icon']);

function cleanQuery(value: string | null): string {
  const q = (value ?? 'flag').replace(/[^\p{L}\p{N}\s+-]/gu, ' ').replace(/\s+/g, ' ').trim();
  return q.slice(0, 80) || 'flag';
}

function stockFilter(value: string | null): StockFilter {
  return ALLOWED_FILTERS.has(value as StockFilter) ? (value as StockFilter) : 'all';
}

function queryForFilter(q: string, filter: StockFilter): string {
  if (filter === 'jpg' || filter === 'photo') return `${q} photo`;
  if (filter === 'video') return `${q} video`;
  return q;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = cleanQuery(searchParams.get('q'));
  const filter = stockFilter(searchParams.get('filter'));
  const perPage = Math.min(40, Math.max(1, Number(searchParams.get('per_page')) || 12));
  const page = Math.min(50, Math.max(1, Number(searchParams.get('page')) || 1));

  if (filter === 'vector' || filter === 'png' || filter === 'icon') {
    return NextResponse.json({ results: [], hasMore: false });
  }

  const cacheKey = `${q}|${filter}|${perPage}|${page}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return NextResponse.json(cached.data);
  }

  const apiKey = process.env.PEXELS_API_KEY?.trim();
  if (!apiKey) return NextResponse.json({ results: [], hasMore: false });

  try {
    if (filter === 'video') {
      const response = await fetch(
        `https://api.pexels.com/videos/search?query=${encodeURIComponent(queryForFilter(q, filter))}&per_page=${perPage}&page=${page}`,
        { headers: { Authorization: apiKey }, next: { revalidate: 0 } },
      );

      if (!response.ok) return NextResponse.json({ results: [], hasMore: false });

      const data = (await response.json()) as {
        total_results?: number;
        next_page?: string;
        videos?: Array<{
          id: number;
          image?: string;
          url: string;
          user?: { name?: string };
        }>;
      };

      const results = (data.videos ?? []).map((video) => ({
        id: `pexels-video-${video.id}`,
        thumbUrl: video.image ?? '',
        description: `${q} flag video`,
        photographer: video.user?.name ?? 'Pexels',
        sourceUrl: video.url,
        source: 'pexels' as const,
        licenseType: 'free' as const,
        mediaType: 'video' as const,
      }));

      const payload = { results, hasMore: Boolean(data.next_page) };
      cache.set(cacheKey, { data: payload, expiresAt: Date.now() + 30 * 60 * 1000 });
      return NextResponse.json(payload);
    }

    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(queryForFilter(q, filter))}&per_page=${perPage}&page=${page}`,
      { headers: { Authorization: apiKey }, next: { revalidate: 0 } },
    );

    if (!response.ok) return NextResponse.json({ results: [], hasMore: false });

    const data = (await response.json()) as {
      total_results?: number;
      next_page?: string;
      photos?: Array<{
        id: number;
        alt?: string;
        photographer: string;
        url: string;
        src: { medium: string; large?: string; large2x?: string };
      }>;
    };

    const results = (data.photos ?? []).map((img) => ({
      id: `pexels-${img.id}`,
      thumbUrl: img.src.large2x || img.src.large || img.src.medium,
      description: img.alt || q,
      photographer: img.photographer,
      sourceUrl: img.url,
      source: 'pexels' as const,
      licenseType: 'free' as const,
      mediaType: filter === 'jpg' ? 'jpg' as const : 'photo' as const,
    }));

    const payload = { results, hasMore: Boolean(data.next_page) };
    cache.set(cacheKey, { data: payload, expiresAt: Date.now() + 30 * 60 * 1000 });
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({ results: [], hasMore: false });
  }
}
