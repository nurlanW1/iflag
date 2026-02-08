// Cache Invalidation Service
// Manages CDN cache invalidation for assets

import { CloudStorageService } from 'storage/cloud-storage';

export interface InvalidationRule {
  pattern: string;
  priority: number;
  autoInvalidate: boolean;
}

export class CacheInvalidationService {
  private storage: CloudStorageService;
  private invalidationRules: InvalidationRule[];

  constructor(storage: CloudStorageService) {
    this.storage = storage;
    this.invalidationRules = [
      {
        pattern: 'asset_update',
        priority: 1,
        autoInvalidate: true,
      },
      {
        pattern: 'variant_update',
        priority: 2,
        autoInvalidate: true,
      },
      {
        pattern: 'flag_update',
        priority: 3,
        autoInvalidate: true,
      },
    ];
  }

  /**
   * Invalidate cache for asset update
   */
  async invalidateAsset(
    flagId: string,
    variantId: string,
    assetId: string,
    formatCategory: 'vector' | 'raster' | 'video'
  ): Promise<void> {
    const paths = this.generateAssetPaths(flagId, variantId, assetId, formatCategory);
    await this.storage.invalidateCache(paths);
  }

  /**
   * Invalidate cache for variant update
   */
  async invalidateVariant(
    flagId: string,
    variantId: string
  ): Promise<void> {
    const paths = [
      `/vectors/${flagId}/${variantId}/*`,
      `/rasters/${flagId}/${variantId}/*`,
      `/videos/${flagId}/${variantId}/*`,
    ];
    await this.storage.invalidateCache(paths);
  }

  /**
   * Invalidate cache for flag update
   */
  async invalidateFlag(flagId: string): Promise<void> {
    const paths = [
      `/vectors/${flagId}/*`,
      `/rasters/${flagId}/*`,
      `/videos/${flagId}/*`,
    ];
    await this.storage.invalidateCache(paths);
  }

  /**
   * Invalidate cache for category update
   */
  async invalidateCategory(categoryId: string, flagIds: string[]): Promise<void> {
    const paths: string[] = [];
    
    for (const flagId of flagIds) {
      paths.push(`/vectors/${flagId}/*`);
      paths.push(`/rasters/${flagId}/*`);
      paths.push(`/videos/${flagId}/*`);
    }

    // Batch invalidations (max 3000 per batch)
    const batchSize = 3000;
    for (let i = 0; i < paths.length; i += batchSize) {
      const batch = paths.slice(i, i + batchSize);
      await this.storage.invalidateCache(batch);
    }
  }

  /**
   * Invalidate all previews
   */
  async invalidatePreviews(flagId?: string): Promise<void> {
    const paths: string[] = [];
    
    if (flagId) {
      paths.push(`/vectors/${flagId}/*/preview/*`);
      paths.push(`/rasters/${flagId}/*/preview/*`);
      paths.push(`/videos/${flagId}/*/preview/*`);
    } else {
      paths.push('*/preview/*');
    }

    await this.storage.invalidateCache(paths);
  }

  /**
   * Invalidate all watermarked assets
   */
  async invalidateWatermarked(flagId?: string): Promise<void> {
    const paths: string[] = [];
    
    if (flagId) {
      paths.push(`/vectors/${flagId}/*/watermarked/*`);
      paths.push(`/rasters/${flagId}/*/watermarked/*`);
      paths.push(`/videos/${flagId}/*/watermarked/*`);
    } else {
      paths.push('*/watermarked/*');
    }

    await this.storage.invalidateCache(paths);
  }

  /**
   * Schedule invalidation (for batch operations)
   */
  async scheduleInvalidation(
    paths: string[],
    delay: number = 0
  ): Promise<void> {
    if (delay > 0) {
      setTimeout(() => {
        this.storage.invalidateCache(paths);
      }, delay);
    } else {
      await this.storage.invalidateCache(paths);
    }
  }

  /**
   * Generate asset paths for invalidation
   */
  private generateAssetPaths(
    flagId: string,
    variantId: string,
    assetId: string,
    formatCategory: 'vector' | 'raster' | 'video'
  ): string[] {
    const categoryFolder = formatCategory === 'vector' ? 'vectors' : 
                          formatCategory === 'raster' ? 'rasters' : 'videos';
    
    return [
      `/${categoryFolder}/${flagId}/${variantId}/original/*${assetId}*`,
      `/${categoryFolder}/${flagId}/${variantId}/preview/*${assetId}*`,
      `/${categoryFolder}/${flagId}/${variantId}/watermarked/*${assetId}*`,
    ];
  }

  /**
   * Get invalidation cost estimate
   */
  estimateCost(pathCount: number): number {
    // AWS CloudFront: First 1000 paths/month free, then $0.005 per path
    const freePaths = 1000;
    const costPerPath = 0.005;
    
    if (pathCount <= freePaths) {
      return 0;
    }
    
    return (pathCount - freePaths) * costPerPath;
  }
}
