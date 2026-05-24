import { NextResponse } from 'next/server';
import { backendUnreachableResponse, fetchBackendApi } from '@/lib/auth/backend-fetch.server';
import { resolveBackendApiBase } from '@/lib/auth/backend-url';
import { resolveBillingAuthorization } from '@/lib/auth/billing-auth.server';

export const runtime = 'nodejs';

/**
 * Generic billing checkout proxy.
 *
 * Forwards the request to the backend `POST /billing/checkout` (Paddle Billing).
 * Auth: backend JWT cookies, client Bearer, or Clerk session on this host (see billing-auth.server).
 *
 * Body shape:
 *   { kind: 'subscription' | 'one_time', planSlug?: string, productSlug?: string }
 *
 * Returns the provider-specific response, typically `{ url: string }`.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const authResult = await resolveBillingAuthorization(request);
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error, code: authResult.code }, { status: authResult.status });
  }

  const apiBase = resolveBackendApiBase();
  if (!apiBase.ok) {
    return NextResponse.json({ error: apiBase.error, code: apiBase.code }, { status: 503 });
  }

  try {
    const r = await fetchBackendApi(apiBase.baseUrl, '/billing/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authResult.authorization,
      },
      body: JSON.stringify(body),
    });
    const data = await r.json().catch(() => ({}));
    return NextResponse.json(data, { status: r.status });
  } catch (err) {
    console.error('[billing/checkout proxy] backend error:', err);
    return backendUnreachableResponse(apiBase.baseUrl, '/billing/checkout', err);
  }
}
