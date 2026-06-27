/**
 * POST /api/admin/organize-r2
 *
 * Lists all R2 objects that are NOT under the `flags/` prefix, infers
 * a country slug from each filename, and moves the object to
 * `flags/{countrySlug}/{originalFilename}`.
 *
 * After this runs, call POST /api/admin/import-r2 to register the newly
 * structured files in the Neon DB.
 */

import { NextResponse } from 'next/server';
import {
  S3Client,
  ListObjectsV2Command,
  CopyObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { requireClerkAdminBearerJson } from '@/lib/server/require-clerk-admin-bearer';
import { loadR2ConfigFromEnv } from '@/lib/server/cloudflare-r2';

export const runtime = 'nodejs';
export const maxDuration = 300;

const ALLOWED_EXTS = new Set([
  'png', 'svg', 'jpg', 'jpeg', 'webp', 'eps', 'pdf', 'ai', 'psd',
  'mp4', 'webm', 'mov',
]);

const STOP_WORDS = new Set([
  'flag', 'flags', 'vector', 'sphere', 'wave', 'waves', 'waving',
  'circle', 'heart', 'image', 'images', 'flagpole', 'flagpoles', 'national',
  'of', 'the', 'a', 'an', 'and', 'or', 'for', 'as', 'on', 'graphic',
  'graphics', 'round', 'glossy', 'map', 'converted', 'country', 'icon',
  'icons', 'illustration', 'background', 'design', 'template', 'high',
  'resolution', 'quality', 'hd', 'free', 'download', 'clip', 'art',
]);

function slugify(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function deriveCountrySlug(key: string): string | null {
  const filename = key.split('/').pop() ?? key;
  const dotIdx = filename.lastIndexOf('.');
  const stem = dotIdx !== -1 ? filename.slice(0, dotIdx) : filename;

  const tokens = stem
    .replace(/[_\-]+/g, ' ')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !STOP_WORDS.has(t));

  if (!tokens.length) return null;
  const slug = slugify(tokens.join('-'));
  return slug.length >= 2 ? slug : null;
}

export async function POST(request: Request): Promise<Response> {
  const gate = await requireClerkAdminBearerJson(request);
  if (!gate.ok) return gate.response;

  const cfg = loadR2ConfigFromEnv();
  if (!cfg) {
    return NextResponse.json({ error: 'R2 not configured' }, { status: 503 });
  }

  const client = new S3Client({
    region: 'auto',
    endpoint: cfg.endpoint,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
    forcePathStyle: true,
  });

  // Collect all objects NOT already in flags/
  const candidates: { key: string; targetKey: string }[] = [];
  const unresolved: string[] = [];
  let token: string | undefined;

  do {
    const res = await client.send(
      new ListObjectsV2Command({
        Bucket: cfg.bucketName,
        ContinuationToken: token,
        MaxKeys: 1000,
      })
    );

    for (const obj of res.Contents ?? []) {
      const key = obj.Key;
      if (!key || key.endsWith('/') || key.startsWith('flags/')) continue;

      const filename = key.split('/').pop() ?? key;
      const dotIdx = filename.lastIndexOf('.');
      const ext = dotIdx !== -1 ? filename.slice(dotIdx + 1).toLowerCase() : '';

      if (!ALLOWED_EXTS.has(ext)) {
        unresolved.push(`skip (ext): ${key}`);
        continue;
      }

      const slug = deriveCountrySlug(key);
      if (!slug) {
        unresolved.push(`skip (no slug): ${key}`);
        continue;
      }

      candidates.push({ key, targetKey: `flags/${slug}/${filename}` });
    }

    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);

  // Move each file: copy → delete
  let moved = 0;
  const errors: string[] = [];
  const movedList: { from: string; to: string }[] = [];

  for (const { key, targetKey } of candidates) {
    try {
      await client.send(
        new CopyObjectCommand({
          Bucket: cfg.bucketName,
          CopySource: `${cfg.bucketName}/${key}`,
          Key: targetKey,
        })
      );
      await client.send(
        new DeleteObjectCommand({
          Bucket: cfg.bucketName,
          Key: key,
        })
      );
      moved++;
      movedList.push({ from: key, to: targetKey });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`${key} → ${targetKey}: ${msg}`);
    }
  }

  return NextResponse.json({
    ok: true,
    moved,
    unresolved: unresolved.length,
    errors,
    files: movedList,
  });
}
