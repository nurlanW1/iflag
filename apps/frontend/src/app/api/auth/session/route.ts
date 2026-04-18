import { NextResponse } from 'next/server';
import { getSessionUserFromCookies } from '@/lib/auth/session.server';

export async function GET() {
  const user = await getSessionUserFromCookies();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({ user });
}
