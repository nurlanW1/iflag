import { NextResponse } from 'next/server';
import { listFootballClubLogos } from '@/lib/football-clubs';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { clubs, source } = await listFootballClubLogos();

  return NextResponse.json(
    { clubs, count: clubs.length, source },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
}
