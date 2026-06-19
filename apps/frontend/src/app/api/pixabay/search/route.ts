import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const cache = new Map<string, { data: unknown; expiresAt: number }>();

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get('q')?.trim() || 'flag';
  const perPage = Math.min(20, Number(searchParams.get('per_page')) || 6);

  const cacheKey = `${q}|${perPage}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return NextResponse.json(cached.data);
  }

  const apiKey = process.env.PIXABAY_API_KEY?.trim();
  if (!apiKey) {
    console.error('[pixabay] PIXABAY_API_KEY is not set');
    return NextResponse.json({ results: [] });
  }

  try {
    const url =
      `https://pixabay.com/api/?key=${apiKey}` +
      `&q=${encodeURIComponent(q)}&image_type=photo&per_page=${perPage}&safesearch=true`;

    const response = await fetch(url, { next: { revalidate: 0 } });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      console.error('[pixabay] upstream error:', response.status, text);
      return NextResponse.json({ results: [] });
    }

    const data = (await response.json()) as {
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
      return NextResponse.json({ results: [] });
    }

    const results = (data.hits ?? []).map((img) => ({
      id: `pixabay-${img.id}`,
      thumbUrl: img.largeImageURL || img.webformatURL || img.previewURL,
      description: img.tags,
      photographer: img.user,
      sourceUrl: img.pageURL,
      source: 'pixabay' as const,
    }));

    console.log(`[pixabay] q="${q}" → ${results.length} results`);

    const payload = { results };
    cache.set(cacheKey, { data: payload, expiresAt: Date.now() + 30 * 60 * 1000 });
    return NextResponse.json(payload);
  } catch (err) {
    console.error('[pixabay] fetch error:', err);
    return NextResponse.json({ results: [] });
  }
}
