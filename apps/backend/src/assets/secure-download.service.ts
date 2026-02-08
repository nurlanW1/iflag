// Secure Download Service
// Generates secure download URLs with access control

import { CloudStorageService } from 'storage/cloud-storage';
import { AntiHotlinkService } from '../cdn/anti-hotlink.js';
import pool from '../db.js';

export interface DownloadRequest {
  assetId: string;
  formatId: string;
  userId?: string;
  userRole?: string;
  hasPremium?: boolean;
}

export interface DownloadResponse {
  url: string;
  type: 'free' | 'premium' | 'watermarked';
  expiresAt: number;
  filename: string;
}

export class SecureDownloadService {
  private storage: CloudStorageService;
  private antiHotlink: AntiHotlinkService;

  constructor(
    storage: CloudStorageService,
    antiHotlink: AntiHotlinkService
  ) {
    this.storage = storage;
    this.antiHotlink = antiHotlink;
  }

  /**
   * Generate secure download URL
   */
  async generateDownloadUrl(request: DownloadRequest): Promise<DownloadResponse> {
    // Get asset and format information
    const asset = await this.getAssetInfo(request.assetId, request.formatId);
    if (!asset) {
      throw new Error('Asset not found');
    }

    // Check access permissions
    const access = await this.checkAccess(request, asset);
    
    // Determine file path
    const filePath = this.getFilePath(asset, access.type);
    
    // Generate URL based on access type
    let url: string;
    let expiresIn: number;

    if (access.type === 'free') {
      // Free assets: Long-lived presigned URL (7 days)
      url = await this.storage.getPresignedUrl(filePath, {
        expiresIn: 7 * 24 * 60 * 60, // 7 days
        responseContentDisposition: `attachment; filename="${asset.filename}"`,
      });
      expiresIn = 7 * 24 * 60 * 60;
    } else if (access.type === 'premium' && request.hasPremium) {
      // Premium assets for subscribers: Short-lived presigned URL (15 minutes)
      url = await this.storage.getPresignedUrl(filePath, {
        expiresIn: 15 * 60, // 15 minutes
        responseContentDisposition: `attachment; filename="${asset.filename}"`,
      });
      expiresIn = 15 * 60;
    } else {
      // Watermarked preview: Medium-lived URL (1 hour)
      const watermarkedPath = this.getWatermarkedPath(asset);
      url = await this.storage.getPresignedUrl(watermarkedPath, {
        expiresIn: 60 * 60, // 1 hour
        responseContentDisposition: `attachment; filename="${asset.filename}_watermarked.${asset.formatCode}"`,
      });
      expiresIn = 60 * 60;
    }

    // Generate token for CDN validation (optional)
    if (this.storage.generateSecureCDNUrl) {
      const token = this.antiHotlink.generateToken({
        assetId: request.assetId,
        userId: request.userId,
        formatId: request.formatId,
        type: access.type,
        expiresIn,
      });

      // Use CDN URL with token instead of presigned S3 URL
      url = this.storage.generateSecureCDNUrl(filePath, token, Date.now() + expiresIn * 1000);
    }

    // Track download
    await this.trackDownload(request, asset, access.type);

    return {
      url,
      type: access.type,
      expiresAt: Date.now() + expiresIn * 1000,
      filename: asset.filename,
    };
  }

  /**
   * Get asset information from database
   */
  private async getAssetInfo(assetId: string, formatId: string): Promise<any> {
    const result = await pool.query(
      `SELECT 
         ma.id,
         ma.variant_id,
         ma.format_id,
         ma.file_path,
         ma.file_name,
         ma.file_size_bytes,
         mf.format_code,
         mf.format_category,
         fv.flag_id,
         p.price_cents,
         p.requires_subscription
       FROM media_assets ma
       JOIN media_formats mf ON ma.format_id = mf.id
       JOIN flag_variants fv ON ma.variant_id = fv.id
       LEFT JOIN prices p ON ma.id = p.asset_id AND p.format_id = mf.id
       WHERE ma.id = $1 AND mf.id = $2`,
      [assetId, formatId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  /**
   * Check user access to asset
   */
  private async checkAccess(
    request: DownloadRequest,
    asset: any
  ): Promise<{ type: 'free' | 'premium' | 'watermarked'; allowed: boolean }> {
    // Admin always has access
    if (request.userRole === 'admin') {
      return { type: 'premium', allowed: true };
    }

    // Check if asset is free
    const isFree = !asset.requires_subscription && 
                   (!asset.price_cents || asset.price_cents === 0);

    if (isFree) {
      return { type: 'free', allowed: true };
    }

    // Check premium access
    if (asset.requires_subscription) {
      if (request.hasPremium) {
        return { type: 'premium', allowed: true };
      } else {
        return { type: 'watermarked', allowed: true };
      }
    }

    // Paid asset (not subscription-based)
    // User would need to purchase individually
    // For now, return watermarked
    return { type: 'watermarked', allowed: true };
  }

  /**
   * Get file path for asset
   */
  private getFilePath(asset: any, type: 'free' | 'premium' | 'watermarked'): string {
    if (type === 'watermarked') {
      return this.getWatermarkedPath(asset);
    }

    // Use original file path
    return asset.file_path || this.constructPath(asset);
  }

  /**
   * Get watermarked file path
   */
  private getWatermarkedPath(asset: any): string {
    const originalPath = asset.file_path || this.constructPath(asset);
    // Replace /original/ with /watermarked/ and add _watermarked suffix
    return originalPath
      .replace('/original/', '/watermarked/')
      .replace(/\.([^.]+)$/, '_watermarked.$1');
  }

  /**
   * Construct file path from asset data
   */
  private constructPath(asset: any): string {
    return this.storage.generateAssetPath(
      asset.flag_id,
      asset.variant_id,
      asset.id,
      asset.format_category,
      asset.format_code,
      'original'
    );
  }

  /**
   * Track download in database
   */
  private async trackDownload(
    request: DownloadRequest,
    asset: any,
    type: 'free' | 'premium' | 'watermarked'
  ): Promise<void> {
    await pool.query(
      `INSERT INTO downloads (
         user_id, asset_id, format_id, download_type,
         file_size_bytes, created_at
       )
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
      [
        request.userId || null,
        request.assetId,
        request.formatId,
        type,
        asset.file_size_bytes || 0,
      ]
    );
  }
}
