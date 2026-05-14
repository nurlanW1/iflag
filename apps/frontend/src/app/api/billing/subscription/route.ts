import { NextResponse } from 'next/server';
import { getAccessTokenFromCookies, getSessionUserFromCookies } from '@/lib/auth/session.server';
import { getBackendApiBaseUrl } from '@/lib/auth/backend-url';

export const runtime = 'nodejs';

/** Get the authenticated user's current subscription (provider-aware fields). */
export async function GET() {
  const user = await getSessionUserFromCookies();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const access = await getAccessTokenFromCookies();
  if (!access) return NextResponse.json({ error: 'Missing access token' }, { status: 401 });

  try {
    const r = await fetch(`${getBackendApiBaseUrl()}/billing/subscription`, {
      headers: { Authorization: `Bearer ${access}` },
      cache: 'no-store',
    });
    const data = await r.json().catch(() => ({}));
    return NextResponse.json(data, { status: r.status });
  } catch (err) {
    console.error('[billing/subscription proxy] backend error:', err);
    return NextResponse.json({ error: 'Billing service unavailable' }, { status: 502 });
  }
}
