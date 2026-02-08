import pool from '../db.js';
import { hasActivePremiumSubscription } from '../subscriptions/subscription.service.js';

export interface Asset {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  asset_type: 'flag' | 'symbol' | 'video' | 'animated' | 'coat_of_arms' | 'emblem';
  category_id: string | null;
  original_file_url: string;
  preview_file_url: string | null;
  thumbnail_url: string | null;
  file_format: string | null;
  file_size_bytes: number | null;
  dimensions_width: number | null;
  dimensions_height: number | null;
  duration_seconds: number | null;
  is_premium: boolean;
  download_count: number;
  keywords: string[] | null;
  country_code: string | null;
  organization_name: string | null;
  status: 'draft' | 'published' | 'archived';
  created_at: Date;
  updated_at: Date;
  published_at: Date | null;
  tags?: Array<{ id: string; name: string; slug: string }>;
  category?: { id: string; name: string; slug: string };
}

export interface AssetFilters {
  asset_type?: string[];
  category_id?: string;
  tags?: string[];
  country_code?: string;
  is_premium?: boolean;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: 'newest' | 'oldest' | 'popular' | 'title';
}

export interface CreateAssetData {
  title: string;
  description?: string;
  asset_type: Asset['asset_type'];
  category_id?: string;
  original_file_url: string;
  preview_file_url?: string;
  thumbnail_url?: string;
  file_format?: string;
  file_size_bytes?: number;
  dimensions_width?: number;
  dimensions_height?: number;
  duration_seconds?: number;
  is_premium?: boolean;
  keywords?: string[];
  country_code?: string;
  organization_name?: string;
  tag_ids?: string[];
  status?: Asset['status'];
}

// Generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Get asset by ID
export async function getAssetById(id: string, userId?: string): Promise<Asset | null> {
  const result = await pool.query(
    `SELECT a.*, 
       COALESCE(
         json_agg(
           DISTINCT jsonb_build_object('id', t.id, 'name', t.name, 'slug', t.slug)
         ) FILTER (WHERE t.id IS NOT NULL),
         '[]'
       ) as tags,
       json_build_object('id', c.id, 'name', c.name, 'slug', c.slug) as category
     FROM assets a
     LEFT JOIN asset_tags at ON a.id = at.asset_id
     LEFT JOIN tags t ON at.tag_id = t.id
     LEFT JOIN asset_categories c ON a.category_id = c.id
     WHERE a.id = $1
     GROUP BY a.id, c.id, c.name, c.slug`,
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const asset = result.rows[0];
  asset.tags = asset.tags || [];
  return asset;
}

// Get asset by slug
export async function getAssetBySlug(slug: string): Promise<Asset | null> {
  const result = await pool.query(
    `SELECT a.*, 
       COALESCE(
         json_agg(
           DISTINCT jsonb_build_object('id', t.id, 'name', t.name, 'slug', t.slug)
         ) FILTER (WHERE t.id IS NOT NULL),
         '[]'
       ) as tags,
       json_build_object('id', c.id, 'name', c.name, 'slug', c.slug) as category
     FROM assets a
     LEFT JOIN asset_tags at ON a.id = at.asset_id
     LEFT JOIN tags t ON at.tag_id = t.id
     LEFT JOIN asset_categories c ON a.category_id = c.id
     WHERE a.slug = $1
     GROUP BY a.id, c.id, c.name, c.slug`,
    [slug]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const asset = result.rows[0];
  asset.tags = asset.tags || [];
  return asset;
}

// Search and filter assets
export async function searchAssets(
  filters: AssetFilters = {},
  userId?: string
): Promise<{ assets: Asset[]; total: number; page: number; limit: number }> {
  const {
    asset_type,
    category_id,
    tags,
    country_code,
    is_premium,
    status = 'published',
    search,
    page = 1,
    limit = 24,
    sort = 'newest',
  } = filters;

  const offset = (page - 1) * limit;
  const conditions: string[] = [];
  const params: any[] = [];
  let paramCount = 0;

  // Status filter (only show published to non-admins)
  conditions.push(`a.status = $${++paramCount}`);
  params.push(status);

  // Asset type filter
  if (asset_type && asset_type.length > 0) {
    conditions.push(`a.asset_type = ANY($${++paramCount})`);
    params.push(asset_type);
  }

  // Category filter
  if (category_id) {
    conditions.push(`a.category_id = $${++paramCount}`);
    params.push(category_id);
  }

  // Country code filter
  if (country_code) {
    conditions.push(`a.country_code = $${++paramCount}`);
    params.push(country_code);
  }

  // Premium filter
  if (is_premium !== undefined) {
    conditions.push(`a.is_premium = $${++paramCount}`);
    params.push(is_premium);
  }

  // Tag filter
  if (tags && tags.length > 0) {
    conditions.push(
      `EXISTS (
        SELECT 1 FROM asset_tags at2
        JOIN tags t2 ON at2.tag_id = t2.id
        WHERE at2.asset_id = a.id AND t2.slug = ANY($${++paramCount})
      )`
    );
    params.push(tags);
  }

  // Search filter (full-text search)
  if (search) {
    conditions.push(
      `(to_tsvector('english', coalesce(a.title, '') || ' ' || coalesce(a.description, '')) @@ plainto_tsquery('english', $${++paramCount})
       OR a.title ILIKE $${++paramCount}
       OR a.keywords && $${++paramCount})`
    );
    const searchTerm = `%${search}%`;
    params.push(search, searchTerm, [search]);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Sort order
  let orderBy = 'a.created_at DESC';
  switch (sort) {
    case 'oldest':
      orderBy = 'a.created_at ASC';
      break;
    case 'popular':
      orderBy = 'a.download_count DESC';
      break;
    case 'title':
      orderBy = 'a.title ASC';
      break;
  }

  // Get total count
  const countResult = await pool.query(
    `SELECT COUNT(DISTINCT a.id) as total FROM assets a ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].total);

  // Get assets
  const result = await pool.query(
    `SELECT a.*, 
       COALESCE(
         json_agg(
           DISTINCT jsonb_build_object('id', t.id, 'name', t.name, 'slug', t.slug)
         ) FILTER (WHERE t.id IS NOT NULL),
         '[]'
       ) as tags,
       json_build_object('id', c.id, 'name', c.name, 'slug', c.slug) as category
     FROM assets a
     LEFT JOIN asset_tags at ON a.id = at.asset_id
     LEFT JOIN tags t ON at.tag_id = t.id
     LEFT JOIN asset_categories c ON a.category_id = c.id
     ${whereClause}
     GROUP BY a.id, c.id, c.name, c.slug
     ORDER BY ${orderBy}
     LIMIT $${++paramCount} OFFSET $${++paramCount}`,
    [...params, limit, offset]
  );

  const assets = result.rows.map((row: any) => ({
    ...row,
    tags: row.tags || [],
  }));

  return { assets, total, page, limit };
}

// Create asset (admin only)
export async function createAsset(
  data: CreateAssetData,
  createdBy: string
): Promise<Asset> {
  const slug = generateSlug(data.title);

  // Check if slug exists
  const existing = await pool.query('SELECT id FROM assets WHERE slug = $1', [slug]);
  if (existing.rows.length > 0) {
    throw new Error('Asset with this title already exists');
  }

  const result = await pool.query(
    `INSERT INTO assets (
       title, slug, description, asset_type, category_id,
       original_file_url, preview_file_url, thumbnail_url,
       file_format, file_size_bytes, dimensions_width, dimensions_height,
       duration_seconds, is_premium, keywords, country_code,
       organization_name, status, created_by, published_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
     RETURNING *`,
    [
      data.title,
      slug,
      data.description || null,
      data.asset_type,
      data.category_id || null,
      data.original_file_url,
      data.preview_file_url || null,
      data.thumbnail_url || null,
      data.file_format || null,
      data.file_size_bytes || null,
      data.dimensions_width || null,
      data.dimensions_height || null,
      data.duration_seconds || null,
      data.is_premium !== undefined ? data.is_premium : true,
      data.keywords || null,
      data.country_code || null,
      data.organization_name || null,
      data.status || 'draft',
      createdBy,
      data.status === 'published' ? new Date() : null,
    ]
  );

  const asset = result.rows[0];

  // Add tags if provided
  if (data.tag_ids && data.tag_ids.length > 0) {
    for (const tagId of data.tag_ids) {
      await pool.query('INSERT INTO asset_tags (asset_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [
        asset.id,
        tagId,
      ]);
    }
  }

  return await getAssetById(asset.id) as Asset;
}

// Update asset (admin only)
export async function updateAsset(
  id: string,
  data: Partial<CreateAssetData>
): Promise<Asset | null> {
  const updates: string[] = [];
  const params: any[] = [];
  let paramCount = 0;

  if (data.title) {
    updates.push(`title = $${++paramCount}`);
    params.push(data.title);
    updates.push(`slug = $${++paramCount}`);
    params.push(generateSlug(data.title));
  }
  if (data.description !== undefined) {
    updates.push(`description = $${++paramCount}`);
    params.push(data.description);
  }
  if (data.asset_type) {
    updates.push(`asset_type = $${++paramCount}`);
    params.push(data.asset_type);
  }
  if (data.category_id !== undefined) {
    updates.push(`category_id = $${++paramCount}`);
    params.push(data.category_id);
  }
  if (data.original_file_url) {
    updates.push(`original_file_url = $${++paramCount}`);
    params.push(data.original_file_url);
  }
  if (data.preview_file_url !== undefined) {
    updates.push(`preview_file_url = $${++paramCount}`);
    params.push(data.preview_file_url);
  }
  if (data.thumbnail_url !== undefined) {
    updates.push(`thumbnail_url = $${++paramCount}`);
    params.push(data.thumbnail_url);
  }
  if (data.is_premium !== undefined) {
    updates.push(`is_premium = $${++paramCount}`);
    params.push(data.is_premium);
  }
  if (data.status) {
    updates.push(`status = $${++paramCount}`);
    params.push(data.status);
    if (data.status === 'published') {
      updates.push(`published_at = COALESCE(published_at, CURRENT_TIMESTAMP)`);
    }
  }

  if (updates.length === 0) {
    return await getAssetById(id);
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  params.push(id);

  await pool.query(
    `UPDATE assets SET ${updates.join(', ')} WHERE id = $${++paramCount}`,
    params
  );

  // Update tags if provided
  if (data.tag_ids) {
    await pool.query('DELETE FROM asset_tags WHERE asset_id = $1', [id]);
    for (const tagId of data.tag_ids) {
      await pool.query('INSERT INTO asset_tags (asset_id, tag_id) VALUES ($1, $2)', [
        id,
        tagId,
      ]);
    }
  }

  return await getAssetById(id);
}

// Delete asset (admin only)
export async function deleteAsset(id: string): Promise<boolean> {
  const result = await pool.query('DELETE FROM assets WHERE id = $1 RETURNING id', [id]);
  return result.rows.length > 0;
}

// Increment download count
export async function incrementDownloadCount(assetId: string): Promise<void> {
  await pool.query('UPDATE assets SET download_count = download_count + 1 WHERE id = $1', [
    assetId,
  ]);
}

// Record download
export async function recordDownload(
  assetId: string,
  userId: string | null,
  downloadType: 'free' | 'premium' | 'watermarked',
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await pool.query(
    `INSERT INTO downloads (user_id, asset_id, download_type, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, assetId, downloadType, ipAddress || null, userAgent || null]
  );
  await incrementDownloadCount(assetId);
}

// Get download URL (with premium check and watermarking)
export async function getDownloadUrl(
  assetId: string,
  userId?: string
): Promise<{ url: string; type: 'free' | 'premium' | 'watermarked' }> {
  const asset = await getAssetById(assetId, userId);
  if (!asset) {
    throw new Error('Asset not found');
  }

  if (asset.status !== 'published') {
    throw new Error('Asset not available');
  }

  // Check if user has premium access
  let hasPremium = false;
  if (userId) {
    hasPremium = await hasActivePremiumSubscription(userId);
  }

  // If asset is premium and user doesn't have premium, return watermarked version
  if (asset.is_premium && !hasPremium) {
    return {
      url: asset.preview_file_url || asset.original_file_url,
      type: 'watermarked',
    };
  }

  // Return original file
  return {
    url: asset.original_file_url,
    type: asset.is_premium ? 'premium' : 'free',
  };
}
