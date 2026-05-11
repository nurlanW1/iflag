import { NextRequest, NextResponse } from 'next/server';
import { FLAGS_STORAGE_PATH_RE } from '@/lib/server/blob-site-proxy';

/** Public Vercel Blob base, e.g. `https://eh5zrrhsujfuhgmf.public.blob.vercel-storage.com` (no trailing slash). */
function blobBase(): string | null {
  const b = process.env.BLOB_PUBLIC_BASE_URL?.trim();
  return b ? b.replace(/\/+$/, '') : null;
}

function isSafeBlobPath(path: string): boolean {
  if (!FLAGS_STORAGE_PATH_RE.test(path)) return false;
  return !path.includes('..');
}

/**
 * Same-origin façade for Blob files: keeps assets on Vercel Blob but exposes your domain to users.
 *
 * Requires `BLOB_PUBLIC_BASE_URL` (same hostname you see in Blob URLs — without path).
 */
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('path');
  const path =
    typeof raw === 'string' ? decodeURIComponent(raw.replace(/^\//, '').replace(/\/{2,}/g, '/')) : '';
  if (!path || !isSafeBlobPath(path)) {
    return new NextResponse('Invalid path', { status: 400 });
  }

  const base = blobBase();
  if (!base) {
    return NextResponse.json(
      { error: 'BLOB_PUBLIC_BASE_URL is not configured' },
      { status: 503 },
    );
  }

  const target = `${base}/${path}`;
  return NextResponse.redirect(target, {
    status: 307,
    headers: {
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
