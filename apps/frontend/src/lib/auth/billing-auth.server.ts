import { auth } from '@clerk/nextjs/server';
import { getAccessTokenFromCookies, getSessionUserFromCookies } from '@/lib/auth/session.server';
import { isClerkConfigured } from '@/lib/auth/clerk-env';

export type BillingAuthSource = 'backend_cookie' | 'incoming_bearer' | 'clerk_session';

export type BillingAuthResolution =
  | { ok: true; authorization: string; source: BillingAuthSource }
  | { ok: false; status: 401; error: string; code: 'AUTH_REQUIRED' | 'CLERK_TOKEN_MISSING' };

function parseBearer(header: string | null | undefined): string | null {
  const trimmed = header?.trim();
  if (!trimmed?.toLowerCase().startsWith('bearer ')) return null;
  const token = trimmed.slice(7).trim();
  return token.length > 0 ? trimmed : null;
}

/**
 * Resolve Authorization for Paddle/billing proxies.
 * Prefer client Clerk Bearer (fresh) over legacy backend cookies that may be stale.
 */
export async function resolveBillingAuthorization(
  request: Request,
): Promise<BillingAuthResolution> {
  const incomingBearer = parseBearer(request.headers.get('authorization'));

  if (incomingBearer) {
    return { ok: true, authorization: incomingBearer, source: 'incoming_bearer' };
  }

  const backendUser = await getSessionUserFromCookies();
  const access = await getAccessTokenFromCookies();
  if (backendUser && access) {
    return { ok: true, authorization: `Bearer ${access}`, source: 'backend_cookie' };
  }

  if (isClerkConfigured()) {
    const { userId, getToken } = await auth();
    if (userId) {
      const clerkToken = await getToken();
      if (clerkToken) {
        return { ok: true, authorization: `Bearer ${clerkToken}`, source: 'clerk_session' };
      }
      return {
        ok: false,
        status: 401,
        error: 'Clerk session found but no token could be issued. Refresh and try again.',
        code: 'CLERK_TOKEN_MISSING',
      };
    }
  }

  return { ok: false, status: 401, error: 'Unauthorized', code: 'AUTH_REQUIRED' };
}
