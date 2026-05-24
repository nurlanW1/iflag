import { NextResponse } from 'next/server';
import { requireClerkAdminBearerJson } from '@/lib/server/require-clerk-admin-bearer';
import {
  BACKEND_UNREACHABLE_MESSAGE,
  resolveBackendApiBase,
} from '@/lib/auth/backend-url';

export const runtime = 'nodejs';
export const maxDuration = 120;

/**
 * Admin flag upload: verifies Clerk on Vercel, then proxies multipart body to the Express API
 * which uploads to **Cloudflare R2** and inserts `country_flag_files` on Neon.
 *
 * Requires `NEXT_PUBLIC_API_URL` pointing at the backend (…/api) and R2 env on the API server.
 */
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
  const target = `${api.baseUrl}/admin/flag-files/upload`;

  try {
    const backendRes = await fetch(target, {
      method: 'POST',
      body: formData,
      headers: auth ? { Authorization: auth } : {},
      cache: 'no-store',
    });
    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendRes.status });
  } catch (err) {
    console.error('[admin/flag-files/upload] proxy to backend failed:', err);
    return NextResponse.json(
      { error: BACKEND_UNREACHABLE_MESSAGE, code: 'API_UNREACHABLE' },
      { status: 503 }
    );
  }
}
