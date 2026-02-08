// Admin Service - Core CMS functionality

import pool from '../db.js';
import { Asset, CreateAssetData } from '../assets/asset.service.js';
import { createAssetFile, CreateAssetFileParams } from '../assets/asset-file.service.js';
import { createProcessingJob } from '../assets/processing-queue.service.js';
import { detectFormatFromFilename } from 'asset-types';

export interface AdminStats {
  total_assets: number;
  published_assets: number;
  draft_assets: number;
  premium_assets: number;
  free_assets: number;
  total_downloads: number;
  total_subscriptions: number;
  active_subscriptions: number;
  revenue_cents: number;
  assets_by_type: Record<string, number>;
  assets_by_category: Record<string, number>;
  recent_uploads: Array<{
    id: string;
    title: string;
    created_at: Date;
    status: string;
  }>;
}

export interface BulkUploadResult {
  asset_id: string;
  files_uploaded: number;
  files_processed: number;
  errors: string[];
}

// Get admin dashboard statistics
export async function getAdminStats(): Promise<AdminStats> {
  // Total assets
  const assetsResult = await pool.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'published') as published,
      COUNT(*) FILTER (WHERE status = 'draft') as draft,
      COUNT(*) FILTER (WHERE is_premium = TRUE) as premium,
      COUNT(*) FILTER (WHERE is_premium = FALSE) as free
    FROM assets
  `);
  const assets = assetsResult.rows[0];

  // Downloads
  const downloadsResult = await pool.query('SELECT COUNT(*) as total FROM downloads');
  const downloads = downloadsResult.rows[0];

  // Subscriptions
  const subsResult = await pool.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'active') as active
    FROM user_subscriptions
  `);
  const subs = subsResult.rows[0];

  // Revenue (from subscriptions)
  const revenueResult = await pool.query(`
    SELECT COALESCE(SUM(sp.price_cents), 0) as revenue
    FROM user_subscriptions us
    JOIN subscription_plans sp ON us.plan_id = sp.id
    WHERE us.status = 'active'
  `);
  const revenue = revenueResult.rows[0];

  // Assets by type
  const typeResult = await pool.query(`
    SELECT asset_type, COUNT(*) as count
    FROM assets
    GROUP BY asset_type
  `);
  const assets_by_type: Record<string, number> = {};
  typeResult.rows.forEach((row: any) => {
    assets_by_type[row.asset_type] = parseInt(row.count);
  });

  // Assets by category
  const catResult = await pool.query(`
    SELECT c.name, COUNT(*) as count
    FROM assets a
    LEFT JOIN asset_categories c ON a.category_id = c.id
    GROUP BY c.name
  `);
  const assets_by_category: Record<string, number> = {};
  catResult.rows.forEach((row: any) => {
    assets_by_category[row.name || 'Uncategorized'] = parseInt(row.count);
  });

  // Recent uploads
  const recentResult = await pool.query(`
    SELECT id, title, created_at, status
    FROM assets
    ORDER BY created_at DESC
    LIMIT 10
  `);

  return {
    total_assets: parseInt(assets.total),
    published_assets: parseInt(assets.published),
    draft_assets: parseInt(assets.draft),
    premium_assets: parseInt(assets.premium),
    free_assets: parseInt(assets.free),
    total_downloads: parseInt(downloads.total),
    total_subscriptions: parseInt(subs.total),
    active_subscriptions: parseInt(subs.active),
    revenue_cents: parseInt(revenue.revenue),
    assets_by_type,
    assets_by_category,
    recent_uploads: recentResult.rows,
  };
}

