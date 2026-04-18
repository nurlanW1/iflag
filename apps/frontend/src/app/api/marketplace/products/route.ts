import { NextResponse } from 'next/server';
import { toPublicProduct } from '@/lib/marketplace/product-mapper';
import {
  getCategoryBySlug,
  queryCatalog,
  type CatalogSort,
} from '@/services/marketplace';

export const dynamic = 'force-dynamic';

function parseSort(raw: string | null): CatalogSort {
  if (raw === 'oldest' || raw === 'title' || raw === 'popular' || raw === 'newest') {
    return raw;
  }
  return 'newest';
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const featured =
    searchParams.get('featured') === '1' || searchParams.get('featured') === 'true';
  const hasFreeDownload =
    searchParams.get('hasFreeDownload') === '1' ||
    searchParams.get('hasFreeDownload') === 'true';

  const categorySlug = searchParams.get('categorySlug');
  let categoryId: string | undefined;
  if (categorySlug) {
    const cat = getCategoryBySlug(categorySlug);
    if (!cat) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    categoryId = cat.id;
  }

  const search = searchParams.get('q') ?? searchParams.get('search') ?? undefined;
  const tierRaw = searchParams.get('tier');
  const tier =
    tierRaw === 'free' || tierRaw === 'pro' ? tierRaw : ('all' as const);

  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const limit = Math.min(
    48,
    Math.max(1, parseInt(searchParams.get('limit') || '24', 10) || 24)
  );

  const { products, total } = queryCatalog({
    categoryId,
    featured,
    hasFreeDownload,
    search: search ?? undefined,
    tier,
    sort: parseSort(searchParams.get('sort')),
    page,
    limit,
  });

  return NextResponse.json({
    data: products.map(toPublicProduct),
    page,
    limit,
    total,
    hasMore: page * limit < total,
  });
}
