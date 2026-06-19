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

function pixabayImageType(filter: StockFilter): 'all' | 'photo' | 'illustration' | 'vector' {
  if (filter === 'vector' || filter === 'icon' || filter === 'png') return 'vector';
  if (filter === 'photo' || filter === 'jpg') return 'photo';
  return 'all';
}

function queryForFilter(q: string, filter: StockFilter): string {
  if (filter === 'icon') return `${q} icon vector`;
  if (filter === 'png') return `${q} png transparent`;
  if (filter === 'jpg') return `${q} photo`;
  if (filter === 'vector') return `${q} vector`;
  return q;
}

router.get('/search', async (req: Request, res: Response) => {
  try {
    const query = cleanQuery(req.query['q']);
    const filter = stockFilter(req.query['filter']);
    const perPage = Math.min(40, Math.max(1, Number(req.query['per_page']) || 12));
    const page = Math.min(50, Math.max(1, Number(req.query['page']) || 1));

    if (filter === 'video') {
      res.json({ results: [], hasMore: false });
      return;
    }

    const cacheKey = `${query}|${filter}|${perPage}|${page}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      res.json(cached.data);
      return;
    }

    const apiKey = process.env.PIXABAY_API_KEY?.trim();
    if (!apiKey) {
      res.json({ results: [], hasMore: false });
      return;
    }

    const response = await fetch(
      `https://pixabay.com/api/?key=${apiKey}` +
        `&q=${encodeURIComponent(queryForFilter(query, filter))}` +
        `&image_type=${pixabayImageType(filter)}` +
        `&per_page=${perPage}&page=${page}&safesearch=true`,
    );

    if (!response.ok) {
      console.error('[pixabay] upstream error:', response.status);
      res.json({ results: [], hasMore: false });
      return;
    }

    const data = (await response.json()) as {
      totalHits?: number;
      hits?: Array<{
        id: number;
        tags: string;
        user: string;
        pageURL: string;
        webformatURL: string;
        previewURL?: string;
        largeImageURL?: string;
      }>;
    };

    const mediaType = filter === 'vector' || filter === 'icon' || filter === 'png'
      ? filter
      : filter === 'jpg'
        ? 'jpg'
        : 'photo';
    const results = (data.hits ?? []).map((img) => ({
      id: `pixabay-${img.id}`,
      thumbUrl: img.largeImageURL || img.webformatURL || img.previewURL || '',
      description: img.tags,
      photographer: img.user,
      sourceUrl: img.pageURL,
      source: 'pixabay' as const,
      licenseType: 'free' as const,
      mediaType,
    }));

    const hasMore = typeof data.totalHits === 'number' ? page * perPage < data.totalHits : results.length === perPage;
    const payload = { results, hasMore };
    cache.set(cacheKey, { data: payload, expiresAt: Date.now() + CACHE_TTL_MS });
    res.json(payload);
  } catch (error) {
    console.error('[pixabay] error:', error);
    res.json({ results: [], hasMore: false });
  }
});

export default router;
