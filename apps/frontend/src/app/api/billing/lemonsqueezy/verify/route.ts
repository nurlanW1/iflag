import { NextResponse } from 'next/server';
import { getLemonSqueezyClientConfig } from '@/lib/billing/lemonsqueezy-config';
import { retrieveLemonSqueezyCheckout } from '@/lib/billing/lemonsqueezy-api';
import { getSessionUserFromCookies } from '@/lib/auth/session.server';

export const runtime = 'nodejs';

/**
 * Optional post-redirect verification: confirms checkout exists (does not prove payment —
 * rely on webhooks for fulfillment). Helps UX polling after returning from LS.
 */
export async function GET(request: Request) {
  const config = getLemonSqueezyClientConfig();
  if (!config) {
    return NextResponse.json({ error: 'Billing not configured' }, { status: 503 });
  }

  const user = await getSessionUserFromCookies();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const checkoutId = searchParams.get('checkout_id')?.trim();
  if (!checkoutId) {
    return NextResponse.json({ error: 'checkout_id required' }, { status: 400 });
  }

  try {
    const { status } = await retrieveLemonSqueezyCheckout(config, checkoutId);
    return NextResponse.json({ status, checkoutId });
  } catch {
    return NextResponse.json({ error: 'Verification failed' }, { status: 502 });
  }
}
