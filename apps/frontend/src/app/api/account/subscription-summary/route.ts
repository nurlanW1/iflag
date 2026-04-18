import { NextResponse } from 'next/server';
import { getSessionUserFromCookies } from '@/lib/auth/session.server';
import { fetchAccountSubscriptionSummary } from '@/lib/account/dashboard-data';

/**
 * Current user's subscription summary from the marketplace store (Lemon Squeezy webhooks).
 */
export async function GET() {
  const user = await getSessionUserFromCookies();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const summary = await fetchAccountSubscriptionSummary(user.id);
  return NextResponse.json(summary);
}
