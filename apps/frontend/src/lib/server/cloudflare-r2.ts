/**
 * Server-only Cloudflare R2 helpers for Next.js (signed GET URLs).
 * Mirrors backend `storage/r2.ts` env names — never import from client components.
 */

import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export type FrontendR2Config = {
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrlBase: string;
  endpoint: string;
};

function ensureHttpsUrl(raw: string): string {
  const trimmed = raw.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function isCloudflareR2ApiEndpoint(url: string): boolean {
  try {
    const host = new URL(ensureHttpsUrl(url)).hostname.toLowerCase();
    return host.endsWith('.r2.cloudflarestorage.com');
  } catch {
    return /\.r2\.cloudflarestorage\.com(?:\/|$)/i.test(url);
  }
}

function normalizeR2Endpoint(rawEndpoint: string | undefined, accountId: string): string {
  const fallback = `https://${accountId}.r2.cloudflarestorage.com`;
  const raw = rawEndpoint?.trim();
  if (!raw || !isCloudflareR2ApiEndpoint(raw)) return fallback;

  try {
    const parsed = new URL(ensureHttpsUrl(raw));
    parsed.pathname = '';
    parsed.search = '';
    parsed.hash = '';
    return parsed.toString().replace(/\/+$/, '');
  } catch {
    return fallback;
  }
}

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
    process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL?.trim() ||
    ''
  ).replace(/\/+$/, '');

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrlBase) {
    return null;
  }

  const endpoint = normalizeR2Endpoint(
    process.env.CLOUDFLARE_R2_ENDPOINT?.trim() || process.env.R2_ENDPOINT?.trim(),
    accountId
  );

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

export type R2ListEntry = {
  key: string;
  size: number;
  lastModified: Date | undefined;
};

/**
 * Lists objects in R2 under a given prefix. Returns up to `maxKeys` entries.
 */
export async function listR2Objects(prefix: string, maxKeys = 1000): Promise<R2ListEntry[]> {
  const cfg = loadR2ConfigFromEnv();
  if (!cfg) return [];
  const client = getClient(cfg);
  const results: R2ListEntry[] = [];
  let token: string | undefined;
  do {
    const cmd = new ListObjectsV2Command({
      Bucket: cfg.bucketName,
      Prefix: prefix.replace(/^\/+/, ''),
      MaxKeys: Math.min(maxKeys - results.length, 1000),
      ContinuationToken: token,
    });
    try {
      const res = await client.send(cmd);
      for (const obj of res.Contents ?? []) {
        if (obj.Key) results.push({ key: obj.Key, size: obj.Size ?? 0, lastModified: obj.LastModified });
      }
      token = res.IsTruncated ? res.NextContinuationToken : undefined;
    } catch (e) {
      console.error('[cloudflare-r2] listR2Objects failed', e);
      break;
    }
  } while (token && results.length < maxKeys);
  return results;
}

/**
 * Public CDN base for `flags/…` keys — only env, no signing credentials.
 * Deployment often sets `CLOUDFLARE_R2_PUBLIC_URL` without R2 API keys; thumbnails must still resolve.
 */
export function getPublicR2PublicBaseUrl(): string | null {
  const pub =
    process.env.CLOUDFLARE_R2_PUBLIC_URL?.trim() ||
    process.env.R2_PUBLIC_URL?.trim() ||
    process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL?.trim() ||
    '';
  return pub ? pub.replace(/\/+$/, '') : null;
}

/** `publicBase + '/' + encoded key path — works when only public R2 URL is configured. */
export function getPublicR2FileUrl(fileKey: string): string | null {
  const base = getPublicR2PublicBaseUrl();
  if (!base) return null;
  const k = fileKey.replace(/^\/+/, '');
  const path = k
    .split('/')
    .filter(Boolean)
    .map((seg) => encodeURIComponent(seg))
    .join('/');
  return path ? `${base}/${path}` : null;
}
