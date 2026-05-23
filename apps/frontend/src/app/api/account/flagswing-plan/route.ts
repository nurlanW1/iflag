import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { isClerkConfigured } from '@/lib/auth/clerk-env';
import { getAccessTokenFromCookies } from '@/lib/auth/session.server';
import { getDb } from '@/lib/server/db';
import { userHasFlagswingPaidDownloadAccess } from '@/lib/server/flagswing-download-access';

export const runtime = 'nodejs';

/**
 * Lightweight entitlement snapshot for Flagswing gallery download UI.
 */
export async function GET() {
  if (!isClerkConfigured()) {
    return NextResponse.json({ signedIn: false, hasActivePlan: false });
  }
  const user = await currentUser();
  if (!user?.id) {
    return NextResponse.json({ signedIn: false, hasActivePlan: false });
  }
  try {
    const pool = getDb();
    const accessToken = await getAccessTokenFromCookies();
    const hasActivePlan = await userHasFlagswingPaidDownloadAccess(pool, user, accessToken);
    return NextResponse.json({ signedIn: true, hasActivePlan });
  } catch (e) {
    console.error('[flagswing-plan] DB error:', e);
    return NextResponse.json({ signedIn: true, hasActivePlan: false });
  }
}
