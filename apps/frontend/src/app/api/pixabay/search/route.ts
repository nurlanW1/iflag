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
  if (!apiKey) return NextResponse.json({ results: [] });

  try {
    const response = await fetch(
      `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(q)}&image_type=photo&per_page=${perPage}`,
      { next: { revalidate: 0 } },
    );

    if (!response.ok) return NextResponse.json({ results: [] });

    const data = (await response.json()) as {
      hits?: Array<{
        id: number;
        tags: string;
        user: string;
        pageURL: string;
        webformatURL: string;
      }>;
    };

    const results = (data.hits ?? []).map((img) => ({
      id: `pixabay-${img.id}`,
      thumbUrl: img.webformatURL,
      description: img.tags,
      photographer: img.user,
      sourceUrl: img.pageURL,
      source: 'pixabay' as const,
    }));

    const payload = { results };
    cache.set(cacheKey, { data: payload, expiresAt: Date.now() + 30 * 60 * 1000 });
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({ results: [] });
  }
}
