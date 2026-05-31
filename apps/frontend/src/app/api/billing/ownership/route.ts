import { NextResponse } from 'next/server';
import { backendUnreachableResponse, fetchBackendApi } from '@/lib/auth/backend-fetch.server';
import { resolveBackendApiBase } from '@/lib/auth/backend-url';
import { resolveBillingAuthorization } from '@/lib/auth/billing-auth.server';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const authResult = await resolveBillingAuthorization(request);
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error, code: authResult.code }, { status: authResult.status });
  }

  const apiBase = resolveBackendApiBase();
  if (!apiBase.ok) {
    return NextResponse.json({ error: apiBase.error, code: apiBase.code }, { status: 503 });
  }

  const url = new URL(request.url);
  const q = url.searchParams.toString();

  try {
    const r = await fetchBackendApi(
      apiBase.baseUrl,
      `/billing/ownership${q ? `?${q}` : ''}`,
      {
        headers: { Authorization: authResult.authorization },
        cache: 'no-store',
      }
    );
    const data = await r.json().catch(() => ({}));
    return NextResponse.json(data, { status: r.status });
  } catch (err) {
    console.error('[billing/ownership proxy] backend error:', err);
    return backendUnreachableResponse(apiBase.baseUrl, '/billing/ownership', err);
  }
}
