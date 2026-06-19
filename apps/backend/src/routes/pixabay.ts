import express, { Request, Response } from 'express';

const router = express.Router();

const cache = new Map<string, { data: unknown; expiresAt: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000;

router.get('/search', async (req: Request, res: Response) => {
  try {
    const query = (req.query['q'] as string) || 'flag';
    const perPage = Math.min(20, Number(req.query['per_page']) || 12);

    const cacheKey = `${query}|${perPage}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      res.json(cached.data);
      return;
    }

    const apiKey = process.env.PIXABAY_API_KEY?.trim();
    if (!apiKey) {
      res.json({ results: [] });
      return;
    }

    const response = await fetch(
      `https://pixabay.com/api/?key=${apiKey}` +
        `&q=${encodeURIComponent(query)}&image_type=photo&per_page=${perPage}`,
    );

    if (!response.ok) {
      console.error('[pixabay] upstream error:', response.status);
      res.json({ results: [] });
      return;
    }

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
    cache.set(cacheKey, { data: payload, expiresAt: Date.now() + CACHE_TTL_MS });
    res.json(payload);
  } catch (error) {
    console.error('[pixabay] error:', error);
    res.json({ results: [] });
  }
});

export default router;
