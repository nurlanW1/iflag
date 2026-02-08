// Admin Routes - Private CMS API

import express from 'express';
import multer from 'multer';
import pool from '../db.js';
import {
  getAdminStats,
  bulkUploadAsset,
  getAssetWithFiles,
  updateAssetMetadata,
  toggleAssetStatus,
  safeDeleteAsset,
  getAssetDownloadStats,
  getSubscriptionOverview,
} from './admin.service.js';
import {
  getCountries,
  getCountryById,
  getCountryBySlug,
  createCountry,
  updateCountry,
  deleteCountry,
  restoreCountry,
  getCountryFlagFiles,
  createFlagFile,
  updateFlagFile,
  deleteFlagFile,
  CreateCountryData,
  CreateFlagFileData,
} from './countries.service.js';
import { authenticateToken, requireAdmin, AuthRequest } from '../auth/auth.middleware.js';
import { searchAssets } from '../assets/asset.service.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB per file
    files: 20, // Max 20 files at once
  },
  fileFilter: (req, file, cb) => {
    // Allow all formats defined in asset strategy
    const allowedMimes = [
      'image/svg+xml',
      'application/postscript',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/tiff',
      'image/tif',
      'video/mp4',
      'video/webm',
      'video/quicktime',
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}`));
    }
  },
});

// GET /api/admin/stats - Dashboard statistics
router.get('/stats', async (req: AuthRequest, res) => {
  try {
    const stats = await getAdminStats();
    res.json(stats);
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ error: 'Failed to fetch admin statistics' });
  }
});

// POST /api/admin/assets/upload - Bulk upload assets
router.post('/assets/upload', upload.array('files', 20), async (req: AuthRequest, res) => {
  try {
    const files = (req.files as Express.Multer.File[]) || [];
    
    if (files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const {
      title,
      description,
      asset_type,
      category_id,
      country_code,
      organization_name,
      is_premium,
      status,
      tags,
      style,
    } = req.body;

    // Validation
    if (!title || !asset_type) {
      return res.status(400).json({ error: 'Title and asset_type are required' });
    }

    const isPremium = is_premium === 'true' || is_premium === true;

    // Parse tags if string
    let tagArray: string[] = [];
    if (tags) {
      tagArray = typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : tags;
    }

    const result = await bulkUploadAsset(
      req.user!.userId,
      {
        title,
        description,
        asset_type,
        category_id: category_id || undefined,
        country_code: country_code || undefined,
        organization_name: organization_name || undefined,
        is_premium: isPremium,
        status: status || 'draft',
        tags: tagArray,
        style: style || undefined,
      },
      files.map(f => ({
        buffer: f.buffer,
        originalname: f.originalname,
        mimetype: f.mimetype,
        size: f.size,
      }))
    );

    res.status(201).json(result);
  } catch (error: any) {
    console.error('Bulk upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload assets' });
  }
});

// GET /api/admin/assets - List all assets (with filters)
router.get('/assets', async (req: AuthRequest, res) => {
  try {
    const assetType = req.query.asset_type;
    const assetTypeArray = assetType
      ? (Array.isArray(assetType) 
          ? assetType.map(t => String(t))
          : [String(assetType)])
      : undefined;

    const filters = {
      asset_type: assetTypeArray,
      category_id: req.query.category_id ? String(req.query.category_id) : undefined,
      status: req.query.status ? String(req.query.status) : undefined,
      is_premium: req.query.is_premium === 'true' ? true : req.query.is_premium === 'false' ? false : undefined,
      search: req.query.search ? String(req.query.search) : undefined,
      page: req.query.page ? parseInt(String(req.query.page)) : 1,
      limit: req.query.limit ? parseInt(String(req.query.limit)) : 50,
      sort: req.query.sort as 'newest' | 'oldest' | 'popular' | 'title' | undefined,
    };

    const result = await searchAssets(filters);
    res.json(result);
  } catch (error) {
    console.error('Get admin assets error:', error);
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
});

// GET /api/admin/assets/:id - Get asset with all files
router.get('/assets/:id', async (req: AuthRequest, res) => {
  try {
    const assetId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const asset = await getAssetWithFiles(assetId);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    res.json(asset);
  } catch (error) {
    console.error('Get asset error:', error);
    res.status(500).json({ error: 'Failed to fetch asset' });
  }
});

// PUT /api/admin/assets/:id - Update asset metadata
router.put('/assets/:id', async (req: AuthRequest, res) => {
  try {
    const {
      title,
      description,
      category_id,
      country_code,
      organization_name,
      is_premium,
      status,
      tags,
      style,
    } = req.body;

    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (category_id !== undefined) updates.category_id = category_id;
    if (country_code !== undefined) updates.country_code = country_code;
    if (organization_name !== undefined) updates.organization_name = organization_name;
    if (is_premium !== undefined) updates.is_premium = is_premium === 'true' || is_premium === true;
    if (status !== undefined) updates.status = status;
    if (tags !== undefined) {
      updates.tags = typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : tags;
    }
    if (style !== undefined) updates.style = style;

    const assetId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const asset = await updateAssetMetadata(assetId, updates);
    res.json(asset);
  } catch (error: any) {
    console.error('Update asset error:', error);
    res.status(500).json({ error: error.message || 'Failed to update asset' });
  }
});

// PATCH /api/admin/assets/:id/toggle - Toggle asset status
router.patch('/assets/:id/toggle', async (req: AuthRequest, res) => {
  try {
    const { enabled } = req.body;
    const assetId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await toggleAssetStatus(assetId, enabled === true || enabled === 'true');
    res.json({ message: 'Asset status updated' });
  } catch (error) {
    console.error('Toggle asset status error:', error);
    res.status(500).json({ error: 'Failed to toggle asset status' });
  }
});

// DELETE /api/admin/assets/:id - Safe delete asset
router.delete('/assets/:id', async (req: AuthRequest, res) => {
  try {
    const assetId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await safeDeleteAsset(assetId);
    res.json({ message: 'Asset archived successfully' });
  } catch (error) {
    console.error('Delete asset error:', error);
    res.status(500).json({ error: 'Failed to delete asset' });
  }
});

// GET /api/admin/assets/:id/stats - Get asset download statistics
router.get('/assets/:id/stats', async (req: AuthRequest, res) => {
  try {
    const assetId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const stats = await getAssetDownloadStats(assetId);
    res.json(stats);
  } catch (error) {
    console.error('Get asset stats error:', error);
    res.status(500).json({ error: 'Failed to fetch asset statistics' });
  }
});

// GET /api/admin/subscriptions - Get subscription overview
router.get('/subscriptions', async (req: AuthRequest, res) => {
  try {
    const overview = await getSubscriptionOverview();
    res.json(overview);
  } catch (error) {
    console.error('Get subscription overview error:', error);
    res.status(500).json({ error: 'Failed to fetch subscription overview' });
  }
});

// GET /api/admin/categories - Get all categories
router.get('/categories', async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM asset_categories ORDER BY display_order, name'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /api/admin/tags - Get all tags
router.get('/tags', async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tags ORDER BY name LIMIT 1000'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// ============================================================================
// COUNTRIES MANAGEMENT ROUTES
// ============================================================================

// GET /api/admin/countries - List all countries with filters
router.get('/countries', async (req: AuthRequest, res) => {
  try {
    const filters = {
      search: req.query.search ? String(req.query.search) : undefined,
      region: req.query.region ? String(req.query.region) : undefined,
      category: req.query.category ? String(req.query.category) : undefined,
      status: req.query.status ? String(req.query.status) : undefined,
      page: req.query.page ? parseInt(String(req.query.page)) : 1,
      limit: req.query.limit ? parseInt(String(req.query.limit)) : 50,
      sort: req.query.sort as 'name' | 'created_at' | 'display_order' | undefined,
    };

    const result = await getCountries(filters);
    res.json(result);
  } catch (error: any) {
    console.error('Get countries error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch countries' });
  }
});

// GET /api/admin/countries/:id - Get country by ID
router.get('/countries/:id', async (req: AuthRequest, res) => {
  try {
    const countryId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const country = await getCountryById(countryId);
    if (!country) {
      return res.status(404).json({ error: 'Country not found' });
    }
    res.json(country);
  } catch (error: any) {
    console.error('Get country error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch country' });
  }
});

// GET /api/admin/countries/slug/:slug - Get country by slug
router.get('/countries/slug/:slug', async (req: AuthRequest, res) => {
  try {
    const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
    const country = await getCountryBySlug(slug);
    if (!country) {
      return res.status(404).json({ error: 'Country not found' });
    }
    res.json(country);
  } catch (error: any) {
    console.error('Get country by slug error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch country' });
  }
});

// POST /api/admin/countries - Create new country
router.post('/countries', async (req: AuthRequest, res) => {
  try {
    const data: CreateCountryData = {
      name: req.body.name,
      slug: req.body.slug,
      name_alt: req.body.name_alt,
      iso_alpha_2: req.body.iso_alpha_2,
      iso_alpha_3: req.body.iso_alpha_3,
      iso_numeric: req.body.iso_numeric,
      region: req.body.region,
      subregion: req.body.subregion,
      category: req.body.category,
      description: req.body.description,
      flag_emoji: req.body.flag_emoji,
      thumbnail_url: req.body.thumbnail_url,
      status: req.body.status,
      is_featured: req.body.is_featured,
      display_order: req.body.display_order,
      keywords: req.body.keywords,
    };

    if (!data.name) {
      return res.status(400).json({ error: 'Country name is required' });
    }

    const country = await createCountry(data, req.user!.userId);
    res.status(201).json(country);
  } catch (error: any) {
    console.error('Create country error:', error);
    res.status(400).json({ error: error.message || 'Failed to create country' });
  }
});

// PUT /api/admin/countries/:id - Update country
router.put('/countries/:id', async (req: AuthRequest, res) => {
  try {
    const countryId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data: Partial<CreateCountryData> = {
      name: req.body.name,
      slug: req.body.slug,
      name_alt: req.body.name_alt,
      iso_alpha_2: req.body.iso_alpha_2,
      iso_alpha_3: req.body.iso_alpha_3,
      iso_numeric: req.body.iso_numeric,
      region: req.body.region,
      subregion: req.body.subregion,
      category: req.body.category,
      description: req.body.description,
      flag_emoji: req.body.flag_emoji,
      thumbnail_url: req.body.thumbnail_url,
      status: req.body.status,
      is_featured: req.body.is_featured,
      display_order: req.body.display_order,
      keywords: req.body.keywords,
    };

    const country = await updateCountry(countryId, data, req.user!.userId);
    res.json(country);
  } catch (error: any) {
    console.error('Update country error:', error);
    res.status(400).json({ error: error.message || 'Failed to update country' });
  }
});

// DELETE /api/admin/countries/:id - Delete country (soft delete)
router.delete('/countries/:id', async (req: AuthRequest, res) => {
  try {
    const countryId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await deleteCountry(countryId, req.user!.userId);
    res.json({ message: 'Country archived successfully' });
  } catch (error: any) {
    console.error('Delete country error:', error);
    res.status(400).json({ error: error.message || 'Failed to delete country' });
  }
});

// POST /api/admin/countries/:id/restore - Restore archived country
router.post('/countries/:id/restore', async (req: AuthRequest, res) => {
  try {
    const countryId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const country = await restoreCountry(countryId, req.user!.userId);
    res.json(country);
  } catch (error: any) {
    console.error('Restore country error:', error);
    res.status(400).json({ error: error.message || 'Failed to restore country' });
  }
});

// ============================================================================
// COUNTRY FLAG FILES MANAGEMENT ROUTES
// ============================================================================

// GET /api/admin/countries/:id/flags - Get all flag files for a country
router.get('/countries/:id/flags', async (req: AuthRequest, res) => {
  try {
    const countryId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const filters = {
      format: req.query.format ? String(req.query.format) : undefined,
      variant_name: req.query.variant_name ? String(req.query.variant_name) : undefined,
      status: req.query.status ? String(req.query.status) : undefined,
      premium_tier: req.query.premium_tier ? String(req.query.premium_tier) : undefined,
    };

    const flags = await getCountryFlagFiles(countryId, filters);
    res.json(flags);
  } catch (error: any) {
    console.error('Get country flags error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch flag files' });
  }
});

// POST /api/admin/countries/:id/flags - Upload/create flag file
router.post('/countries/:id/flags', upload.single('file'), async (req: AuthRequest, res) => {
  try {
    const countryId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Here you would typically:
    // 1. Upload file to storage (S3/local)
    // 2. Generate thumbnail
    // 3. Extract metadata (dimensions, etc.)
    // 4. Create database record

    // For now, this is a placeholder - you'll need to implement file storage
    // See upload.service.ts for reference

    const flagData: CreateFlagFileData = {
      country_id: countryId,
      file_name: file.originalname,
      file_path: `/uploads/countries/${countryId}/${file.originalname}`, // Placeholder
      file_url: `/api/files/countries/${countryId}/${file.originalname}`, // Placeholder
      file_size_bytes: file.size,
      mime_type: file.mimetype,
      format: file.mimetype.includes('svg') ? 'svg' :
              file.mimetype.includes('png') ? 'png' :
              file.mimetype.includes('jpeg') || file.mimetype.includes('jpg') ? 'jpg' :
              file.mimetype.includes('webp') ? 'webp' : 'png',
      variant_name: req.body.variant_name || 'flat',
      ratio: req.body.ratio || null,
      premium_tier: req.body.premium_tier || 'free',
      price_cents: req.body.price_cents ? parseInt(req.body.price_cents) : 0,
      watermark_enabled: req.body.watermark_enabled === 'true' || req.body.watermark_enabled === true,
      tags: req.body.tags ? (typeof req.body.tags === 'string' ? req.body.tags.split(',') : req.body.tags) : [],
      status: req.body.status || 'draft',
      uploaded_by: req.user!.userId,
    };

    const flagFile = await createFlagFile(flagData);
    res.status(201).json(flagFile);
  } catch (error: any) {
    console.error('Create flag file error:', error);
    res.status(400).json({ error: error.message || 'Failed to create flag file' });
  }
});

// PUT /api/admin/countries/flags/:flagId - Update flag file metadata
router.put('/countries/flags/:flagId', async (req: AuthRequest, res) => {
  try {
    const flagId = Array.isArray(req.params.flagId) ? req.params.flagId[0] : req.params.flagId;
    const updates: Partial<CreateFlagFileData> = {
      variant_name: req.body.variant_name,
      ratio: req.body.ratio,
      premium_tier: req.body.premium_tier,
      price_cents: req.body.price_cents,
      watermark_enabled: req.body.watermark_enabled,
      tags: req.body.tags,
      metadata: req.body.metadata,
      status: req.body.status,
    };

    const flagFile = await updateFlagFile(flagId, updates);
    res.json(flagFile);
  } catch (error: any) {
    console.error('Update flag file error:', error);
    res.status(400).json({ error: error.message || 'Failed to update flag file' });
  }
});

// DELETE /api/admin/countries/flags/:flagId - Delete flag file
router.delete('/countries/flags/:flagId', async (req: AuthRequest, res) => {
  try {
    const flagId = Array.isArray(req.params.flagId) ? req.params.flagId[0] : req.params.flagId;
    await deleteFlagFile(flagId);
    res.json({ message: 'Flag file deleted successfully' });
  } catch (error: any) {
    console.error('Delete flag file error:', error);
    res.status(400).json({ error: error.message || 'Failed to delete flag file' });
  }
});

export default router;