// Bulk upload assets with multiple files
export async function bulkUploadAsset(
  adminId: string,
  assetData: {
    title: string;
    description?: string;
    asset_type: string;
    category_id?: string;
    country_code?: string;
    organization_name?: string;
    is_premium: boolean;
    status?: string;
    tags?: string[];
    style?: string;
  },
  files: Array<{
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
  }>
): Promise<BulkUploadResult> {
  const errors: string[] = [];
  let asset_id: string;
  let files_uploaded = 0;
  let files_processed = 0;

  try {
    // Create asset record
    const { createAsset } = await import('../assets/asset.service.js');
    const asset = await createAsset(
      {
        title: assetData.title,
        description: assetData.description,
        asset_type: assetData.asset_type as any,
        category_id: assetData.category_id,
        country_code: assetData.country_code,
        organization_name: assetData.organization_name,
        is_premium: assetData.is_premium,
        status: (assetData.status as 'draft' | 'published' | 'archived') || 'draft',
        keywords: assetData.tags,
        original_file_url: '', // Will be updated
        tag_ids: [], // Will be handled separately
      },
      adminId
    );

    asset_id = asset.id;

    // Handle tags
    if (assetData.tags && assetData.tags.length > 0) {
      await handleTags(asset.id, assetData.tags);
    }

    // Process each file
    for (const file of files) {
      try {
        const format = detectFormatFromFilename(file.originalname);
        if (!format) {
          errors.push(`Unsupported format: ${file.originalname}`);
          continue;
        }

        // Extract metadata from file
        const metadata = await extractFileMetadata(file.buffer, format, file.mimetype);

        // Create asset file
        const assetFile = await createAssetFile({
          asset_id: asset.id,
          format,
          variant: 'original',
          file_buffer: file.buffer,
          width: metadata.width,
          height: metadata.height,
          metadata: {
            original_filename: file.originalname,
            mime_type: file.mimetype,
            file_size: file.size,
            style: assetData.style,
            ...metadata,
          },
        });

        files_uploaded++;

        // Update asset with primary file URL if first file
        if (files_uploaded === 1) {
          await pool.query(
            'UPDATE assets SET original_file_url = $1, primary_format = $2 WHERE id = $3',
            [assetFile.file_url, format, asset.id]
          );
        }

        // Queue processing jobs
        await createProcessingJob({
          asset_id: asset.id,
          asset_file_id: assetFile.id,
          job_type: 'preview',
          priority: 1,
        });

        if (assetData.is_premium) {
          await createProcessingJob({
            asset_id: asset.id,
            asset_file_id: assetFile.id,
            job_type: 'watermark',
            priority: 2,
          });
        }

        files_processed++;
      } catch (error: any) {
        errors.push(`Failed to process ${file.originalname}: ${error.message}`);
      }
    }

    // Update asset format metadata
    const { updateAssetFormatMetadata } = await import('../assets/asset-file.service.js');
    await updateAssetFormatMetadata(asset_id);
  } catch (error: any) {
    errors.push(`Failed to create asset: ${error.message}`);
    throw error;
  }

  return {
    asset_id,
    files_uploaded,
    files_processed,
    errors,
  };
}

