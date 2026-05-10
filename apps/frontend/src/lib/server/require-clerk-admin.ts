import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import {
  getServerAdminAllowlist,
  normalizedEmailsFromClerkUser,
} from '@/lib/auth/admin-email';
import { isClerkConfigured } from '@/lib/auth/clerk-env';

/**
 * Admin API gate without `auth()` / `clerkMiddleware()`.
 * Session is resolved from Clerk cookies inside the Route Handler (Node runtime recommended).
 */
export async function requireClerkAdminJson(): Promise<
  | { ok: true; userId: string; email: string }
  | { ok: false; response: NextResponse }
> {
  const allow = getServerAdminAllowlist();
  if (!allow.size) {
    console.error('[requireClerkAdminJson] Admin allow-list is empty (set ADMIN_EMAIL on the server)');
    return {
      ok: false,
      response: NextResponse.json({ error: 'Service unavailable', code: 'config' }, { status: 503 }),
    };
  }

  let user: Awaited<ReturnType<typeof currentUser>>;
  try {
    user = await currentUser();
  } catch (e) {
    console.error('[requireClerkAdminJson] currentUser() failed:', e);
    if (!isClerkConfigured()) {
      return {
        ok: false,
        response: NextResponse.json(
          {
            error:
              'Clerk is not configured on the server (set CLERK_SECRET_KEY and publishable key).',
            code: 'config',
          },
          { status: 503 }
        ),
      };
    }
    return {
      ok: false,
      response: NextResponse.json({ error: 'Not signed in', code: 'unauthorized' }, { status: 401 }),
    };
  }

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Not signed in', code: 'unauthorized' }, { status: 401 }),
    };
  }

  const clerkEmails = normalizedEmailsFromClerkUser(user);
  if (!clerkEmails.some((e) => allow.has(e))) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Access denied', code: 'forbidden' }, { status: 403 }),
    };
  }

  const display =
    user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses?.[0]?.emailAddress ??
    clerkEmails[0] ??
    '';

  return { ok: true, userId: user.id, email: display };
}
