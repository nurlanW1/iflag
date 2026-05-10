import { NextResponse } from 'next/server';
import { getSessionUserFromCookies } from '@/lib/auth/session.server';
import { sanitizeCallbackUrl } from '@/lib/auth/callback-url';
import { resolveAuthenticatedFileDownload } from '@/lib/account/entitlements.server';
import { getProductById } from '@/services/marketplace/product-service';
import { requestProSignedDownloadUrl } from '@/lib/storage/signed-download';

export const runtime = 'nodejs';

type RouteParams = { params: Promise<{ productId: string; fileId: string }> };

/** Top-level browser navigations (e.g. user clicked a download link) — prefer UX redirects over raw JSON. */
function isBrowserDocumentNavigation(request: Request): boolean {
  if (request.headers.get('sec-fetch-mode') === 'navigate') return true;
  const accept = request.headers.get('accept') ?? '';
  return accept.includes('text/html');
}

/**
 * Server-authoritative download entrypoint.
 * - preview_free + publicUrl + entitled user → 302 to CDN/public asset
 * - preview_free + anonymous / not entitled → 401 / 403 (HTML navigations → login / pricing)
 * - pro + entitled → presigned URL when R2 signing is configured; otherwise 503
 * - pro + not entitled → 403
 */
export async function GET(request: Request, { params }: RouteParams) {
  const { productId, fileId } = await params;
  const user = await getSessionUserFromCookies();
  const userId = user?.id ?? null;

  const resolution = resolveAuthenticatedFileDownload(userId, user?.email, productId, fileId);

  if (resolution.kind === 'public_preview') {
    return NextResponse.redirect(resolution.publicUrl);
  }

  if (resolution.kind === 'denied') {
    const returnPath = sanitizeCallbackUrl(new URL(request.url).pathname + new URL(request.url).search, '/browse');
    if (resolution.reason === 'NOT_AUTHENTICATED' && isBrowserDocumentNavigation(request)) {
      const login = new URL('/login', request.url);
      login.searchParams.set('callbackUrl', returnPath);
      return NextResponse.redirect(login);
    }
    if (resolution.reason === 'NOT_ENTITLED' && isBrowserDocumentNavigation(request)) {
      const pricing = new URL('/pricing', request.url);
      pricing.searchParams.set('callbackUrl', returnPath);
      return NextResponse.redirect(pricing);
    }
    const status =
      resolution.reason === 'NOT_AUTHENTICATED'
        ? 401
        : resolution.reason === 'NOT_ENTITLED'
          ? 403
          : resolution.reason === 'NOT_PUBLISHED'
            ? 404
            : 404;
    return NextResponse.json({ error: resolution.reason }, { status });
  }

  const product = getProductById(productId);
  const file = product?.files.find((f) => f.id === fileId);
  if (!file || file.tier !== 'pro') {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }

  const signed = requestProSignedDownloadUrl({
    storageKey: file.storageKey,
    fileName: file.fileName,
    mimeType: file.mimeType,
  });

  if (signed.kind === 'NOT_CONFIGURED') {
    return NextResponse.json(
      {
        error: 'DOWNLOAD_SIGNING_NOT_CONFIGURED',
        detail: signed.detail,
        entitlement: resolution.via,
      },
      { status: 503 }
    );
  }

  return NextResponse.redirect(signed.url);
}
