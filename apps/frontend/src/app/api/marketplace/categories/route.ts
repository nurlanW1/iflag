import { NextResponse } from 'next/server';
import { listCategories } from '@/services/marketplace';

export const dynamic = 'force-dynamic';

export async function GET() {
  const categories = listCategories().filter((c) => c.isApproved);
  return NextResponse.json({ data: categories });
}
