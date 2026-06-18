import { NextResponse } from 'next/server';
import { requireClerkAdminBearerJson } from '@/lib/server/require-clerk-admin-bearer';
import { backendUnreachableResponse, fetchBackendApi } from '@/lib/auth/backend-fetch.server';
import { resolveBackendApiBase } from '@/lib/auth/backend-url';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(request: Request): Promise<Response> {
  const gate = await requireClerkAdminBearerJson(request);
  if (!gate.ok) return gate.response;

  const api = resolveBackendApiBase();
  if (!api.ok) {
    return NextResponse.json({ error: api.error, code: api.code }, { status: 503 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data.', code: 'bad_request' }, { status: 400 });
  }

  const auth = request.headers.get('authorization');

  try {
    const backendRes = await fetchBackendApi(api.baseUrl, '/admin/flag-files/upload-batch', {
      method: 'POST',
      body: formData,
      headers: auth ? { Authorization: auth } : {},
    });
    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendRes.status });
  } catch (err) {
    console.error('[admin/flag-files/upload-batch] proxy failed:', err);
    return backendUnreachableResponse(api.baseUrl, '/admin/flag-files/upload-batch', err, 503);
  }
}
