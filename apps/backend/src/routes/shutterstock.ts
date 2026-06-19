import express, { Request, Response } from 'express';

const router = express.Router();

// ── In-memory cache (1 hour TTL) ─────────────────────────────────────────────
const cache = new Map<string, { data: unknown; expiresAt: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000;

type ShutterstockImage = {
  id: string;
  description?: string;
  contributor?: { id: string };
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

function buildFlagSearchQueries(query: string): string[] {
  const subject = query
    .replace(/\bnational\b/gi, ' ')
    .replace(/\bflags?\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const country = subject || query.trim() || 'flag';
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

// ── Rate limiter: 30 req/min per IP ─────────────────────────────────────────
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(req: Request, res: Response): boolean {
  const ip =
    (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
    req.socket.remoteAddress ??
    'unknown';
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  bucket.count += 1;
  if (bucket.count > 30) {
    res.status(429).json({ results: [] });
    return false;
  }
  return true;
}

router.get('/search', async (req: Request, res: Response) => {
  if (!checkRateLimit(req, res)) return;

  try {
    const query = (req.query['q'] as string) || 'flag';
    const perPage = Math.min(50, Number(req.query['per_page']) || 12);
    const page = Math.max(1, Number(req.query['page']) || 1);

    const cacheKey = `${query}|${perPage}|${page}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      res.json(cached.data);
      return;
    }

    const key = process.env.SHUTTERSTOCK_CONSUMER_KEY?.trim();
    const secret = process.env.SHUTTERSTOCK_CONSUMER_SECRET?.trim();
    if (!key || !secret) {
      res.json({ results: [] });
      return;
    }

    const auth = Buffer.from(`${key}:${secret}`).toString('base64');

    const searchQueries = buildFlagSearchQueries(query);
    const queryIndex = (page - 1) % searchQueries.length;
    const upstreamPage = Math.floor((page - 1) / searchQueries.length) + 1;
    const searchQuery = searchQueries[queryIndex] ?? query;

    const url = new URL('https://api.shutterstock.com/v2/images/search');
    url.searchParams.set('query', searchQuery);
    url.searchParams.set('per_page', String(perPage));
    url.searchParams.set('page', String(upstreamPage));
    url.searchParams.set('sort', 'popular');
    url.searchParams.append('image_type', 'photo');
    url.searchParams.append('image_type', 'illustration');
    url.searchParams.append('image_type', 'vector');

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      console.error('[shutterstock] upstream error', response.status);
      res.json({ results: [] });
      return;
    }

    const data = (await response.json()) as {
      data?: ShutterstockImage[];
      total_count?: number;
    };

    const results = (data.data ?? []).filter(isFlagRelatedImage).map((img) => ({
      id: img.id,
      thumbUrl: pickBestPreviewUrl(img),
      description: img.description ?? '',
      contributor: img.contributor?.id ?? '',
      shutterUrl:
        `https://www.shutterstock.com/image/${img.id}` +
        `?utm_source=flagswing&utm_medium=affiliate&utm_campaign=flaggallery`,
    }));

    const hasMore =
      typeof data.total_count === 'number'
        ? page < searchQueries.length || upstreamPage * perPage < data.total_count
        : results.length === perPage;
    const payload = { results, hasMore };
    cache.set(cacheKey, { data: payload, expiresAt: Date.now() + CACHE_TTL_MS });
    res.json(payload);
  } catch (error) {
    console.error('[shutterstock] API error:', error);
    res.json({ results: [] });
  }
});

export default router;
