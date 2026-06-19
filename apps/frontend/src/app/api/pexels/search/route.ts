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

  const apiKey = process.env.PEXELS_API_KEY?.trim();
  if (!apiKey) return NextResponse.json({ results: [] });

  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=${perPage}`,
      { headers: { Authorization: apiKey }, next: { revalidate: 0 } },
    );

    if (!response.ok) return NextResponse.json({ results: [] });

    const data = (await response.json()) as {
      photos?: Array<{
        id: number;
        alt?: string;
        photographer: string;
        url: string;
        src: { medium: string };
      }>;
    };

    const results = (data.photos ?? []).map((img) => ({
      id: `pexels-${img.id}`,
      thumbUrl: img.src.medium,
      description: img.alt || q,
      photographer: img.photographer,
      sourceUrl: img.url,
      source: 'pexels' as const,
    }));

    const payload = { results };
    cache.set(cacheKey, { data: payload, expiresAt: Date.now() + 30 * 60 * 1000 });
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({ results: [] });
  }
}
