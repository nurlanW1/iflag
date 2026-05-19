/**
 * Server-only Cloudflare R2 helpers for Next.js (signed GET URLs).
 * Mirrors backend `storage/r2.ts` env names — never import from client components.
 */

import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export type FrontendR2Config = {
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrlBase: string;
  endpoint: string;
};

export function loadR2ConfigFromEnv(): FrontendR2Config | null {
  const accountId =
    process.env.CLOUDFLARE_R2_ACCOUNT_ID?.trim() ||
    process.env.CLOUDFLARE_ACCOUNT_ID?.trim() ||
    process.env.R2_ACCOUNT_ID?.trim();

  const accessKeyId =
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.trim() ||
    process.env.R2_ACCESS_KEY_ID?.trim() ||
    process.env.AWS_ACCESS_KEY_ID?.trim();

  const secretAccessKey =
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.trim() ||
    process.env.R2_SECRET_ACCESS_KEY?.trim() ||
    process.env.AWS_SECRET_ACCESS_KEY?.trim();

  const bucketName =
    process.env.CLOUDFLARE_R2_BUCKET_NAME?.trim() ||
    process.env.R2_BUCKET_NAME?.trim() ||
    process.env.AWS_S3_BUCKET?.trim();

  const publicUrlBase = (
    process.env.CLOUDFLARE_R2_PUBLIC_URL?.trim() ||
    process.env.R2_PUBLIC_URL?.trim() ||
    ''
  ).replace(/\/+$/, '');

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrlBase) {
    return null;
  }

  const endpoint = (
    process.env.CLOUDFLARE_R2_ENDPOINT?.trim() ||
    process.env.R2_ENDPOINT?.trim() ||
    `https://${accountId}.r2.cloudflarestorage.com`
  ).replace(/\/+$/, '');

  return {
    accessKeyId,
    secretAccessKey,
    bucketName,
    publicUrlBase,
    endpoint,
  };
}

let cached: { key: string; client: S3Client } | null = null;

function getClient(cfg: FrontendR2Config): S3Client {
  const key = `${cfg.endpoint}|${cfg.accessKeyId}|${cfg.bucketName}`;
  if (cached?.key === key) return cached.client;
  const client = new S3Client({
    region: 'auto',
    endpoint: cfg.endpoint,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
    forcePathStyle: true,
  });
  cached = { key, client };
  return client;
}

/** Time-limited GET — call only after entitlement checks. */
export async function getSignedR2GetUrl(key: string, expiresInSeconds = 300): Promise<string | null> {
  const cfg = loadR2ConfigFromEnv();
  if (!cfg) return null;
  const objectKey = key.replace(/^\/+/, '');
  const client = getClient(cfg);
  const cmd = new GetObjectCommand({
    Bucket: cfg.bucketName,
    Key: objectKey,
  });
  try {
    return await getSignedUrl(client, cmd, { expiresIn: expiresInSeconds });
  } catch (e) {
    console.error('[cloudflare-r2] getSignedUrl failed', e);
    return null;
  }
}

export function getPublicR2FileUrl(fileKey: string): string | null {
  const cfg = loadR2ConfigFromEnv();
  if (!cfg) return null;
  const k = fileKey.replace(/^\/+/, '');
  return `${cfg.publicUrlBase}/${k}`;
}
