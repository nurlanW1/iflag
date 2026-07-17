import { NextRequest, NextResponse } from 'next/server';
import { getPublicR2FileUrl } from '@/lib/server/cloudflare-r2';

const CLUB_PREFIX = 'football-clubs/';
const LOGO_EXTENSIONS = new Set(['png', 'webp', 'jpg', 'jpeg', 'svg']);

function isSafeClubLogoPath(path: string): boolean {
  if (!path.startsWith(CLUB_PREFIX)) return false;
  if (path.includes('..') || path.includes('\\') || path.includes('//')) return false;
  const fileName = path.split('/').pop() ?? '';
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  return Boolean(fileName) && LOGO_EXTENSIONS.has(ext);
}

function contentTypeForPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  if (ext === 'svg') return 'image/svg+xml';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  return 'image/png';
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('path') ?? '';
  const path = decodeURIComponent(raw).replace(/^\/+/, '').replace(/\/{2,}/g, '/');

  if (!isSafeClubLogoPath(path)) {
    return new NextResponse('Invalid club logo path', { status: 400 });
  }

  const publicUrl = getPublicR2FileUrl(path);
  if (!publicUrl) {
    return NextResponse.json({ error: 'R2 public URL is not configured' }, { status: 503 });
  }

  const upstream = await fetch(publicUrl, { cache: 'no-store' });
  if (!upstream.ok || !upstream.body) {
    return new NextResponse('Club logo not found', { status: upstream.status || 404 });
  }

  const fileName = path.split('/').pop() || 'football-club-logo.png';
  return new NextResponse(upstream.body, {
    headers: {
      'Content-Type': upstream.headers.get('content-type') || contentTypeForPath(path),
      'Content-Disposition': `attachment; filename="${fileName.replace(/"/g, '')}"`,
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
