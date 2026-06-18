import express, { Request, Response } from 'express';

const router = express.Router();

// ── In-memory cache (1 hour TTL) ─────────────────────────────────────────────
const CACHE_TTL_MS = 60 * 60 * 1000;
const cache = new Map<string, { data: unknown; expiresAt: number }>();

// ── Rate limiter: 30 req/min per IP ─────────────────────────────────────────
const rateBuckets = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60 * 1000;

function checkRateLimit(req: Request, res: Response): boolean {
  const ip =
    (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
    req.socket.remoteAddress ??
    'unknown';
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  bucket.count += 1;
  if (bucket.count > RATE_LIMIT) {
    res.status(429).json({ error: 'Rate limit exceeded. Max 30 requests per minute.' });
    return false;
  }
  return true;
}

function getBasicAuth(): string | null {
  const key = process.env.SHUTTERSTOCK_CONSUMER_KEY?.trim();
  const secret = process.env.SHUTTERSTOCK_CONSUMER_SECRET?.trim();
  if (!key || !secret) return null;
  return Buffer.from(`${key}:${secret}`).toString('base64');
}

function buildAffiliateUrl(imageId: string, query: string): string {
  const baseUrl = 'https://www.shutterstock.com/image-photo';
  const params = new URLSearchParams({
    term: query,
    image_type: 'photo',
    lang: 'en',
  });
  return `${baseUrl}/${imageId}?${params.toString()}`;
}

// GET /api/shutterstock/search?q=&page=1&per_page=20
router.get('/search', async (req: Request, res: Response) => {
  if (!checkRateLimit(req, res)) return;

  const q = String(req.query['q'] ?? '').trim();
  const page = Math.max(1, parseInt(String(req.query['page'] ?? '1'), 10));
  const perPage = Math.min(50, Math.max(1, parseInt(String(req.query['per_page'] ?? '20'), 10)));

  if (!q) {
    res.status(400).json({ error: 'Query parameter "q" is required.' });
    return;
  }

  const cacheKey = `${q}|${page}|${perPage}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    res.setHeader('X-Cache', 'HIT');
    res.json(cached.data);
    return;
  }

  const auth = getBasicAuth();
  if (!auth) {
    res.status(503).json({ error: 'Shutterstock credentials not configured.' });
    return;
  }

  const baseUrl = process.env.SHUTTERSTOCK_BASE_URL ?? 'https://api.shutterstock.com';
  const apiUrl = new URL('/v2/images/search', baseUrl);
  apiUrl.searchParams.set('query', q);
  apiUrl.searchParams.set('page', String(page));
  apiUrl.searchParams.set('per_page', String(perPage));
  apiUrl.searchParams.set('image_type', 'photo');
  apiUrl.searchParams.set('safe', 'true');
  apiUrl.searchParams.set('view', 'full');

  try {
    const upstream = await fetch(apiUrl.toString(), {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: 'application/json',
      },
    });

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => '');
      console.error('[shutterstock] upstream error', upstream.status, text);
      res.status(upstream.status).json({ error: 'Shutterstock API error.', upstream_status: upstream.status });
      return;
    }

    const raw = (await upstream.json()) as {
      data?: Array<{
        id: string;
        description?: string;
        contributor?: { id: string };
        assets?: {
          preview?: { url?: string };
          large_thumb?: { url?: string };
          huge_thumb?: { url?: string };
        };
      }>;
      total_count?: number;
      page?: number;
      per_page?: number;
    };

    const images = (raw.data ?? []).map((img) => ({
      id: img.id,
      description: img.description ?? '',
      contributor: img.contributor?.id ?? '',
      previewUrl: img.assets?.preview?.url ?? img.assets?.large_thumb?.url ?? '',
      largeThumbUrl: img.assets?.large_thumb?.url ?? img.assets?.huge_thumb?.url ?? img.assets?.preview?.url ?? '',
      affiliateUrl: buildAffiliateUrl(img.id, q),
      source: 'shutterstock',
    }));

    const response = {
      images,
      total: raw.total_count ?? 0,
      page: raw.page ?? page,
      per_page: raw.per_page ?? perPage,
    };

    cache.set(cacheKey, { data: response, expiresAt: Date.now() + CACHE_TTL_MS });
    res.setHeader('X-Cache', 'MISS');
    res.json(response);
  } catch (err) {
    console.error('[shutterstock] fetch failed:', err);
    res.status(500).json({ error: 'Failed to fetch images from Shutterstock.' });
  }
});

export default router;
