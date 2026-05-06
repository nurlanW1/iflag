import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import {
  getServerAdminAllowlist,
  normalizedEmailsFromClerkUser,
  serverClerkUserMatchesAdmin,
} from '@/lib/auth/admin-email';

/**
 * API route gate: Clerk session required; any linked email must match the server allow-list.
 */
export async function requireClerkAdminJson(): Promise<
  | { ok: true; userId: string; email: string }
  | { ok: false; response: NextResponse }
> {
  const allow = getServerAdminAllowlist();
  if (!allow.size) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Admin allow-list is not configured on the server.', code: 'config' },
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
  if (!serverClerkUserMatchesAdmin(clerkUser)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Forbidden: admin access only.', code: 'forbidden' },
        { status: 403 }
      ),
    };
  }

  const candidates = normalizedEmailsFromClerkUser(clerkUser);
  const matched = candidates.find((e) => allow.has(e)) ?? '';
  const display =
    clerkUser?.primaryEmailAddress?.emailAddress ??
    clerkUser?.emailAddresses?.[0]?.emailAddress ??
    matched;

  return { ok: true, userId, email: display || matched };
}
