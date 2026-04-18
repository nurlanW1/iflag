import { NextResponse } from 'next/server';
import { toPublicProduct } from '@/lib/marketplace/product-mapper';
import { getProductBySlug } from '@/services/marketplace';

export const dynamic = 'force-dynamic';

function isSafeSlug(segment: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(segment) && segment.length <= 200;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  if (!slug || !isSafeSlug(slug)) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
  }

  const product = getProductBySlug(slug);
  if (!product) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ data: toPublicProduct(product) });
}
