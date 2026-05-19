import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { isClerkConfigured } from '@/lib/auth/clerk-env';
import { serverClerkUserMatchesAdmin } from '@/lib/auth/admin-email';
import { getDb } from '@/lib/server/db';
import { hasActiveClerkSubscription } from '@/lib/server/clerk-active-plan';
import { freeTierRequiresSignIn } from '@/lib/server/flagswing-download-policy';
import { resolveGalleryAssetUrl } from '@/lib/server/blob-site-proxy';
import { getPublicR2FileUrl, getSignedR2GetUrl } from '@/lib/server/cloudflare-r2';

export const runtime = 'nodejs';

function redirectLocation(req: Request, href: string): string {
  const h = href.trim();
  if (h.startsWith('/')) return new URL(h, new URL(req.url).origin).toString();
  return h;
}

type PremiumTier = 'free' | 'freemium' | 'paid';

function normalizeTier(raw: string | null | undefined): PremiumTier {
  const t = (raw ?? 'free').toLowerCase();
  if (t === 'freemium' || t === 'paid' || t === 'free') return t;
  return 'free';
}

type FileRow = {
  file_url: string | null;
  file_key: string | null;
  storage_provider: string | null;
  premium_tier: string | null;
  status: string | null;
};

/**
 * Protected download for `country_flag_files`.
 *
 * - Legacy `vercel_blob`: gated redirect; URLs may still be shareable (migrate to private R2).
 * - `r2` + `file_key`: premium/freemium/admin/subscriber get **short-lived signed URLs** when AWS credentials exist.
 * - Free tier: public URL (or legacy blob proxy) after optional sign-in policy.
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
    `SELECT file_url, file_key, storage_provider, premium_tier, status
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
  const tier = normalizeTier(row.premium_tier);
  const isAdmin = serverClerkUserMatchesAdmin(user);
  const provider = (row.storage_provider || '').toLowerCase();
  const isR2 = provider === 'r2' && !!row.file_key?.trim();

  async function redirectForHref(href: string): Promise<Response> {
    return NextResponse.redirect(redirectLocation(request, href), 302);
  }

  /** Final browser URL for bytes (public or signed). */
  async function resolveHref(opts: { forceSigned: boolean }): Promise<string | null> {
    const key = row.file_key?.trim();
    if (isR2 && key) {
      if (opts.forceSigned) {
        const signed = await getSignedR2GetUrl(key, 600);
        if (signed) return signed;
        console.warn('[download] signed URL unavailable; falling back to public URL if configured');
      }
      const pub = getPublicR2FileUrl(key);
      if (pub) return pub;
    }
    if (fileUrl) return resolveGalleryAssetUrl(fileUrl);
    return null;
  }

  if (isAdmin) {
    const href = await resolveHref({ forceSigned: true });
    if (!href) {
      return NextResponse.json({ error: 'File location unavailable', code: 'MISSING_URL' }, { status: 503 });
    }
    return redirectForHref(href);
  }

  if (tier === 'free') {
    if (freeTierRequiresSignIn() && !user?.id) {
      return NextResponse.json({ error: 'Not signed in', code: 'NOT_AUTHENTICATED' }, { status: 401 });
    }
    const href = await resolveHref({ forceSigned: false });
    if (!href) {
      return NextResponse.json({ error: 'File location unavailable', code: 'MISSING_URL' }, { status: 503 });
    }
    return redirectForHref(href);
  }

  if (!user?.id) {
    return NextResponse.json({ error: 'Not signed in', code: 'NOT_AUTHENTICATED' }, { status: 401 });
  }

  let active = false;
  try {
    active = await hasActiveClerkSubscription(pool, user.id);
  } catch (subErr) {
    console.error('[download] subscription lookup failed:', subErr);
    active = false;
  }
  if (!active) {
    return NextResponse.json(
      { error: 'Subscription required', code: 'SUBSCRIPTION_REQUIRED' },
      { status: 403 }
    );
  }

  const href = await resolveHref({ forceSigned: true });
  if (!href) {
    return NextResponse.json({ error: 'File location unavailable', code: 'MISSING_URL' }, { status: 503 });
  }
  return redirectForHref(href);
}
