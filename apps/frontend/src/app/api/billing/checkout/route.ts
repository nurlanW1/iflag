import { NextResponse } from 'next/server';
import { getAccessTokenFromCookies, getSessionUserFromCookies } from '@/lib/auth/session.server';
import { getBackendApiBaseUrl } from '@/lib/auth/backend-url';

export const runtime = 'nodejs';

/**
 * Generic billing checkout proxy.
 *
 * Forwards the request to the backend `POST /billing/checkout` (Paddle Billing).
 *
 * Body shape:
 *   { kind: 'subscription' | 'one_time', planSlug?: string, productSlug?: string }
 *
 * Returns the provider-specific response, typically `{ url: string }`.
 */
export async function POST(request: Request) {
  const user = await getSessionUserFromCookies();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const access = await getAccessTokenFromCookies();
  if (!access) {
    return NextResponse.json({ error: 'Missing access token' }, { status: 401 });
  }

  try {
    const r = await fetch(`${getBackendApiBaseUrl()}/billing/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access}`,
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    const data = await r.json().catch(() => ({}));
    return NextResponse.json(data, { status: r.status });
  } catch (err) {
    console.error('[billing/checkout proxy] backend error:', err);
    return NextResponse.json(
      { error: 'Billing service unavailable' },
      { status: 502 }
    );
  }
}
