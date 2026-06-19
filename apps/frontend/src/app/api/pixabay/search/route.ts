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

function pixabayImageType(filter: StockFilter): 'all' | 'photo' | 'illustration' | 'vector' {
  if (filter === 'vector' || filter === 'icon' || filter === 'png') return 'vector';
  if (filter === 'photo' || filter === 'jpg') return 'photo';
  return 'all';
}

function queryForFilter(q: string, filter: StockFilter): string {
  if (filter === 'icon') return `${q} icon vector`;
  if (filter === 'png') return `${q} png transparent`;
  if (filter === 'jpg') return `${q} photo`;
  if (filter === 'vector') return `${q} vector`;
  return q;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = cleanQuery(searchParams.get('q'));
  const filter = stockFilter(searchParams.get('filter'));
  const perPage = Math.min(40, Math.max(1, Number(searchParams.get('per_page')) || 12));
  const page = Math.min(50, Math.max(1, Number(searchParams.get('page')) || 1));

  if (filter === 'video') {
    return NextResponse.json({ results: [], hasMore: false });
  }

  const cacheKey = `${q}|${filter}|${perPage}|${page}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return NextResponse.json(cached.data);
  }

  const apiKey = process.env.PIXABAY_API_KEY?.trim();
  if (!apiKey) {
    console.error('[pixabay] PIXABAY_API_KEY is not set');
    return NextResponse.json({ results: [], hasMore: false });
  }

  try {
    const url =
      `https://pixabay.com/api/?key=${apiKey}` +
      `&q=${encodeURIComponent(queryForFilter(q, filter))}` +
      `&image_type=${pixabayImageType(filter)}` +
      `&per_page=${perPage}&page=${page}&safesearch=true`;

    const response = await fetch(url, { next: { revalidate: 0 } });

    if (!response.ok) {
      console.error('[pixabay] upstream error:', response.status);
      return NextResponse.json({ results: [], hasMore: false });
    }

    const data = (await response.json()) as {
      totalHits?: number;
      hits?: Array<{
        id: number;
        tags: string;
        user: string;
        pageURL: string;
        webformatURL: string;
        previewURL: string;
        largeImageURL: string;
      }>;
      error?: string;
    };

    if (data.error) {
      console.error('[pixabay] API error:', data.error);
      return NextResponse.json({ results: [], hasMore: false });
    }

    const mediaType = filter === 'vector' || filter === 'icon' || filter === 'png'
      ? filter
      : filter === 'jpg'
        ? 'jpg'
        : 'photo';
    const results = (data.hits ?? []).map((img) => ({
      id: `pixabay-${img.id}`,
      thumbUrl: img.largeImageURL || img.webformatURL || img.previewURL,
      description: img.tags,
      photographer: img.user,
      sourceUrl: img.pageURL,
      source: 'pixabay' as const,
      licenseType: 'free' as const,
      mediaType,
    }));

    const hasMore = typeof data.totalHits === 'number' ? page * perPage < data.totalHits : results.length === perPage;
    const payload = { results, hasMore };
    cache.set(cacheKey, { data: payload, expiresAt: Date.now() + 30 * 60 * 1000 });
    return NextResponse.json(payload);
  } catch (err) {
    console.error('[pixabay] fetch error:', err);
    return NextResponse.json({ results: [], hasMore: false });
  }
}
