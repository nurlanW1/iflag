import { NextResponse } from 'next/server';
import { getDb } from '@/lib/server/db';
import { fetchFlagVideosFromDb } from '@/lib/server/flag-videos-from-db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!process.env.DATABASE_URL?.trim()) {
      return NextResponse.json({ videos: [] }, { headers: { 'Cache-Control': 'no-store' } });
    }
    const videos = await fetchFlagVideosFromDb(getDb());
    return NextResponse.json({ videos }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[gallery/videos]', error);
    return NextResponse.json({ videos: [] }, { status: 500 });
  }
}
