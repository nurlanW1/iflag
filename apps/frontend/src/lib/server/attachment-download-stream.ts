import { NextResponse } from 'next/server';

/** Sanitize filename for Content-Disposition attachment headers. */
export function sanitizeAttachmentFilename(raw: string): string {
  const trimmed = raw.trim().slice(0, 180);
  if (!trimmed) return 'download.bin';
  return trimmed.replace(/["\\]/g, '_').replace(/[^\w\-._()+ ]+/g, '_').replace(/^\.+/, '') || 'download.bin';
}

function absoluteUrl(request: Request, href: string): string {
  const h = href.trim();
  if (h.startsWith('/')) return new URL(h, new URL(request.url).origin).toString();
  return h;
}

/** JS `fetch()` from the storefront — stream bytes with attachment instead of a CDN redirect. */
export function requestWantsAttachmentStream(request: Request): boolean {
  const mode = request.headers.get('sec-fetch-mode');
  if (mode === 'cors') return true;
  const accept = request.headers.get('accept') ?? '';
  return accept.includes('*/*') && !accept.includes('text/html');
}

/**
 * Proxy storage URL through our API with `Content-Disposition: attachment` so PNG/SVG/JPG
 * save reliably (hidden iframes only “download” non-renderable types like EPS).
 */
export async function streamAttachmentFromUrl(
  request: Request,
  sourceHref: string,
  downloadFilename: string,
): Promise<Response> {
  const absolute = absoluteUrl(request, sourceHref);
  let upstream: Response;
  try {
    upstream = await fetch(absolute, { redirect: 'follow' });
  } catch (error) {
    console.error('[download] upstream fetch failed', error);
    return NextResponse.json({ error: 'Upstream unavailable', code: 'UPSTREAM_ERROR' }, { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json(
      { error: 'File unavailable upstream', code: 'UPSTREAM_NOT_FOUND' },
      { status: upstream.status === 404 ? 404 : 502 },
    );
  }

  const safeName = sanitizeAttachmentFilename(downloadFilename);
  const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream';

  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${safeName}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
