import { NextResponse } from 'next/server';
import { fetchRandomGalleryPreviewItems } from '@/lib/server/flag-gallery-preview';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Random published flag products for the landing “Explore Flag Assets” grid.
 * Query: `limit` (default 12, max 48), `sample` (optional row cap before grouping).
 */
export async function GET(request: Request) {
  try {
    if (!process.env.DATABASE_URL?.trim()) {
      return NextResponse.json({ data: [] }, { headers: { 'Cache-Control': 'no-store' } });
    }

    const { searchParams } = new URL(request.url);
    const limitRaw = parseInt(searchParams.get('limit') || '12', 10);
    const limit = Number.isFinite(limitRaw) ? limitRaw : 12;

    const sampleRaw = searchParams.get('sample');
    let sample: number | undefined;
    if (sampleRaw != null && sampleRaw !== '') {
      const parsed = parseInt(sampleRaw, 10);
      if (Number.isFinite(parsed)) sample = parsed;
    }

    const randomParam = searchParams.get('random');
    const order =
      randomParam === 'false' ||
      randomParam === '0' ||
      searchParams.get('order')?.trim().toLowerCase() === 'latest'
        ? 'latest'
        : 'random';

    const data = await fetchRandomGalleryPreviewItems({ limit, sample, order });

    /** Objects include thumbnail_url, preview_url, file_url, format, image_url, available_formats, etc. */
    return NextResponse.json({ data }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    console.error('[api/gallery/preview]', e);
    return NextResponse.json({ data: [] }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  }
}
