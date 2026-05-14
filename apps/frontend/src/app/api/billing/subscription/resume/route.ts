import { NextResponse } from 'next/server';
import { getAccessTokenFromCookies, getSessionUserFromCookies } from '@/lib/auth/session.server';
import {
  BACKEND_UNREACHABLE_MESSAGE,
  resolveBackendApiBase,
} from '@/lib/auth/backend-url';

export const runtime = 'nodejs';

/** Resume a cancelled-but-not-expired subscription. */
export async function POST() {
  const user = await getSessionUserFromCookies();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const access = await getAccessTokenFromCookies();
  if (!access) return NextResponse.json({ error: 'Missing access token' }, { status: 401 });

  const apiBase = resolveBackendApiBase();
  if (!apiBase.ok) {
    return NextResponse.json({ error: apiBase.error, code: apiBase.code }, { status: 503 });
  }

  try {
    const r = await fetch(`${apiBase.baseUrl}/billing/subscriptions/resume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access}`,
      },
      cache: 'no-store',
    });
    const data = await r.json().catch(() => ({}));
    return NextResponse.json(data, { status: r.status });
  } catch (err) {
    console.error('[billing/subscription/resume proxy] backend error:', err);
    return NextResponse.json({ error: BACKEND_UNREACHABLE_MESSAGE, code: 'API_UNREACHABLE' }, { status: 502 });
  }
}
