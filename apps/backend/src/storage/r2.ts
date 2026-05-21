/**
 * Cloudflare R2 (S3-compatible) — shared by admin flag upload and legacy routes.
 *
 * Env (preferred):
 *   CLOUDFLARE_R2_ACCOUNT_ID
 *   CLOUDFLARE_R2_ACCESS_KEY_ID
 *   CLOUDFLARE_R2_SECRET_ACCESS_KEY
 *   CLOUDFLARE_R2_BUCKET_NAME
 *   CLOUDFLARE_R2_PUBLIC_URL   (no trailing slash — public hostname for browser URLs)
 *
 * Aliases fall back to older names used elsewhere in the monorepo:
 *   CLOUDFLARE_ACCOUNT_ID, R2_*, AWS_*
 *
 * Security note: premium masters should live in a **private** bucket; use
 * `getSignedDownloadUrl` for time-limited GETs. Public bucket URLs are OK for
 * free previews only — gate access in `/api/download` before issuing URLs.
 */

import { createHash } from 'crypto';
import { basename, extname } from 'path';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  /** HTTPS origin for public objects, no trailing slash */
  publicUrlBase: string;
  endpoint: string;
};

let cachedClient: S3Client | null = null;
let cachedFor: string | null = null;

export function loadR2ConfigFromEnv(): R2Config | null {
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
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    publicUrlBase,
    endpoint,
  };
}

export function requireR2Config(): R2Config {
  const c = loadR2ConfigFromEnv();
  if (!c) {
    throw new Error(
      'R2 not configured: set CLOUDFLARE_R2_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY, CLOUDFLARE_R2_BUCKET_NAME, CLOUDFLARE_R2_PUBLIC_URL'
    );
  }
  return c;
}

function getS3Client(cfg: R2Config): S3Client {
  const key = `${cfg.endpoint}|${cfg.accessKeyId}|${cfg.bucketName}`;
  if (cachedClient && cachedFor === key) return cachedClient;
  cachedClient = new S3Client({
    region: 'auto',
    endpoint: cfg.endpoint,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
    forcePathStyle: true,
  });
  cachedFor = key;
  return cachedClient;
}

/** URL-safe path segment */
export function slugifySegment(raw: string, maxLen = 96): string {
  const s = raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  if (!s) return 'file';
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

/**
 * flags/{countrySlug}/{variantSlug}/{timestamp}-{safeOriginalName}.{ext}
 */
export function buildFlagObjectKey(
  countrySlug: string,
  variantTitle: string,
  originalFilename: string
): string {
  const ext = (extname(originalFilename).replace(/^\./, '') || 'bin').toLowerCase();
  const base = basename(originalFilename, extname(originalFilename)) || 'upload';
  const safeFile = slugifySegment(base, 120);
  const ts = Date.now();
  const vSlug = slugifySegment(variantTitle, 80);
  const cSlug = slugifySegment(countrySlug, 80);
  return `flags/${cSlug}/${vSlug}/${ts}-${safeFile}.${ext}`;
}

export function getPublicR2Url(cfg: R2Config, key: string): string {
  const k = key.replace(/^\/+/, '');
  return `${cfg.publicUrlBase}/${k}`;
}

export async function uploadFileToR2(
  buffer: Buffer,
  key: string,
  contentType: string,
  cfg: R2Config = requireR2Config()
): Promise<{ key: string; publicUrl: string }> {
  const client = getS3Client(cfg);
  const objectKey = key.replace(/^\/+/, '');
  try {
    await client.send(
      new PutObjectCommand({
        Bucket: cfg.bucketName,
        Key: objectKey,
        Body: buffer,
        ContentType: contentType || 'application/octet-stream',
      })
    );
  } catch (e) {
    console.error('[r2] PutObject failed', { bucket: cfg.bucketName, key: objectKey, err: e });
    throw e;
  }
  return { key: objectKey, publicUrl: getPublicR2Url(cfg, objectKey) };
}

/** Short-lived signed GET URL — use after entitlement checks (premium / admin). */
export async function getSignedDownloadUrl(
  key: string,
  expiresInSeconds = 300,
  cfg: R2Config = requireR2Config()
): Promise<string> {
  const client = getS3Client(cfg);
  const objectKey = key.replace(/^\/+/, '');
  const cmd = new GetObjectCommand({
    Bucket: cfg.bucketName,
    Key: objectKey,
  });
  return getSignedUrl(client, cmd, { expiresIn: expiresInSeconds });
}

export type R2ObjectSummary = { key: string; size: number; lastModified?: Date };

/**
 * List object keys (paginated). Stops after `maxObjects` entries when set.
 * Skips empty keys and trailing-slash “folder” placeholders.
 */
export async function listR2ObjectSummaries(
  cfg: R2Config,
  options?: { prefix?: string; maxObjects?: number }
): Promise<R2ObjectSummary[]> {
  const client = getS3Client(cfg);
  const out: R2ObjectSummary[] = [];
  const max = options?.maxObjects;
  const prefix = options?.prefix?.replace(/^\//, '').trim() || '';
  let token: string | undefined;

  do {
    const remaining =
      max !== undefined && Number.isFinite(max) ? Math.max(0, max - out.length) : 1000;
    const pageSize = max !== undefined && Number.isFinite(max) ? Math.min(1000, Math.max(1, remaining)) : 1000;

    const resp = await client.send(
      new ListObjectsV2Command({
        Bucket: cfg.bucketName,
        Prefix: prefix || undefined,
        ContinuationToken: token,
        MaxKeys: pageSize,
      })
    );

    for (const o of resp.Contents ?? []) {
      const key = o.Key?.trim();
      if (!key || key.endsWith('/')) continue;
      out.push({
        key,
        size: Number(o.Size ?? 0),
        lastModified: o.LastModified,
      });
      if (max !== undefined && out.length >= max) return out;
    }

    token = resp.IsTruncated ? resp.NextContinuationToken : undefined;
  } while (token && (max === undefined || out.length < max));

  return out;
}

export async function deleteFileFromR2(key: string, cfg: R2Config = requireR2Config()): Promise<void> {
  const client = getS3Client(cfg);
  const objectKey = key.replace(/^\/+/, '');
  await client.send(
    new DeleteObjectCommand({
      Bucket: cfg.bucketName,
      Key: objectKey,
    })
  );
}

export function sha256Hex(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}
