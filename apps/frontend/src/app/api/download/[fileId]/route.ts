import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { isClerkConfigured } from '@/lib/auth/clerk-env';
import { sanitizeCallbackUrl } from '@/lib/auth/callback-url';
import { getAccessTokenFromCookies } from '@/lib/auth/session.server';
import { getDb } from '@/lib/server/db';
import { userHasFlagswingPaidDownloadAccess } from '@/lib/server/flagswing-download-access';
import { resolveGalleryAssetUrl } from '@/lib/server/blob-site-proxy';
import {
  getPublicR2FileUrl,
  getSignedR2GetUrl,
  loadR2ConfigFromEnv,
} from '@/lib/server/cloudflare-r2';

export const runtime = 'nodejs';

function isBrowserDocumentNavigation(request: Request): boolean {
  if (request.headers.get('sec-fetch-mode') === 'navigate') return true;
  const accept = request.headers.get('accept') ?? '';
  return accept.includes('text/html');
}

function redirectLocation(req: Request, href: string): string {
  const h = href.trim();
  if (h.startsWith('/')) return new URL(h, new URL(req.url).origin).toString();
  return h;
}

type FileRow = {
  file_url: string | null;
  file_key: string | null;
  storage_provider: string | null;
  premium_tier: string | null;
  status: string | null;
  format: string | null;
  file_name: string | null;
  country_slug: string | null;
  variant_name: string | null;
};

/** Safe single-segment-ish filename inside Content-Disposition. */
function suggestDownloadBasename(row: FileRow): string {
  const explicit = row.file_name?.trim();
  const fmtRaw = row.format?.trim().toLowerCase().replace(/[^a-z0-9]/g, '') || '';
  const fmt = fmtRaw || 'bin';
  const baseFromDb =
    explicit &&
    explicit.replace(/["\\]/g, '_').replace(/[^\w\-._()+ ]+/g, '_').replace(/^\.+/, '').trim();
  if (baseFromDb) return baseFromDb.slice(0, 160);

  const slug = row.country_slug?.trim().replace(/[^\w-]+/g, '-').replace(/^-|-$/g, '') || 'flag';
  const variant =
    row.variant_name?.trim().replace(/[^\w-]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || '';

  const core = variant ? `${slug}-${variant}.${fmt}` : `${slug}.${fmt}`;
  return core.replace(/["\\]/g, '_').slice(0, 160);
}

/**
 * Protected download for `country_flag_files`.
 *
 * - Legacy Blob `file_url`: rewritten to **`CLOUDFLARE_R2_PUBLIC_URL`** when the same `flags/…` key exists on R2.
 * - Rows with **`file_key`**: use R2 public or short-lived signed GET when SDK credentials exist (even if `storage_provider` is stale).
 * - Requires an active Paddle-backed entitlement: Neon `user_subscriptions`, backend `check-premium`
 *   (JWT cookie), or optional owner bypass emails (`MARKETPLACE_OWNER_DOWNLOAD_EMAILS` — default single owner).
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ fileId: string }> }
) {
  if (!isClerkConfigured()) {
    return NextResponse.json(
      { error: 'Clerk is not configured', code: 'CLERK_NOT_CONFIGURED' },
      { status: 501 }
    );
  }

  const { fileId } = await context.params;
  const id = fileId?.trim();
  if (!id) {
    return NextResponse.json({ error: 'Missing file id', code: 'BAD_REQUEST' }, { status: 400 });
  }

  const uuidOk =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (!uuidOk) {
    return NextResponse.json({ error: 'File not found', code: 'NOT_FOUND' }, { status: 404 });
  }

  let pool;
  try {
    pool = getDb();
  } catch {
    return NextResponse.json({ error: 'Database unavailable', code: 'DB_ERROR' }, { status: 503 });
  }

  const fileRes = await pool.query<FileRow>(
    `SELECT file_url, file_key, storage_provider, premium_tier, status,
            format, file_name, country_slug, variant_name
     FROM country_flag_files
     WHERE id = $1::uuid
     LIMIT 1`,
    [id]
  );

  const row = fileRes.rows[0];
  if (!row || (row.status && row.status.toLowerCase() !== 'published')) {
    return NextResponse.json({ error: 'File not found', code: 'NOT_FOUND' }, { status: 404 });
  }

  const fileUrl = row.file_url?.trim();
  if (!fileUrl && !row.file_key?.trim()) {
    return NextResponse.json({ error: 'File not found', code: 'NOT_FOUND' }, { status: 404 });
  }

  const user = await currentUser();
  const accessToken = await getAccessTokenFromCookies();

  async function redirectForHref(href: string): Promise<Response> {
    return NextResponse.redirect(redirectLocation(request, href), 302);
  }

  /** Prefer attachment-presigned GET when signer is configured so browsers save instead of leaving the SPA. */
  async function resolveDownloadHref(): Promise<string | null> {
    const fk = row.file_key?.trim();
    const attachmentName = suggestDownloadBasename(row);

    if (fk && loadR2ConfigFromEnv()) {
      const signed = await getSignedR2GetUrl(fk, 600, { downloadFilename: attachmentName });
      if (signed) return signed;
      console.warn('[download] attachment-signed URL unavailable — falling back to public/blob URL');
    }

    if (fk) {
      const pub = getPublicR2FileUrl(fk);
      if (pub) return pub;
    }

    const legacy = fileUrl ? resolveGalleryAssetUrl(fileUrl) : null;
    return legacy ?? null;
  }

  const allowed = await userHasFlagswingPaidDownloadAccess(pool, user, accessToken);

  if (!allowed) {
    const returnPath = sanitizeCallbackUrl(
      new URL(request.url).pathname + new URL(request.url).search,
      '/browse',
    );
    if (!user?.id) {
      if (isBrowserDocumentNavigation(request)) {
        const login = new URL('/sign-in', request.url);
        login.searchParams.set('redirect_url', returnPath);
        return NextResponse.redirect(login, 302);
      }
      return NextResponse.json({ error: 'Not signed in', code: 'NOT_AUTHENTICATED' }, { status: 401 });
    }

    if (isBrowserDocumentNavigation(request)) {
      const pricing = new URL('/pricing', request.url);
      pricing.searchParams.set('callbackUrl', returnPath);
      return NextResponse.redirect(pricing, 302);
    }
    return NextResponse.json(
      { error: 'Subscription required', code: 'SUBSCRIPTION_REQUIRED' },
      { status: 403 },
    );
  }

  const href = await resolveDownloadHref();
  if (!href) {
    return NextResponse.json({ error: 'File location unavailable', code: 'MISSING_URL' }, { status: 503 });
  }
  return redirectForHref(href);
}
