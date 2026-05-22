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

function sanitizeContentDispositionBasename(raw: string): string {
  const trimmed = raw.trim().slice(0, 180);
  if (!trimmed) return 'download.bin';
  return trimmed.replace(/["\\]/g, '_').replace(/[^\w\-._()+ ]+/g, '_').replace(/^\.+/, '') || 'download.bin';
}

export type SignedR2GetUrlOptions = {
  /** Prefer `attachment; filename="..."` so browsers save the file instead of navigating away. */
  downloadFilename?: string;
};

/** Time-limited GET — call only after entitlement checks. */
export async function getSignedR2GetUrl(
  key: string,
  expiresInSeconds = 300,
  opts?: SignedR2GetUrlOptions | null,
): Promise<string | null> {
  const cfg = loadR2ConfigFromEnv();
  if (!cfg) return null;
  const objectKey = key.replace(/^\/+/, '');
  const client = getClient(cfg);
  const disposition =
    opts?.downloadFilename?.trim() && opts.downloadFilename.trim().length > 0
      ? `attachment; filename="${sanitizeContentDispositionBasename(opts.downloadFilename)}"`
      : undefined;

  const cmd = new GetObjectCommand({
    Bucket: cfg.bucketName,
    Key: objectKey,
    ...(disposition ? { ResponseContentDisposition: disposition } : {}),
  });
  try {
    return await getSignedUrl(client, cmd, { expiresIn: expiresInSeconds });
  } catch (e) {
    console.error('[cloudflare-r2] getSignedUrl failed', e);
    return null;
  }
}

/**
 * Public CDN base for `flags/…` keys — only env, no signing credentials.
 * Deployment often sets `CLOUDFLARE_R2_PUBLIC_URL` without R2 API keys; thumbnails must still resolve.
 */
export function getPublicR2PublicBaseUrl(): string | null {
  const pub =
    process.env.CLOUDFLARE_R2_PUBLIC_URL?.trim() ||
    process.env.R2_PUBLIC_URL?.trim() ||
    '';
  return pub ? pub.replace(/\/+$/, '') : null;
}

/** `publicBase + '/' + normalizedKey` — works when only public R2 URL is configured. */
export function getPublicR2FileUrl(fileKey: string): string | null {
  const base = getPublicR2PublicBaseUrl();
  if (!base) return null;
  const k = fileKey.replace(/^\/+/, '');
  return `${base}/${k}`;
}
