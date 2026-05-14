import { NextResponse } from 'next/server';
import { getSessionUserFromCookies, getAccessTokenFromCookies } from '@/lib/auth/session.server';
import { fetchAccountSubscriptionSummary } from '@/lib/account/dashboard-data';

/**
 * Current user's subscription summary — prefers backend billing (Paddle / Postgres).
 */
export async function GET() {
  const user = await getSessionUserFromCookies();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const access = await getAccessTokenFromCookies();
  const summary = await fetchAccountSubscriptionSummary(user.id, access);
  return NextResponse.json(summary);
}
