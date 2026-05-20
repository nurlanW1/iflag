import { NextRequest, NextResponse } from 'next/server';
import { isSafePublicFlagObjectPath } from '@/lib/server/blob-site-proxy';

/** Public Vercel Blob base, e.g. `https://eh5zrrhsujfuhgmf.public.blob.vercel-storage.com` (no trailing slash). */
function blobBase(): string | null {
  const b = process.env.BLOB_PUBLIC_BASE_URL?.trim();
  return b ? b.replace(/\/+$/, '') : null;
}


function r2PublicBase(): string | null {
  const b =
    process.env.CLOUDFLARE_R2_PUBLIC_URL?.trim() ||
    process.env.R2_PUBLIC_URL?.trim();
  return b ? b.replace(/\/+$/, '') : null;
}

/**
 * Stable URL for `/api/asset?path=flags/…` — prefers Cloudflare R2 public hostname when configured,
 * else redirects to legacy Vercel Blob `BLOB_PUBLIC_BASE_URL`.
 */
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('path');
  const path =
    typeof raw === 'string' ? decodeURIComponent(raw.replace(/^\//, '').replace(/\/{2,}/g, '/')) : '';
  if (!path || !isSafePublicFlagObjectPath(path)) {
    return new NextResponse('Invalid path', { status: 400 });
  }

  const r2base = r2PublicBase();
  if (r2base) {
    const target = `${r2base}/${path.replace(/^\/+/, '')}`;
    return NextResponse.redirect(target, {
      status: 307,
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    });
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
