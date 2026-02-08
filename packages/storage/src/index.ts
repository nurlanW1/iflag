// Storage service abstraction
// Supports local filesystem and S3-compatible storage

import { writeFile, mkdir, readFile, unlink } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';

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
 * S3-compatible storage provider
 */
export class S3StorageProvider implements StorageProvider {
  private bucket: string;
  private region: string;
  private accessKeyId: string;
  private secretAccessKey: string;
  private baseUrl: string;

  constructor(config: StorageConfig) {
    if (!config.s3Bucket || !config.s3Region || !config.s3AccessKeyId || !config.s3SecretAccessKey) {
      throw new Error('S3 configuration is incomplete');
    }

    this.bucket = config.s3Bucket;
    this.region = config.s3Region;
    this.accessKeyId = config.s3AccessKeyId;
    this.secretAccessKey = config.s3SecretAccessKey;
    this.baseUrl = config.baseUrl || `https://${this.bucket}.s3.${this.region}.amazonaws.com`;
  }

  async upload(file: Buffer, filename: string, folder: string = ''): Promise<string> {
    // In production, use AWS SDK v3
    // For now, this is a placeholder that would need AWS SDK implementation
    const key = folder ? `${folder}/${filename}` : filename;
    
    // TODO: Implement actual S3 upload using @aws-sdk/client-s3
    // const s3Client = new S3Client({ region: this.region, credentials: {...} });
    // await s3Client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: file }));
    
    console.warn('S3 upload not fully implemented. Use AWS SDK in production.');
    return this.getUrl(filename, folder);
  }

  getUrl(filename: string, folder: string = ''): string {
    const key = folder ? `${folder}/${filename}` : filename;
    return `${this.baseUrl}/${key}`;
  }

  async delete(filename: string, folder: string = ''): Promise<void> {
    // TODO: Implement S3 delete
    console.warn('S3 delete not fully implemented. Use AWS SDK in production.');
  }

  async exists(filename: string, folder: string = ''): Promise<boolean> {
    // TODO: Implement S3 exists check
    console.warn('S3 exists check not fully implemented. Use AWS SDK in production.');
    return false;
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
