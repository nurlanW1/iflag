import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { backendUnreachableResponse, fetchBackendApi } from '@/lib/auth/backend-fetch.server';
import { logBackendApiHostOnce, resolveBackendApiBase } from '@/lib/auth/backend-url';
import { applyAuthSessionCookies } from '@/lib/auth/session-cookies.server';
import { isClerkConfigured } from '@/lib/auth/clerk-env';

export const runtime = 'nodejs';

/**
 * Links Clerk account → backend JWT cookies for Paddle/billing API routes.
 * Requires INTERNAL_AUTH_BRIDGE_SECRET on frontend + backend (same value).
 */
export async function POST() {
  if (!isClerkConfigured()) {
    return NextResponse.json({ ok: false, error: 'Clerk not configured' }, { status: 503 });
  }

  const apiBase = resolveBackendApiBase();
  if (!apiBase.ok) {
    return NextResponse.json(
      { ok: false, error: apiBase.error, code: apiBase.code },
      { status: 503 },
    );
  }

  logBackendApiHostOnce(apiBase.baseUrl, 'auth/clerk-sync');

  const bridgeSecret = process.env.INTERNAL_AUTH_BRIDGE_SECRET?.trim();
  if (!bridgeSecret) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'INTERNAL_AUTH_BRIDGE_SECRET is missing on this server. Set the same value on Vercel and the API server to link dashboard purchases.',
        code: 'BRIDGE_SECRET_MISSING',
      },
      { status: 503 },
    );
  }

  const clerkUser = await currentUser();
  if (!clerkUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const addr = clerkUser.primaryEmailAddress ?? clerkUser.emailAddresses?.[0];
  const email = addr?.emailAddress?.trim();
  if (!email) {
    return NextResponse.json({ error: 'No email on Clerk account' }, { status: 400 });
  }

  const verified = addr?.verification?.status === 'verified';
  const full_name =
    clerkUser.fullName?.trim() ||
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ').trim() ||
    null;

  try {
    const backendRes = await fetchBackendApi(apiBase.baseUrl, '/auth/bridge/clerk-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Bridge-Secret': bridgeSecret,
      },
      body: JSON.stringify({
        email,
        full_name,
        email_verified: verified,
      }),
    });

    if (!backendRes.ok) {
      const errBody = (await backendRes.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
      };
      return NextResponse.json(
        { ok: false, error: errBody.error || 'Bridge exchange failed', code: errBody.code },
        { status: backendRes.status === 401 ? 401 : backendRes.status },
      );
    }

    const data = (await backendRes.json()) as {
      accessToken: string;
      refreshToken: string;
      user: {
        id: string;
        email: string;
        full_name: string | null;
        role: 'user' | 'admin';
        email_verified: boolean;
      };
    };

    const jar = await cookies();
    applyAuthSessionCookies(jar, {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });

    return NextResponse.json({
      ok: true,
      user: data.user,
    });
  } catch (err) {
    console.error('[auth/clerk-sync] backend fetch failed:', err);
    return backendUnreachableResponse(apiBase.baseUrl, '/auth/bridge/clerk-session', err, 503);
  }
}
