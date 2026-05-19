/**
 * Resolve `storage` package config from environment (local disk vs S3-compatible / Cloudflare R2).
 *
 * Railway / production R2 (recommended names):
 *   STORAGE_TYPE=s3
 *   CLOUDFLARE_R2_BUCKET_NAME, CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY,
 *   CLOUDFLARE_R2_ACCOUNT_ID / R2_ENDPOINT
 *   CLOUDFLARE_R2_PUBLIC_URL — public base URL
 *
 * Aliases: R2_*, AWS_*, CLOUDFLARE_ACCOUNT_ID.
 */

import type { StorageConfig } from 'storage';

export function resolveStorageProviderConfig(): StorageConfig {
  const useS3 = process.env.STORAGE_TYPE === 's3';

  if (!useS3) {
    return {
      type: 'local',
      baseUrl: process.env.STORAGE_BASE_URL || 'http://localhost:4000/uploads',
      basePath: process.env.STORAGE_BASE_PATH || './uploads',
    };
  }

  const bucket =
    process.env.CLOUDFLARE_R2_BUCKET_NAME?.trim() ||
    process.env.R2_BUCKET_NAME?.trim() ||
    process.env.AWS_S3_BUCKET?.trim() ||
    process.env.S3_BUCKET?.trim();

  const accessKeyId =
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.trim() ||
    process.env.R2_ACCESS_KEY_ID?.trim() ||
    process.env.AWS_ACCESS_KEY_ID?.trim();

  const secretAccessKey =
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.trim() ||
    process.env.R2_SECRET_ACCESS_KEY?.trim() ||
    process.env.AWS_SECRET_ACCESS_KEY?.trim();

  const accountId =
    process.env.CLOUDFLARE_R2_ACCOUNT_ID?.trim() || process.env.CLOUDFLARE_ACCOUNT_ID?.trim();

  const endpoint =
    process.env.CLOUDFLARE_R2_ENDPOINT?.trim()?.replace(/\/$/, '') ||
    process.env.R2_ENDPOINT?.trim()?.replace(/\/$/, '') ||
    (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);

  const region = process.env.AWS_REGION?.trim() || 'auto';

  const publicBase =
    process.env.CLOUDFLARE_R2_PUBLIC_URL?.trim()?.replace(/\/$/, '') ||
    process.env.R2_PUBLIC_URL?.trim()?.replace(/\/$/, '') ||
    process.env.STORAGE_BASE_URL?.trim()?.replace(/\/$/, '');

  if (!bucket || !accessKeyId || !secretAccessKey) {
    console.error(
      '[storage] STORAGE_TYPE=s3 requires bucket + credentials. Set R2_BUCKET_NAME (or AWS_S3_BUCKET), R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY (or AWS_* equivalents).'
    );
    throw new Error('S3/R2 storage configuration is incomplete');
  }

  if (!endpoint) {
    console.error(
      '[storage] STORAGE_TYPE=s3 requires R2_ENDPOINT or CLOUDFLARE_ACCOUNT_ID for Cloudflare R2.'
    );
    throw new Error('S3 endpoint not configured');
  }

  if (!publicBase) {
    console.warn(
      '[storage] R2_PUBLIC_URL or STORAGE_BASE_URL is unset — URLs stored in DB may be relative keys only. Set a public origin (custom domain) for browser access.'
    );
  }

  return {
    type: 's3',
    baseUrl: publicBase || '',
    basePath: process.env.STORAGE_BASE_PATH || './uploads',
    s3Bucket: bucket,
    s3Region: region,
    s3AccessKeyId: accessKeyId,
    s3SecretAccessKey: secretAccessKey,
    s3Endpoint: endpoint,
  };
}
