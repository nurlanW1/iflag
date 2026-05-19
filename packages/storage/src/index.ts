// Storage service abstraction
// Supports local filesystem and S3-compatible storage (AWS S3, Cloudflare R2, etc.)

import { writeFile, mkdir, unlink } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';

export interface StorageProvider {
  upload(file: Buffer, filename: string, folder?: string): Promise<string>;
  getUrl(filename: string, folder?: string): string;
  delete(filename: string, folder?: string): Promise<void>;
  exists(filename: string, folder?: string): Promise<boolean>;
}

export interface StorageConfig {
  type: 'local' | 's3';
  baseUrl?: string;
  basePath?: string;
  s3Bucket?: string;
  s3Region?: string;
  s3AccessKeyId?: string;
  s3SecretAccessKey?: string;
  /** R2 / MinIO — e.g. https://<account_id>.r2.cloudflarestorage.com */
  s3Endpoint?: string;
}

/**
 * Local filesystem storage provider
 */
export class LocalStorageProvider implements StorageProvider {
  private basePath: string;
  private baseUrl: string;

  constructor(config: StorageConfig) {
    this.basePath = config.basePath || './uploads';
    this.baseUrl = config.baseUrl || '/uploads';
  }

  async upload(file: Buffer, filename: string, folder: string = ''): Promise<string> {
    const fullPath = join(this.basePath, folder, filename);
    const dir = dirname(fullPath);

    // Ensure directory exists
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    await writeFile(fullPath, file);
    return this.getUrl(filename, folder);
  }

  getUrl(filename: string, folder: string = ''): string {
    const path = folder ? `${folder}/${filename}` : filename;
    return `${this.baseUrl}/${path}`;
  }

  async delete(filename: string, folder: string = ''): Promise<void> {
    const fullPath = join(this.basePath, folder, filename);
    try {
      await unlink(fullPath);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async exists(filename: string, folder: string = ''): Promise<boolean> {
    const fullPath = join(this.basePath, folder, filename);
    return existsSync(fullPath);
  }
}

/**
 * S3-compatible storage (AWS S3, Cloudflare R2, etc.)
 */
export class S3StorageProvider implements StorageProvider {
  private client: S3Client;
  private bucket: string;
  /** Public URL prefix for stored objects (no trailing slash), e.g. R2 custom domain */
  private publicBaseUrl: string;

  constructor(config: StorageConfig) {
    if (!config.s3Bucket || !config.s3AccessKeyId || !config.s3SecretAccessKey) {
      throw new Error('S3 configuration is incomplete (bucket + credentials required)');
    }

    this.bucket = config.s3Bucket;
    this.publicBaseUrl = (config.baseUrl || '').replace(/\/$/, '');

    const region = config.s3Region || 'auto';
    const clientOpts: ConstructorParameters<typeof S3Client>[0] = {
      region,
      credentials: {
        accessKeyId: config.s3AccessKeyId,
        secretAccessKey: config.s3SecretAccessKey,
      },
    };
    const ep = config.s3Endpoint?.trim();
    if (ep) {
      clientOpts.endpoint = ep.replace(/\/$/, '');
      clientOpts.forcePathStyle = true;
    }
    this.client = new S3Client(clientOpts);
  }

  private objectKey(filename: string, folder: string = ''): string {
    const f = folder.replace(/^\/+|\/+$/g, '');
    return f ? `${f}/${filename}` : filename;
  }

  async upload(file: Buffer, filename: string, folder: string = ''): Promise<string> {
    const key = this.objectKey(filename, folder);
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file,
        })
      );
    } catch (error) {
      console.error('[storage] S3 upload failed', {
        bucket: this.bucket,
        key,
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
    return this.getUrl(filename, folder);
  }

  getUrl(filename: string, folder: string = ''): string {
    const key = this.objectKey(filename, folder);
    if (this.publicBaseUrl) {
      return `${this.publicBaseUrl}/${key}`;
    }
    return key;
  }

  async delete(filename: string, folder: string = ''): Promise<void> {
    const key = this.objectKey(filename, folder);
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );
    } catch (error) {
      console.error('[storage] S3 delete failed', {
        bucket: this.bucket,
        key,
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async exists(filename: string, folder: string = ''): Promise<boolean> {
    const key = this.objectKey(filename, folder);
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );
      return true;
    } catch (error: unknown) {
      const name =
        typeof error === 'object' && error !== null && 'name' in error
          ? String((error as { name?: string }).name)
          : '';
      const status =
        typeof error === 'object' && error !== null && '$metadata' in error
          ? (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode
          : undefined;
      if (name === 'NotFound' || status === 404) {
        return false;
      }
      throw error;
    }
  }
}

/**
 * Create storage provider based on configuration
 */
export function createStorageProvider(config: StorageConfig): StorageProvider {
  if (config.type === 's3') {
    return new S3StorageProvider(config);
  }
  return new LocalStorageProvider(config);
}

/**
 * Generate unique filename with timestamp and random string
 */
export function generateUniqueFilename(originalFilename: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const ext = originalFilename.split('.').pop() || 'bin';
  const nameWithoutExt = originalFilename.replace(/\.[^/.]+$/, '');
  const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  return `${sanitizedName}-${timestamp}-${random}.${ext}`;
}

/**
 * Get file folder based on asset type
 */
export function getAssetFolder(assetType: string): string {
  const folders: Record<string, string> = {
    flag: 'flags',
    symbol: 'symbols',
    video: 'videos',
    animated: 'animated',
    coat_of_arms: 'coat-of-arms',
    emblem: 'emblems',
  };
  return folders[assetType] || 'assets';
}
