// Asset File Management Service
// Handles multiple file variants per asset

import pool from '../db.js';
import { AssetFormat, generateAssetFilename, FORMAT_METADATA } from 'asset-types';
import { createStorageProvider, getAssetFolder, generateUniqueFilename } from 'storage';

export interface AssetFileData {
  id: string;
  asset_id: string;
  format: AssetFormat;
  variant: string;
  size?: string;
  quality?: number;
  color_mode?: 'rgb' | 'cmyk' | 'grayscale';
  transparency?: 'transparent' | 'opaque' | 'mixed';
  file_path: string;
  file_url: string;
  file_size_bytes: number;
  width?: number;
  height?: number;
  dpi?: number;
  duration_seconds?: number;
  bitrate_kbps?: number;
  codec?: string;
  has_audio?: boolean;
  metadata?: Record<string, any>;
}

export interface CreateAssetFileParams {
  asset_id: string;
  format: AssetFormat;
  variant: string;
  size?: string;
  quality?: number;
  file_buffer: Buffer;
  width?: number;
  height?: number;
  metadata?: Record<string, any>;
}

// Create asset file record and upload file
export async function createAssetFile(params: CreateAssetFileParams): Promise<AssetFileData> {
  const { asset_id, format, variant, size, quality, file_buffer, width, height, metadata } = params;
  
  // Generate filename
  const filename = generateAssetFilename(
    `asset-${asset_id}`,
    format,
    variant,
    size,
    quality
  );
  
  // Get storage provider
  const storage = createStorageProvider({
    type: process.env.STORAGE_TYPE === 's3' ? 's3' : 'local',
    baseUrl: process.env.STORAGE_BASE_URL || 'http://localhost:4000/uploads',
    basePath: process.env.STORAGE_BASE_PATH || './uploads',
  });
  
  // Determine folder based on format
  const formatFolder = FORMAT_METADATA[format].is_video ? 'videos' : 
                       FORMAT_METADATA[format].is_vector ? 'vectors' : 'rasters';
  const folder = `assets/${formatFolder}/${asset_id}/${variant}`;
  
  // Upload file
  const file_url = await storage.upload(file_buffer, filename, folder);
  
  // Create database record
  const result = await pool.query(
    `INSERT INTO asset_files (
       asset_id, format, variant, size, quality,
       file_path, file_url, file_size_bytes,
       width, height, metadata
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      asset_id,
      format,
      variant,
      size || null,
      quality || null,
      `${folder}/${filename}`,
      file_url,
      file_buffer.length,
      width || null,
      height || null,
      metadata ? JSON.stringify(metadata) : null,
    ]
  );
  
  return result.rows[0];
}

// Get all files for an asset
export async function getAssetFiles(asset_id: string): Promise<AssetFileData[]> {
  const result = await pool.query(
    'SELECT * FROM asset_files WHERE asset_id = $1 ORDER BY created_at',
    [asset_id]
  );
  return result.rows;
}

// Get specific file variant
export async function getAssetFile(
  asset_id: string,
  format: AssetFormat,
  variant: string,
  size?: string,
  quality?: number
): Promise<AssetFileData | null> {
  const conditions = ['asset_id = $1', 'format = $2', 'variant = $3'];
  const params: any[] = [asset_id, format, variant];
  let paramCount = 3;
  
  if (size) {
    paramCount++;
    conditions.push(`size = $${paramCount}`);
    params.push(size);
  }
  
  if (quality) {
    paramCount++;
    conditions.push(`quality = $${paramCount}`);
    params.push(quality);
  }
  
  const result = await pool.query(
    `SELECT * FROM asset_files WHERE ${conditions.join(' AND ')} LIMIT 1`,
    params
  );
  
  return result.rows[0] || null;
}

// Get best file for download (premium vs free)
export async function getBestFileForDownload(
  asset_id: string,
  format: AssetFormat,
  has_premium: boolean
): Promise<AssetFileData | null> {
  if (has_premium) {
    // Get original or best quality
    const original = await getAssetFile(asset_id, format, 'original');
    if (original) return original;
    
    // Fallback to highest quality variant
    const result = await pool.query(
      `SELECT * FROM asset_files 
       WHERE asset_id = $1 AND format = $2 
       ORDER BY 
         CASE variant WHEN 'original' THEN 1 WHEN 'optimized' THEN 2 ELSE 3 END,
         quality DESC NULLS LAST
       LIMIT 1`,
      [asset_id, format]
    );
    return result.rows[0] || null;
  } else {
    // Get watermarked preview
    const watermarked = await getAssetFile(asset_id, format, 'watermarked', '800x533');
    if (watermarked) return watermarked;
    
    // Fallback to low-res preview
    return await getAssetFile(asset_id, format, 'preview', '800x533');
  }
}

// Delete asset file
export async function deleteAssetFile(file_id: string): Promise<boolean> {
  const result = await pool.query(
    'DELETE FROM asset_files WHERE id = $1 RETURNING id',
    [file_id]
  );
  return result.rows.length > 0;
}

// Update asset format metadata
export async function updateAssetFormatMetadata(asset_id: string): Promise<void> {
  // Get all files for asset
  const files = await getAssetFiles(asset_id);
  
  if (files.length === 0) return;
  
  // Determine primary format (original file format)
  const originalFile = files.find(f => f.variant === 'original');
  const primaryFormat = originalFile?.format || files[0].format;
  
  // Collect available formats
  const availableFormats = [...new Set(files.map(f => f.format))];
  
  // Determine color mode and transparency
  const colorMode = originalFile?.color_mode || null;
  const transparency = originalFile?.transparency || null;
  
  // Check for variants
  const hasTransparent = files.some(f => f.transparency === 'transparent');
  const hasOpaque = files.some(f => f.transparency === 'opaque');
  
  // Collect resolutions
  const resolutions = [...new Set(files.map(f => f.size).filter(Boolean))];
  
  // Collect qualities
  const qualities = [...new Set(files.map(f => f.quality).filter(Boolean))];
  
  // Calculate aspect ratio
  let aspectRatio = null;
  if (originalFile?.width && originalFile?.height) {
    aspectRatio = originalFile.width / originalFile.height;
  }
  
  // Update asset
  await pool.query(
    `UPDATE assets SET
       primary_format = $1,
       available_formats = $2,
       color_mode = $3,
       transparency = $4,
       has_transparent_version = $5,
       has_opaque_version = $6,
       available_resolutions = $7,
       available_qualities = $8,
       aspect_ratio = $9,
       updated_at = CURRENT_TIMESTAMP
     WHERE id = $10`,
    [
      primaryFormat,
      availableFormats,
      colorMode,
      transparency,
      hasTransparent,
      hasOpaque,
      resolutions,
      qualities,
      aspectRatio,
      asset_id,
    ]
  );
}