// Handle tags (create if not exists, associate with asset)
async function handleTags(assetId: string, tagNames: string[]): Promise<void> {
  for (const tagName of tagNames) {
    // Create tag if not exists
    const tagResult = await pool.query(
      `INSERT INTO tags (name, slug)
       VALUES ($1, $2)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [tagName, tagName.toLowerCase().replace(/\s+/g, '-')]
    );

    const tagId = tagResult.rows[0].id;

    // Associate with asset
    await pool.query(
      'INSERT INTO asset_tags (asset_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [assetId, tagId]
    );
  }
}

// Extract file metadata
async function extractFileMetadata(
  buffer: Buffer,
  format: string,
  mimetype: string
): Promise<Record<string, any>> {
  const metadata: Record<string, any> = {};

  try {
    if (mimetype.startsWith('image/')) {
      const sharp = (await import('sharp')).default;
      const image = sharp(buffer);
      const meta = await image.metadata();
      metadata.width = meta.width;
      metadata.height = meta.height;
      metadata.format = meta.format;
      metadata.has_alpha = meta.hasAlpha;
      metadata.space = meta.space;
    } else if (mimetype.startsWith('video/')) {
      // Video metadata extraction would require ffprobe
      // For now, return basic info
      metadata.type = 'video';
    }
  } catch (error) {
    console.error('Failed to extract metadata:', error);
  }

  return metadata;
}

// Get asset with all files
export async function getAssetWithFiles(assetId: string): Promise<any> {
  const { getAssetById } = await import('../assets/asset.service.js');
  const { getAssetFiles } = await import('../assets/asset-file.service.js');

  const asset = await getAssetById(assetId);
  if (!asset) return null;

  const files = await getAssetFiles(assetId);

  return {
    ...asset,
    files,
  };
}

// Update asset metadata
export async function updateAssetMetadata(
  assetId: string,
  updates: {
    title?: string;
    description?: string;
    category_id?: string;
    country_code?: string;
    organization_name?: string;
    is_premium?: boolean;
    status?: string;
    tags?: string[];
    style?: string;
  }
): Promise<Asset> {
  const { updateAsset } = await import('../assets/asset.service.js');

  // Handle tags separately
  if (updates.tags) {
    // Remove existing tags
    await pool.query('DELETE FROM asset_tags WHERE asset_id = $1', [assetId]);
    // Add new tags
    await handleTags(assetId, updates.tags);
  }

  // Update asset
  const asset = await updateAsset(assetId, {
    title: updates.title,
    description: updates.description,
    category_id: updates.category_id,
    country_code: updates.country_code,
    organization_name: updates.organization_name,
    is_premium: updates.is_premium,
    status: updates.status as 'draft' | 'published' | 'archived' | undefined,
    keywords: updates.tags,
  });

  // Update style in file metadata if provided
  if (updates.style) {
    await pool.query(
      `UPDATE asset_files 
       SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{style}', $1::jsonb)
       WHERE asset_id = $2`,
      [JSON.stringify(updates.style), assetId]
    );
  }

  return asset as Asset;
}

// Toggle asset status (enable/disable)
export async function toggleAssetStatus(assetId: string, enabled: boolean): Promise<void> {
  await pool.query(
    "UPDATE assets SET status = $1 WHERE id = $2",
    [enabled ? 'published' : 'draft', assetId]
  );
}

// Safe delete asset (soft delete to archived)
export async function safeDeleteAsset(assetId: string): Promise<void> {
  await pool.query(
    "UPDATE assets SET status = 'archived' WHERE id = $1",
    [assetId]
  );
}

// Get download statistics for asset
export async function getAssetDownloadStats(assetId: string): Promise<any> {
  const result = await pool.query(
    `SELECT 
       COUNT(*) as total_downloads,
       COUNT(DISTINCT user_id) as unique_users,
       COUNT(*) FILTER (WHERE download_type = 'premium') as premium_downloads,
       COUNT(*) FILTER (WHERE download_type = 'watermarked') as free_downloads,
       DATE_TRUNC('day', created_at) as date,
       COUNT(*) as daily_count
     FROM downloads
     WHERE asset_id = $1
     GROUP BY DATE_TRUNC('day', created_at)
     ORDER BY date DESC
     LIMIT 30`,
    [assetId]
  );

  return {
    total_downloads: result.rows.reduce((sum: number, row: any) => sum + parseInt(row.total_downloads), 0),
    unique_users: result.rows[0]?.unique_users || 0,
    premium_downloads: result.rows.reduce((sum: number, row: any) => sum + parseInt(row.premium_downloads || 0), 0),
    free_downloads: result.rows.reduce((sum: number, row: any) => sum + parseInt(row.free_downloads || 0), 0),
    daily_stats: result.rows.map((row: any) => ({
      date: row.date,
      count: parseInt(row.daily_count),
    })),
  };
}

// Get subscription overview
export async function getSubscriptionOverview(): Promise<any> {
  const result = await pool.query(
    `SELECT 
       sp.name as plan_name,
       sp.duration_days,
       sp.price_cents,
       COUNT(us.id) as total_subscriptions,
       COUNT(us.id) FILTER (WHERE us.status = 'active') as active_subscriptions,
       COUNT(us.id) FILTER (WHERE us.status = 'canceled') as canceled_subscriptions,
       SUM(sp.price_cents) FILTER (WHERE us.status = 'active') as monthly_revenue
     FROM subscription_plans sp
     LEFT JOIN user_subscriptions us ON sp.id = us.plan_id
     GROUP BY sp.id, sp.name, sp.duration_days, sp.price_cents
     ORDER BY sp.duration_days`
  );

  return result.rows;
}
