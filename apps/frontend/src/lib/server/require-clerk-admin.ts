import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

function normalizeEmail(value: string | undefined | null): string {
  return value?.trim().toLowerCase() ?? '';
}

/**
 * Admin API gate without relying on `clerkMiddleware()` / `auth()`.
 * Session is read from cookies via `currentUser()`.
 */
export async function requireClerkAdminJson(): Promise<
  | { ok: true; userId: string; email: string }
  | { ok: false; response: NextResponse }
> {
  const expected = normalizeEmail(process.env.ADMIN_EMAIL);
  if (!expected) {
    console.error('[requireClerkAdminJson] ADMIN_EMAIL is not configured');
    return {
      ok: false,
      response: NextResponse.json({ error: 'Service unavailable', code: 'config' }, { status: 503 }),
    };
  }

  const user = await currentUser();
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Not signed in', code: 'unauthorized' }, { status: 401 }),
    };
  }

  const email = user.emailAddresses?.[0]?.emailAddress;
  if (normalizeEmail(email) !== expected) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Access denied', code: 'forbidden' }, { status: 403 }),
    };
  }

  const display =
    user.primaryEmailAddress?.emailAddress ?? user.emailAddresses?.[0]?.emailAddress ?? '';

  return { ok: true, userId: user.id, email: display };
}
