import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { isClerkConfigured } from '@/lib/auth/clerk-env';
import { serverClerkUserMatchesAdmin } from '@/lib/auth/admin-email';
import { getDb } from '@/lib/server/db';
import { hasActiveClerkSubscription } from '@/lib/server/clerk-active-plan';
import { freeTierRequiresSignIn } from '@/lib/server/flagswing-download-policy';
import { siteProxiedBlobUrl } from '@/lib/server/blob-site-proxy';

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

/**
 * App-level protected download for `country_flag_files`.
 *
 * TODO(flagswing-security): Premium bytes are still served from public Blob URLs after this gate.
 * Anyone with a leaked `file_url` can bypass this route. Migrate paid masters to **private** Blob
 * (or R2) and return **short-lived signed GET URLs** here instead of `NextResponse.redirect(publicUrl)`.
 */
export async function GET(
  _request: Request,
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

  const fileRes = await pool.query<{
    file_url: string | null;
    premium_tier: string | null;
    status: string | null;
  }>(
    `SELECT file_url, premium_tier, status
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
  if (!fileUrl) {
    return NextResponse.json({ error: 'File not found', code: 'NOT_FOUND' }, { status: 404 });
  }

  const user = await currentUser();
  const tier = normalizeTier(row.premium_tier);
  const isAdmin = serverClerkUserMatchesAdmin(user);

  if (isAdmin) {
    return NextResponse.redirect(redirectLocation(_request, siteProxiedBlobUrl(fileUrl)), 302);
  }

  if (tier === 'free') {
    if (freeTierRequiresSignIn() && !user?.id) {
      return NextResponse.json({ error: 'Not signed in', code: 'NOT_AUTHENTICATED' }, { status: 401 });
    }
    return NextResponse.redirect(redirectLocation(_request, siteProxiedBlobUrl(fileUrl)), 302);
  }

  // freemium | paid
  if (!user?.id) {
    return NextResponse.json({ error: 'Not signed in', code: 'NOT_AUTHENTICATED' }, { status: 401 });
  }

  let active = false;
  try {
    active = await hasActiveClerkSubscription(pool, user.id);
  } catch (subErr) {
    console.error('[download] subscription lookup failed (run neon_002 migration?):', subErr);
    active = false;
  }
  if (!active) {
    return NextResponse.json(
      { error: 'Subscription required', code: 'SUBSCRIPTION_REQUIRED' },
      { status: 403 }
    );
  }

  return NextResponse.redirect(redirectLocation(_request, siteProxiedBlobUrl(fileUrl)), 302);
}
