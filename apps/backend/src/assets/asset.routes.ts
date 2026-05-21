import express from 'express';
import {
  getAssetById,
  getAssetBySlug,
  createAsset,
  updateAsset,
  deleteAsset,
  getDownloadUrl,
  recordDownload,
} from './asset.service.js';
import {
  getPublishedCountryFlagById,
  listPublishedCountryFlagFiles,
} from './country-flag-files-public.service.js';
import { authenticateToken, optionalAuth, requireAdmin, AuthRequest } from '../auth/auth.middleware.js';

const router = express.Router();

function parseListQuery(req: express.Request) {
  const qRaw = req.query.q ?? req.query.search;
  const q = Array.isArray(qRaw) ? String(qRaw[0]) : qRaw ? String(qRaw) : undefined;
  const searchRaw = req.query.search;
  const search = Array.isArray(searchRaw) ? String(searchRaw[0]) : searchRaw ? String(searchRaw) : undefined;

  const pageRaw = req.query.page;
  const page = pageRaw ? parseInt(String(Array.isArray(pageRaw) ? pageRaw[0] : pageRaw), 10) : undefined;
  const limitRaw = req.query.limit;
  const limit = limitRaw ? parseInt(String(Array.isArray(limitRaw) ? limitRaw[0] : limitRaw), 10) : undefined;

  const sortRaw = req.query.sort;
  const sort = (Array.isArray(sortRaw) ? sortRaw[0] : sortRaw)
    ? String(Array.isArray(sortRaw) ? sortRaw[0] : sortRaw)
    : undefined;

  const countrySlugRaw = req.query.country_slug;
  const country_slug = countrySlugRaw
    ? String(Array.isArray(countrySlugRaw) ? countrySlugRaw[0] : countrySlugRaw)
    : undefined;

  const formatRaw = req.query.format;
  const format = formatRaw ? String(Array.isArray(formatRaw) ? formatRaw[0] : formatRaw) : undefined;

  const tierRaw = req.query.premium_tier;
  const premium_tier = tierRaw ? String(Array.isArray(tierRaw) ? tierRaw[0] : tierRaw) : undefined;

  return {
    q: q?.trim() || search?.trim(),
    search: search?.trim(),
    page,
    limit,
    sort: sort as 'newest' | 'oldest' | 'title' | 'popular' | undefined,
    country_slug,
    format,
    premium_tier,
  };
}

/**
 * GET /api/assets — published `country_flag_files` (R2 / Neon), paginated.
 * Query: q | search, country_slug, format, premium_tier, page, limit, sort
 */
router.get('/', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const f = parseListQuery(req);
    const result = await listPublishedCountryFlagFiles({
      q: f.q,
      search: f.search,
      country_slug: f.country_slug,
      format: f.format,
      premium_tier: f.premium_tier,
      page: f.page,
      limit: f.limit,
      sort: f.sort === 'popular' ? 'newest' : f.sort,
    });
    res.json({
      source: 'country_flag_files',
      ...result,
    });
  } catch (error) {
    console.error('[assets] list country_flag_files error:', error);
    res.status(500).json({ error: 'Failed to list assets' });
  }
});

/** GET /api/assets/search — alias of GET / (stock-style path). */
router.get('/search', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const f = parseListQuery(req);
    const result = await listPublishedCountryFlagFiles({
      q: f.q,
      search: f.search,
      country_slug: f.country_slug,
      format: f.format,
      premium_tier: f.premium_tier,
      page: f.page,
      limit: f.limit,
      sort: f.sort === 'popular' ? 'newest' : f.sort,
    });
    res.json({
      source: 'country_flag_files',
      ...result,
    });
  } catch (error) {
    console.error('[assets] search country_flag_files error:', error);
    res.status(500).json({ error: 'Failed to search assets' });
  }
});

// GET /api/assets/slug/:slug — legacy `assets` CMS by slug
router.get('/slug/:slug', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
    const asset = await getAssetBySlug(slug);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    if ((!req.user || req.user.role !== 'admin') && asset.status !== 'published') {
      return res.status(404).json({ error: 'Asset not found' });
    }

    res.json({ source: 'legacy_asset', ...asset });
  } catch (error) {
    console.error('Get asset by slug error:', error);
    res.status(500).json({ error: 'Failed to fetch asset' });
  }
});

// GET /api/assets/:id/download — legacy `assets` table download flow
router.get('/:id/download', optionalAuth, async (req: AuthRequest, res) => {
  const assetId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  try {
    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || undefined;
    const userAgent = req.headers['user-agent'] || undefined;

    const { url, type } = await getDownloadUrl(assetId, req.user?.userId);

    await recordDownload(assetId, req.user?.userId || null, type, ipAddress, userAgent);

    res.json({ url, type });
  } catch (error: any) {
    if (error.message === 'Asset not found' || error.message === 'Asset not available') {
      return res.status(404).json({ error: error.message });
    }
    console.error('Get download URL error:', error);
    res.status(500).json({ error: 'Failed to get download URL' });
  }
});

/**
 * GET /api/assets/:id — prefer published `country_flag_files` by UUID; else legacy `assets`.
 */
router.get('/:id', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const assetId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const flag = await getPublishedCountryFlagById(assetId);
    if (flag) {
      return res.json({ source: 'country_flag_file', ...flag });
    }

    const asset = await getAssetById(assetId, req.user?.userId);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    if ((!req.user || req.user.role !== 'admin') && asset.status !== 'published') {
      return res.status(404).json({ error: 'Asset not found' });
    }

    res.json({ source: 'legacy_asset', ...asset });
  } catch (error) {
    console.error('Get asset error:', error);
    res.status(500).json({ error: 'Failed to fetch asset' });
  }
});

// POST /api/assets - Create asset (admin only) — legacy CMS
router.post('/', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const asset = await createAsset(req.body, req.user!.userId);
    res.status(201).json(asset);
  } catch (error: any) {
    if (error.message === 'Asset with this title already exists') {
      return res.status(409).json({ error: error.message });
    }
    console.error('Create asset error:', error);
    res.status(500).json({ error: 'Failed to create asset' });
  }
});

// PUT /api/assets/:id - Update asset (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const assetId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const asset = await updateAsset(assetId, req.body);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    res.json(asset);
  } catch (error) {
    console.error('Update asset error:', error);
    res.status(500).json({ error: 'Failed to update asset' });
  }
});

// DELETE /api/assets/:id - Delete asset (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const assetId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const deleted = await deleteAsset(assetId);
    if (!deleted) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    res.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    console.error('Delete asset error:', error);
    res.status(500).json({ error: 'Failed to delete asset' });
  }
});

export default router;
