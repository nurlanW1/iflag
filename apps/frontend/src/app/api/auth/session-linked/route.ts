import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getSessionUserFromCookies } from '@/lib/auth/session.server';
import { isClerkConfigured } from '@/lib/auth/clerk-env';

export const runtime = 'nodejs';

/**
 * Whether the HttpOnly backend session matches the current Clerk user (same verified email).
 */
export async function GET() {
  if (!isClerkConfigured()) {
    return NextResponse.json({ linked: true, reason: 'clerk_disabled' });
  }

  const clerkUser = await currentUser();
  const backend = await getSessionUserFromCookies();

  if (!clerkUser) {
    return NextResponse.json({ linked: false });
  }
  if (!backend) {
    return NextResponse.json({ linked: false });
  }

  const clerkEmail =
    clerkUser.primaryEmailAddress?.emailAddress?.trim().toLowerCase() ??
    clerkUser.emailAddresses?.[0]?.emailAddress?.trim().toLowerCase() ??
    '';

  const match =
    clerkEmail !== '' && clerkEmail === backend.email.trim().toLowerCase();

  return NextResponse.json({ linked: match });
}
