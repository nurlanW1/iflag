import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Simple in-memory cache (server-side, 1 hour)
const cache = new Map<string, { data: unknown; expiresAt: number }>();

type ShutterstockImage = {
  id: string;
  description?: string;
  media_type?: string;
  assets?: {
    small_thumb?: { url?: string };
    large_thumb?: { url?: string };
    huge_thumb?: { url?: string };
    mosaic?: { url?: string };
    preview?: { url?: string };
    preview_600?: { url?: string };
    preview_1000?: { url?: string };
    preview_1500?: { url?: string };
  };
};

type StockFilter = 'all' | 'free' | 'vector' | 'photo' | 'video' | 'png' | 'jpg' | 'icon';
const ALLOWED_FILTERS = new Set<StockFilter>(['all', 'free', 'vector', 'photo', 'video', 'png', 'jpg', 'icon']);

function cleanQuery(value: string | null): string {
  const q = (value ?? 'flag').replace(/[^\p{L}\p{N}\s+-]/gu, ' ').replace(/\s+/g, ' ').trim();
  return q.slice(0, 80) || 'flag';
}

function stockFilter(value: string | null): StockFilter {
  return ALLOWED_FILTERS.has(value as StockFilter) ? (value as StockFilter) : 'all';
}

function isFlagRelatedImage(img: ShutterstockImage): boolean {
  const description = img.description?.toLowerCase() ?? '';
  return /\b(flag|flags|banner|national flag)\b/.test(description);
}

function pickBestPreviewUrl(img: ShutterstockImage): string {
  return (
    img.assets?.preview_1000?.url ??
    img.assets?.preview_600?.url ??
    img.assets?.preview?.url ??
    img.assets?.huge_thumb?.url ??
    img.assets?.mosaic?.url ??
    img.assets?.large_thumb?.url ??
    img.assets?.small_thumb?.url ??
    ''
  );
}

function buildFlagSearchQueries(query: string, filter: StockFilter): string[] {
  const subject = query
    .replace(/\bnational\b/gi, ' ')
    .replace(/\bflags?\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const country = subject || query.trim() || 'flag';
  if (filter === 'vector') return [`${country} flag vector`, `${country} national flag vector`, `${country} flag illustration`];
  if (filter === 'icon') return [`${country} flag icon`, `${country} icon vector`, `${country} flag symbol`];
  if (filter === 'png') return [`${country} flag png`, `${country} flag transparent`, `${country} flag vector`];
  if (filter === 'jpg' || filter === 'photo') return [`${country} flag photo`, `${country} waving flag`, `${country} flag background`];
  return Array.from(
    new Set([
      `${country} flag`,
      `${country} waving flag`,
      `${country} flag background`,
      `${country} flag vector`,
      `${country} national flag`,
      `${country} flag icon`,
      `${country} flag illustration`,
    ]),
  );
}

function imageTypesForFilter(filter: StockFilter): string[] {
  if (filter === 'vector' || filter === 'icon' || filter === 'png') return ['vector', 'illustration'];
  if (filter === 'photo' || filter === 'jpg') return ['photo'];
  return ['photo', 'illustration', 'vector'];
}

function mediaTypeForFilter(filter: StockFilter, img: ShutterstockImage): string {
  if (filter !== 'all' && filter !== 'free') return filter;
  const description = img.description?.toLowerCase() ?? '';
  if (/\b(vector|illustration|icon)\b/.test(description) || img.media_type === 'vector') return 'vector';
  return 'photo';
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = cleanQuery(searchParams.get('q'));
  const filter = stockFilter(searchParams.get('filter'));
  const perPage = Math.min(50, Math.max(1, Number(searchParams.get('per_page')) || 12));
  const page = Math.min(50, Math.max(1, Number(searchParams.get('page')) || 1));

  if (filter === 'free' || filter === 'video') {
    return NextResponse.json({ results: [], hasMore: false });
  }

  const cacheKey = `${q}|${filter}|${perPage}|${page}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return NextResponse.json(cached.data);
  }

  const key = process.env.SHUTTERSTOCK_CONSUMER_KEY?.trim();
  const secret = process.env.SHUTTERSTOCK_CONSUMER_SECRET?.trim();

  if (!key || !secret) {
    // Try proxying to Railway backend as fallback
    const backendUrl = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/+$/, '');
    if (backendUrl) {
      try {
        const r = await fetch(
          `${backendUrl}/shutterstock/search?q=${encodeURIComponent(q)}&per_page=${perPage}&page=${page}&filter=${filter}`,
          { next: { revalidate: 0 } },
        );
        if (r.ok) {
          const data = await r.json();
          return NextResponse.json(data);
        }
      } catch {
        // fall through
      }
    }
    return NextResponse.json({ results: [] });
  }

  const auth = Buffer.from(`${key}:${secret}`).toString('base64');

  try {
    const searchQueries = buildFlagSearchQueries(q, filter);
    const queryIndex = (page - 1) % searchQueries.length;
    const upstreamPage = Math.floor((page - 1) / searchQueries.length) + 1;
    const searchQuery = searchQueries[queryIndex] ?? q;

    const url = new URL('https://api.shutterstock.com/v2/images/search');
    url.searchParams.set('query', searchQuery);
    url.searchParams.set('per_page', String(perPage));
    url.searchParams.set('page', String(upstreamPage));
    url.searchParams.set('sort', 'popular');
    imageTypesForFilter(filter).forEach((type) => url.searchParams.append('image_type', type));

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: 'application/json',
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      console.error('[ss-proxy] upstream', response.status, await response.text().catch(() => ''));
      return NextResponse.json({ results: [] });
    }

    const data = (await response.json()) as {
      data?: ShutterstockImage[];
      total_count?: number;
    };

    const results = (data.data ?? []).filter(isFlagRelatedImage).map((img) => ({
      id: img.id,
      thumbUrl: pickBestPreviewUrl(img),
      description: img.description ?? '',
      source: 'shutterstock' as const,
      licenseType: 'paid' as const,
      mediaType: mediaTypeForFilter(filter, img),
      shutterUrl:
        `https://www.shutterstock.com/image-photo/${img.id}` +
        `?utm_source=flagswing&utm_medium=affiliate&utm_campaign=flaggallery`,
    }));

    const hasMore =
      typeof data.total_count === 'number'
        ? page < searchQueries.length || upstreamPage * perPage < data.total_count
        : results.length === perPage;
    const payload = { results, hasMore };
    cache.set(cacheKey, { data: payload, expiresAt: Date.now() + 60 * 60 * 1000 });
    return NextResponse.json(payload);
  } catch (err) {
    console.error('[ss-proxy] error:', err);
    return NextResponse.json({ results: [] });
  }
}
