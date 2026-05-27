import { auth } from '@clerk/nextjs/server';
import { exchangeCurrentClerkSessionForBackendAccessToken } from '@/lib/auth/clerk-backend-bridge.server';
import { getAccessTokenFromCookies, getSessionUserFromCookies } from '@/lib/auth/session.server';
import { isClerkConfigured } from '@/lib/auth/clerk-env';

export type BillingAuthSource = 'backend_cookie' | 'incoming_bearer' | 'clerk_session';

export type BillingAuthResolution =
  | { ok: true; authorization: string; source: BillingAuthSource }
  | {
      ok: false;
      status: 401 | 403 | 503 | 500;
      error: string;
      code:
        | 'AUTH_REQUIRED'
        | 'CLERK_TOKEN_MISSING'
        | 'BRIDGE_SECRET_MISSING'
        | 'BRIDGE_FAILED'
        | 'MFA_REQUIRED'
        | 'API_URL_MISSING';
    };

function parseBearer(header: string | null | undefined): string | null {
  const trimmed = header?.trim();
  if (!trimmed?.toLowerCase().startsWith('bearer ')) return null;
  const token = trimmed.slice(7).trim();
  return token.length > 0 ? trimmed : null;
}

/**
 * Resolve Authorization for Paddle/billing proxies to Railway.
 * Prefer the client `Authorization: Bearer` (Clerk session from checkout buttons), then backend
 * JWT cookies, then server-side Clerk bridge. Railway verifies Clerk tokens before app JWT.
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
    const { userId } = await auth();
    if (userId) {
      const bridged = await exchangeCurrentClerkSessionForBackendAccessToken();
      if (bridged.ok) {
        return {
          ok: true,
          authorization: `Bearer ${bridged.accessToken}`,
          source: 'clerk_session',
        };
      }
      return {
        ok: false,
        status: bridged.status,
        error: bridged.error,
        code: bridged.code,
      };
    }
  }

  return { ok: false, status: 401, error: 'Unauthorized', code: 'AUTH_REQUIRED' };
}
