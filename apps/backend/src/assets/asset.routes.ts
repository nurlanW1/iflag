import express from 'express';
import {
  getAssetById,
  getAssetBySlug,
  searchAssets,
  createAsset,
  updateAsset,
  deleteAsset,
  getDownloadUrl,
  recordDownload,
} from './asset.service.js';
import { authenticateToken, optionalAuth, requireAdmin, AuthRequest } from '../auth/auth.middleware.js';

const router = express.Router();

// GET /api/assets - Search and filter assets
router.get('/', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const assetType = req.query.asset_type;
    const assetTypeArray = assetType
      ? (Array.isArray(assetType)
          ? assetType.map(t => String(t))
          : [String(assetType)])
      : undefined;

    const tags = req.query.tags;
    const tagsArray = tags
      ? (Array.isArray(tags)
          ? tags.map(t => String(t))
          : [String(tags)])
      : undefined;

    const filters = {
      asset_type: assetTypeArray,
      category_id: req.query.category_id ? String(req.query.category_id) : undefined,
      tags: tagsArray,
      country_code: req.query.country_code ? String(req.query.country_code) : undefined,
      is_premium: req.query.is_premium === 'true' ? true : req.query.is_premium === 'false' ? false : undefined,
      status: req.query.status ? String(req.query.status) : undefined,
      search: req.query.search ? String(req.query.search) : undefined,
      page: req.query.page ? parseInt(String(req.query.page)) : undefined,
      limit: req.query.limit ? parseInt(String(req.query.limit)) : undefined,
      sort: req.query.sort as 'newest' | 'oldest' | 'popular' | 'title' | undefined,
    };

    // Non-admins can only see published assets
    if (!req.user || req.user.role !== 'admin') {
      filters.status = 'published';
    }

    const result = await searchAssets(filters, req.user?.userId);
    res.json(result);
  } catch (error) {
    console.error('Search assets error:', error);
    res.status(500).json({ error: 'Failed to search assets' });
  }
});

// GET /api/assets/:id
router.get('/:id', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const assetId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const asset = await getAssetById(assetId, req.user?.userId);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // Non-admins can only see published assets
    if ((!req.user || req.user.role !== 'admin') && asset.status !== 'published') {
      return res.status(404).json({ error: 'Asset not found' });
    }

    res.json(asset);
  } catch (error) {
    console.error('Get asset error:', error);
    res.status(500).json({ error: 'Failed to fetch asset' });
  }
});

// GET /api/assets/slug/:slug
router.get('/slug/:slug', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
    const asset = await getAssetBySlug(slug);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // Non-admins can only see published assets
    if ((!req.user || req.user.role !== 'admin') && asset.status !== 'published') {
      return res.status(404).json({ error: 'Asset not found' });
    }

    res.json(asset);
  } catch (error) {
    console.error('Get asset by slug error:', error);
    res.status(500).json({ error: 'Failed to fetch asset' });
  }
});

// POST /api/assets - Create asset (admin only)
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

// GET /api/assets/:id/download - Get download URL
router.get('/:id/download', optionalAuth, async (req: AuthRequest, res) => {
  const assetId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  try {
    const ipAddress = req.ip || req.headers['x-forwarded-for'] as string || undefined;
    const userAgent = req.headers['user-agent'] || undefined;

    const { url, type } = await getDownloadUrl(assetId, req.user?.userId);

    // Record download
    await recordDownload(
      assetId,
      req.user?.userId || null,
      type,
      ipAddress,
      userAgent
    );

    res.json({ url, type });
  } catch (error: any) {
    if (error.message === 'Asset not found' || error.message === 'Asset not available') {
      return res.status(404).json({ error: error.message });
    }
    console.error('Get download URL error:', error);
    res.status(500).json({ error: 'Failed to get download URL' });
  }
});

export default router;
