import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import {
  getConfiguredAdminEmail,
  normalizeAdminEmail,
  serverEmailMatchesConfiguredAdmin,
} from '@/lib/auth/admin-email';

/**
 * API route gate: Clerk session required; primary email must match ADMIN_EMAIL server config.
 */
export async function requireClerkAdminJson(): Promise<
  | { ok: true; userId: string; email: string }
  | { ok: false; response: NextResponse }
> {
  const expected = getConfiguredAdminEmail();
  if (!expected) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'ADMIN_EMAIL is not configured on the server.', code: 'config' },
        { status: 503 }
      ),
    };
  }

  const { userId } = await auth();
  if (!userId) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized', code: 'unauthorized' }, { status: 401 }),
    };
  }

  const clerkUser = await currentUser();
  const primary =
    clerkUser?.primaryEmailAddress?.emailAddress ??
    clerkUser?.emailAddresses?.[0]?.emailAddress ??
    '';
  const email = normalizeAdminEmail(primary);

  if (!serverEmailMatchesConfiguredAdmin(email)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Forbidden: admin access only.', code: 'forbidden' },
        { status: 403 }
      ),
    };
  }

  return { ok: true, userId, email };
}
