import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Simple in-memory cache (server-side, 1 hour)
const cache = new Map<string, { data: unknown; expiresAt: number }>();

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
    const url =
      `https://api.shutterstock.com/v2/images/search` +
      `?query=${encodeURIComponent(q)}` +
      `&per_page=${perPage}&page=${page}&sort=popular` +
      `&image_type=photo%2Cillustration%2Cvector`;

    const response = await fetch(url, {
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
      data?: Array<{
        id: string;
        description?: string;
        assets?: {
          small_thumb?: { url?: string };
          large_thumb?: { url?: string };
          preview?: { url?: string };
        };
      }>;
    };

    const results = (data.data ?? []).map((img) => ({
      id: img.id,
      thumbUrl:
        img.assets?.large_thumb?.url ??
        img.assets?.small_thumb?.url ??
        img.assets?.preview?.url ??
        '',
      description: img.description ?? '',
      shutterUrl:
        `https://www.shutterstock.com/image-photo/${img.id}` +
        `?utm_source=flagswing&utm_medium=affiliate&utm_campaign=flaggallery`,
    }));

    const payload = { results };
    cache.set(cacheKey, { data: payload, expiresAt: Date.now() + 60 * 60 * 1000 });
    return NextResponse.json(payload);
  } catch (err) {
    console.error('[ss-proxy] error:', err);
    return NextResponse.json({ results: [] });
  }
}
