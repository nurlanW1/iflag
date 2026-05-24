import { currentUser, type User } from '@clerk/nextjs/server';
import { fetchBackendApi } from '@/lib/auth/backend-fetch.server';
import { resolveBackendApiBase } from '@/lib/auth/backend-url';

export type ClerkBackendBridgeResult =
  | { ok: true; accessToken: string }
  | {
      ok: false;
      status: 401 | 403 | 503 | 500;
      error: string;
      code: 'BRIDGE_SECRET_MISSING' | 'API_URL_MISSING' | 'BRIDGE_FAILED' | 'MFA_REQUIRED';
    };

function clerkEmail(user: User): { email: string; verified: boolean } | null {
  const addr = user.primaryEmailAddress ?? user.emailAddresses?.[0];
  const email = addr?.emailAddress?.trim();
  if (!email) return null;
  return { email, verified: addr?.verification?.status === 'verified' };
}

/** Exchange a verified Clerk identity for a backend HS256 access token (Railway bridge). */
export async function exchangeClerkUserForBackendAccessToken(
  clerkUser: User,
): Promise<ClerkBackendBridgeResult> {
  const apiBase = resolveBackendApiBase();
  if (!apiBase.ok) {
    return {
      ok: false,
      status: 503,
      error: apiBase.error,
      code: 'API_URL_MISSING',
    };
  }

  const bridgeSecret = process.env.INTERNAL_AUTH_BRIDGE_SECRET?.trim();
  if (!bridgeSecret) {
    return {
      ok: false,
      status: 503,
      error:
        'INTERNAL_AUTH_BRIDGE_SECRET is missing on the frontend server. Set the same value on Vercel and Railway.',
      code: 'BRIDGE_SECRET_MISSING',
    };
  }

  const identity = clerkEmail(clerkUser);
  if (!identity) {
    return {
      ok: false,
      status: 403,
      error: 'Your Clerk account must have an email address to use Paddle checkout.',
      code: 'BRIDGE_FAILED',
    };
  }

  const full_name =
    clerkUser.fullName?.trim() ||
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ').trim() ||
    null;

  try {
    const res = await fetchBackendApi(apiBase.baseUrl, '/auth/bridge/clerk-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Bridge-Secret': bridgeSecret,
      },
      body: JSON.stringify({
        email: identity.email,
        full_name,
        email_verified: identity.verified,
      }),
    });

    const data = (await res.json().catch(() => ({}))) as {
      accessToken?: string;
      error?: string;
      code?: string;
    };

    if (res.status === 403 && data.code === 'MFA_REQUIRED') {
      return {
        ok: false,
        status: 403,
        error:
          data.error ||
          'This account has MFA enabled. Sign in with email and password to use Paddle billing.',
        code: 'MFA_REQUIRED',
      };
    }

    if (!res.ok || !data.accessToken) {
      return {
        ok: false,
        status: res.status === 401 ? 401 : 503,
        error: data.error || 'Could not link your Clerk account to the billing API.',
        code: 'BRIDGE_FAILED',
      };
    }

    return { ok: true, accessToken: data.accessToken };
  } catch (err) {
    console.error('[clerk-backend-bridge] exchange failed:', err);
    return {
      ok: false,
      status: 503,
      error: 'Cannot reach the billing API to authorize checkout.',
      code: 'BRIDGE_FAILED',
    };
  }
}

/** Resolve Clerk on this host, then bridge to a backend access token. */
export async function exchangeCurrentClerkSessionForBackendAccessToken(): Promise<ClerkBackendBridgeResult> {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    return {
      ok: false,
      status: 401,
      error: 'Unauthorized',
      code: 'BRIDGE_FAILED',
    };
  }
  return exchangeClerkUserForBackendAccessToken(clerkUser);
}
