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

    const apiKey = process.env.PEXELS_API_KEY?.trim();
    if (!apiKey) {
      res.json({ results: [] });
      return;
    }

    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}`,
      { headers: { Authorization: apiKey } },
    );

    if (!response.ok) {
      console.error('[pexels] upstream error:', response.status);
      res.json({ results: [] });
      return;
    }

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
      description: img.alt || query,
      photographer: img.photographer,
      sourceUrl: img.url,
      source: 'pexels' as const,
    }));

    const payload = { results };
    cache.set(cacheKey, { data: payload, expiresAt: Date.now() + CACHE_TTL_MS });
    res.json(payload);
  } catch (error) {
    console.error('[pexels] error:', error);
    res.json({ results: [] });
  }
});

export default router;
