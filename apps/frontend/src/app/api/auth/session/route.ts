import { NextResponse } from 'next/server';
import { getSessionUserFromCookies } from '@/lib/auth/session.server';

/** Optional legacy JWT session probe — 200 + `{ user: null }` when unsigned (not 401). */
export async function GET() {
  const user = await getSessionUserFromCookies();
  return NextResponse.json({ user: user ?? null });
}
