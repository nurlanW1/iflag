// Cloud Storage Service - S3 with CDN integration

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';
import { createHash } from 'crypto';

export interface CloudStorageConfig {
  bucketName: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  cdnDomain?: string;
  cloudfrontDistributionId?: string;
  cloudfrontAccessKeyId?: string;
  cloudfrontSecretAccessKey?: string;
}

export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  cacheControl?: string;
  acl?: 'private' | 'public-read';
}

export interface DownloadOptions {
  expiresIn?: number; // seconds
  responseContentDisposition?: string;
  responseContentType?: string;
}

export class CloudStorageService {
  private s3Client: S3Client;
  private cloudfrontClient?: CloudFrontClient;
  private bucketName: string;
  private cdnDomain?: string;
  private distributionId?: string;

  constructor(config: CloudStorageConfig) {
    this.bucketName = config.bucketName;
    this.cdnDomain = config.cdnDomain;
    this.distributionId = config.cloudfrontDistributionId;

    this.s3Client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });

    if (config.cloudfrontDistributionId && config.cloudfrontAccessKeyId) {
      this.cloudfrontClient = new CloudFrontClient({
        region: config.region,
        credentials: {
          accessKeyId: config.cloudfrontAccessKeyId,
          secretAccessKey: config.cloudfrontSecretAccessKey || config.secretAccessKey,
        },
      });
    }
  }

  /**
   * Generate storage path for asset
   */
  generateAssetPath(
    flagId: string,
    variantId: string,
    assetId: string,
    formatCategory: 'vector' | 'raster' | 'video',
    formatCode: string,
    type: 'original' | 'preview' | 'watermarked' | 'hls' = 'original',
    resolution?: string
  ): string {
    const categoryFolder = formatCategory === 'vector' ? 'vectors' : 
                          formatCategory === 'raster' ? 'rasters' : 'videos';
    
    let filename = `${assetId}`;
    if (resolution) {
      filename += `_${resolution}`;
    }
    if (type === 'preview') {
      filename += '_preview';
    } else if (type === 'watermarked') {
      filename += '_watermarked';
    }
    filename += `.${formatCode}`;

    return `${categoryFolder}/${flagId}/${variantId}/${type}/${filename}`;
  }

  /**
   * Upload file to S3
   */
  async uploadFile(
    fileBuffer: Buffer,
    key: string,
    options: UploadOptions = {}
  ): Promise<string> {
    const {
      contentType = 'application/octet-stream',
      metadata = {},
      cacheControl = 'public, max-age=31536000, immutable',
      acl = 'private',
    } = options;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
      Metadata: metadata,
      CacheControl: cacheControl,
      // ACL is deprecated, use bucket policies instead
    });

    await this.s3Client.send(command);

    // Return CDN URL if configured, otherwise S3 URL
    if (this.cdnDomain) {
      return `https://${this.cdnDomain}/${key}`;
    }

    return `https://${this.bucketName}.s3.${this.s3Client.config.region}.amazonaws.com/${key}`;
  }

  /**
   * Generate presigned download URL
   */
  async getPresignedUrl(
    key: string,
    options: DownloadOptions = {}
  ): Promise<string> {
    const {
      expiresIn = 3600, // 1 hour default
      responseContentDisposition,
      responseContentType,
    } = options;

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ResponseContentDisposition: responseContentDisposition,
      ResponseContentType: responseContentType,
    });

    const url = await getSignedUrl(this.s3Client, command, {
      expiresIn,
    });

    return url;
  }

  /**
   * Generate secure CDN URL with token
   */
  generateSecureCDNUrl(
    key: string,
    token: string,
    expiresAt?: number
  ): string {
    if (!this.cdnDomain) {
      throw new Error('CDN domain not configured');
    }

    const url = new URL(`https://${this.cdnDomain}/${key}`);
    url.searchParams.set('token', token);
    if (expiresAt) {
      url.searchParams.set('expires', expiresAt.toString());
    }

    return url.toString();
  }

  /**
   * Check if file exists
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      await this.s3Client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(key: string): Promise<{
    size: number;
    contentType: string;
    lastModified: Date;
    etag: string;
  }> {
    const command = new HeadObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    const response = await this.s3Client.send(command);

    return {
      size: response.ContentLength || 0,
      contentType: response.ContentType || 'application/octet-stream',
      lastModified: response.LastModified || new Date(),
      etag: response.ETag || '',
    };
  }

  /**
   * Delete file from S3
   */
  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  /**
   * Invalidate CDN cache
   */
  async invalidateCache(paths: string[]): Promise<string | null> {
    if (!this.cloudfrontClient || !this.distributionId) {
      console.warn('CloudFront not configured, skipping cache invalidation');
      return null;
    }

    // Limit to 3000 paths per invalidation
    const batchSize = 3000;
    const batches: string[][] = [];

    for (let i = 0; i < paths.length; i += batchSize) {
      batches.push(paths.slice(i, i + batchSize));
    }

    const invalidationIds: string[] = [];

    for (const batch of batches) {
      const command = new CreateInvalidationCommand({
        DistributionId: this.distributionId,
        InvalidationBatch: {
          Paths: {
            Quantity: batch.length,
            Items: batch,
          },
          CallerReference: `invalidation-${Date.now()}-${createHash('md5').update(batch.join('')).digest('hex').substring(0, 8)}`,
        },
      });

      const response = await this.cloudfrontClient.send(command);
      if (response.Invalidation?.Id) {
        invalidationIds.push(response.Invalidation.Id);
      }
    }

    return invalidationIds[0] || null;
  }

  /**
   * Invalidate cache for asset
   */
  async invalidateAssetCache(
    flagId: string,
    variantId?: string,
    assetId?: string
  ): Promise<void> {
    const paths: string[] = [];

    if (assetId && variantId) {
      // Invalidate specific asset
      paths.push(`/vectors/${flagId}/${variantId}/*`);
      paths.push(`/rasters/${flagId}/${variantId}/*`);
      paths.push(`/videos/${flagId}/${variantId}/*`);
    } else if (variantId) {
      // Invalidate all assets in variant
      paths.push(`/vectors/${flagId}/${variantId}/*`);
      paths.push(`/rasters/${flagId}/${variantId}/*`);
      paths.push(`/videos/${flagId}/${variantId}/*`);
    } else {
      // Invalidate all assets for flag
      paths.push(`/vectors/${flagId}/*`);
      paths.push(`/rasters/${flagId}/*`);
      paths.push(`/videos/${flagId}/*`);
    }

    await this.invalidateCache(paths);
  }

  /**
   * Generate cache-friendly URL with version
   */
  generateVersionedUrl(key: string, version: string | number): string {
    const url = new URL(`https://${this.cdnDomain || this.bucketName}/${key}`);
    url.searchParams.set('v', version.toString());
    return url.toString();
  }
}
