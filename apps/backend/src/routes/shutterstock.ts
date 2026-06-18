import express, { Request, Response } from 'express';

const router = express.Router();

// ── In-memory cache (1 hour TTL) ─────────────────────────────────────────────
const cache = new Map<string, { data: unknown; expiresAt: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000;

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
    const perPage = Number(req.query['per_page']) || 12;

    const cacheKey = `${query}|${perPage}`;
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

    const response = await fetch(
      `https://api.shutterstock.com/v2/images/search` +
      `?query=${encodeURIComponent(query)}` +
      `&per_page=${perPage}&sort=popular` +
      `&image_type=photo,illustration,vector`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: 'application/json',
        },
      },
    );

    if (!response.ok) {
      console.error('[shutterstock] upstream error', response.status);
      res.json({ results: [] });
      return;
    }

    const data = (await response.json()) as {
      data?: Array<{
        id: string;
        description?: string;
        contributor?: { id: string };
        assets?: {
          small_thumb?: { url?: string };
          preview?: { url?: string };
        };
      }>;
    };

    const results = (data.data ?? []).map((img) => ({
      id: img.id,
      thumbUrl: img.assets?.small_thumb?.url ?? img.assets?.preview?.url ?? '',
      description: img.description ?? '',
      contributor: img.contributor?.id ?? '',
      shutterUrl:
        `https://www.shutterstock.com/image/${img.id}` +
        `?utm_source=flagswing&utm_medium=affiliate&utm_campaign=flaggallery`,
    }));

    const payload = { results };
    cache.set(cacheKey, { data: payload, expiresAt: Date.now() + CACHE_TTL_MS });
    res.json(payload);
  } catch (error) {
    console.error('[shutterstock] API error:', error);
    res.json({ results: [] });
  }
});

export default router;
