import { auth } from '@clerk/nextjs/server';
import { getAccessTokenFromCookies, getSessionUserFromCookies } from '@/lib/auth/session.server';
import { isClerkConfigured } from '@/lib/auth/clerk-env';

export type BillingAuthSource = 'backend_cookie' | 'incoming_bearer' | 'clerk_session';

export type BillingAuthResolution =
  | { ok: true; authorization: string; source: BillingAuthSource }
  | { ok: false; status: 401; error: string; code: 'AUTH_REQUIRED' };

/**
 * Resolve Authorization for Paddle/billing proxies.
 * Order: linked backend JWT cookies → client Bearer → Clerk session on this host (no cross-domain cookie needed).
 */
export async function resolveBillingAuthorization(
  request: Request,
): Promise<BillingAuthResolution> {
  const incomingAuth = request.headers.get('authorization')?.trim();

  const backendUser = await getSessionUserFromCookies();
  const access = await getAccessTokenFromCookies();
  if (backendUser && access) {
    return { ok: true, authorization: `Bearer ${access}`, source: 'backend_cookie' };
  }

  if (
    incomingAuth?.toLowerCase().startsWith('bearer ') &&
    incomingAuth.slice(7).trim().length > 0
  ) {
    return { ok: true, authorization: incomingAuth, source: 'incoming_bearer' };
  }

  if (isClerkConfigured()) {
    const { userId, getToken } = await auth();
    if (userId) {
      const clerkToken = await getToken();
      if (clerkToken) {
        return { ok: true, authorization: `Bearer ${clerkToken}`, source: 'clerk_session' };
      }
    }
  }

  return { ok: false, status: 401, error: 'Unauthorized', code: 'AUTH_REQUIRED' };
}
