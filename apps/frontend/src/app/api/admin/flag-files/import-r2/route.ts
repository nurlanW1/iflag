import { NextResponse } from 'next/server';
import { requireClerkAdminBearerJson } from '@/lib/server/require-clerk-admin-bearer';
import { backendUnreachableResponse, fetchBackendApi } from '@/lib/auth/backend-fetch.server';
import { resolveBackendApiBase } from '@/lib/auth/backend-url';

export const runtime = 'nodejs';
export const maxDuration = 300;

/**
 * Proxies to Railway/Express `POST /api/admin/flag-files/import-r2` after Clerk admin gate.
 * Query: maxObjects (default 100000), prefix (optional R2 list prefix).
 */
export async function POST(request: Request): Promise<Response> {
  const gate = await requireClerkAdminBearerJson(request);
  if (!gate.ok) return gate.response;

  const api = resolveBackendApiBase();
  if (!api.ok) {
    return NextResponse.json({ error: api.error, code: api.code }, { status: 503 });
  }

  const url = new URL(request.url);
  const qs = url.searchParams.toString();
  const path = `/admin/flag-files/import-r2${qs ? `?${qs}` : ''}`;
  const auth = request.headers.get('authorization');

  try {
    const backendRes = await fetchBackendApi(api.baseUrl, path, {
      method: 'POST',
      headers: auth ? { Authorization: auth } : {},
    });
    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendRes.status });
  } catch (err) {
    console.error('[admin/flag-files/import-r2] proxy failed:', err);
    return backendUnreachableResponse(api.baseUrl, path, err, 503);
  }
}
