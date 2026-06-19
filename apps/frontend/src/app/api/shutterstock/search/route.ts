import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Simple in-memory cache (server-side, 1 hour)
const cache = new Map<string, { data: unknown; expiresAt: number }>();

type ShutterstockImage = {
  id: string;
  description?: string;
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

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get('q')?.trim() || 'flag';
  const perPage = Math.min(50, Number(searchParams.get('per_page')) || 12);
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const cacheKey = `${q}|${perPage}|${page}`;
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
          `${backendUrl}/shutterstock/search?q=${encodeURIComponent(q)}&per_page=${perPage}&page=${page}`,
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
    const url = new URL('https://api.shutterstock.com/v2/images/search');
    url.searchParams.set('query', q);
    url.searchParams.set('per_page', String(perPage));
    url.searchParams.set('page', String(page));
    url.searchParams.set('sort', 'popular');
    url.searchParams.append('image_type', 'photo');
    url.searchParams.append('image_type', 'illustration');
    url.searchParams.append('image_type', 'vector');

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
      shutterUrl:
        `https://www.shutterstock.com/image-photo/${img.id}` +
        `?utm_source=flagswing&utm_medium=affiliate&utm_campaign=flaggallery`,
    }));

    const hasMore =
      typeof data.total_count === 'number'
        ? page * perPage < data.total_count
        : results.length === perPage;
    const payload = { results, hasMore };
    cache.set(cacheKey, { data: payload, expiresAt: Date.now() + 60 * 60 * 1000 });
    return NextResponse.json(payload);
  } catch (err) {
    console.error('[ss-proxy] error:', err);
    return NextResponse.json({ results: [] });
  }
}
