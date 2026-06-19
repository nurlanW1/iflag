import express, { Request, Response } from 'express';

const router = express.Router();

type StockFilter = 'all' | 'free' | 'vector' | 'photo' | 'video' | 'png' | 'jpg' | 'icon';

const cache = new Map<string, { data: unknown; expiresAt: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000;
const ALLOWED_FILTERS = new Set<StockFilter>(['all', 'free', 'vector', 'photo', 'video', 'png', 'jpg', 'icon']);

function cleanQuery(value: unknown): string {
  const raw = typeof value === 'string' ? value : 'flag';
  const q = raw.replace(/[^\p{L}\p{N}\s+-]/gu, ' ').replace(/\s+/g, ' ').trim();
  return q.slice(0, 80) || 'flag';
}

function stockFilter(value: unknown): StockFilter {
  return typeof value === 'string' && ALLOWED_FILTERS.has(value as StockFilter) ? (value as StockFilter) : 'all';
}

function queryForFilter(q: string, filter: StockFilter): string {
  if (filter === 'jpg' || filter === 'photo') return `${q} photo`;
  if (filter === 'video') return `${q} video`;
  return q;
}

router.get('/search', async (req: Request, res: Response) => {
  try {
    const query = cleanQuery(req.query['q']);
    const filter = stockFilter(req.query['filter']);
    const perPage = Math.min(40, Math.max(1, Number(req.query['per_page']) || 12));
    const page = Math.min(50, Math.max(1, Number(req.query['page']) || 1));

    if (filter === 'vector' || filter === 'png' || filter === 'icon') {
      res.json({ results: [], hasMore: false });
      return;
    }

    const cacheKey = `${query}|${filter}|${perPage}|${page}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      res.json(cached.data);
      return;
    }

    const apiKey = process.env.PEXELS_API_KEY?.trim();
    if (!apiKey) {
      res.json({ results: [], hasMore: false });
      return;
    }

    if (filter === 'video') {
      const response = await fetch(
        `https://api.pexels.com/videos/search?query=${encodeURIComponent(queryForFilter(query, filter))}&per_page=${perPage}&page=${page}`,
        { headers: { Authorization: apiKey } },
      );

      if (!response.ok) {
        console.error('[pexels] upstream error:', response.status);
        res.json({ results: [], hasMore: false });
        return;
      }

      const data = (await response.json()) as {
        next_page?: string;
        videos?: Array<{
          id: number;
          image?: string;
          url: string;
          user?: { name?: string };
        }>;
      };

      const results = (data.videos ?? []).map((video) => ({
        id: `pexels-video-${video.id}`,
        thumbUrl: video.image ?? '',
        description: `${query} flag video`,
        photographer: video.user?.name ?? 'Pexels',
        sourceUrl: video.url,
        source: 'pexels' as const,
        licenseType: 'free' as const,
        mediaType: 'video' as const,
      }));

      const payload = { results, hasMore: Boolean(data.next_page) };
      cache.set(cacheKey, { data: payload, expiresAt: Date.now() + CACHE_TTL_MS });
      res.json(payload);
      return;
    }

    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(queryForFilter(query, filter))}&per_page=${perPage}&page=${page}`,
      { headers: { Authorization: apiKey } },
    );

    if (!response.ok) {
      console.error('[pexels] upstream error:', response.status);
      res.json({ results: [], hasMore: false });
      return;
    }

    const data = (await response.json()) as {
      next_page?: string;
      photos?: Array<{
        id: number;
        alt?: string;
        photographer: string;
        url: string;
        src: { medium: string; large?: string; large2x?: string };
      }>;
    };

    const results = (data.photos ?? []).map((img) => ({
      id: `pexels-${img.id}`,
      thumbUrl: img.src.large2x || img.src.large || img.src.medium,
      description: img.alt || query,
      photographer: img.photographer,
      sourceUrl: img.url,
      source: 'pexels' as const,
      licenseType: 'free' as const,
      mediaType: filter === 'jpg' ? 'jpg' as const : 'photo' as const,
    }));

    const payload = { results, hasMore: Boolean(data.next_page) };
    cache.set(cacheKey, { data: payload, expiresAt: Date.now() + CACHE_TTL_MS });
    res.json(payload);
  } catch (error) {
    console.error('[pexels] error:', error);
    res.json({ results: [], hasMore: false });
  }
});

export default router;
