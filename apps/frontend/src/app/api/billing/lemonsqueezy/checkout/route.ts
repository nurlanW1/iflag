import { NextResponse } from 'next/server';
import { getLemonSqueezyClientConfig } from '@/lib/billing/lemonsqueezy-config';
import { createLemonSqueezyCheckout } from '@/lib/billing/lemonsqueezy-api';
import { resolveCheckoutVariant, type CheckoutKind } from '@/lib/billing/lemonsqueezy-mapping';
import { getSessionUserFromCookies } from '@/lib/auth/session.server';
import { getProductBySlug } from '@/services/marketplace/product-service';
import { getMarketplaceStore } from '@/services/marketplace/memory-store';

export const runtime = 'nodejs';

type Body = {
  kind: CheckoutKind;
  productSlug?: string;
  planSlug?: string;
};

/**
 * Create a Lemon Squeezy hosted checkout. Requires logged-in user (custom user_id on webhook).
 */
export async function POST(request: Request) {
  const config = getLemonSqueezyClientConfig();
  if (!config) {
    return NextResponse.json(
      { error: 'Billing is not configured (missing LEMONSQUEEZY_* env vars).' },
      { status: 503 }
    );
  }

  const user = await getSessionUserFromCookies();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (body.kind !== 'one_time' && body.kind !== 'subscription') {
    return NextResponse.json({ error: 'Invalid kind' }, { status: 400 });
  }

  const resolved = resolveCheckoutVariant(
    body.kind,
    body.productSlug ?? null,
    body.planSlug ?? null
  );
  if (!resolved) {
    return NextResponse.json(
      {
        error:
          'No Lemon Squeezy variant mapped for this product/plan. Set LEMONSQUEEZY_VARIANT_MAP_JSON.',
      },
      { status: 400 }
    );
  }

  if (resolved.kind === 'one_time') {
    const product = getProductBySlug(resolved.productSlug);
    if (!product?.isPublished) {
      return NextResponse.json({ error: 'Product not available' }, { status: 404 });
    }
  } else {
    const plan = [...getMarketplaceStore().plansById.values()].find(
      (p) => p.slug === resolved.planSlug
    );
    if (!plan?.isActive) {
      return NextResponse.json({ error: 'Plan not available' }, { status: 404 });
    }
  }

  const testMode = process.env.LEMONSQUEEZY_TEST_MODE === 'true';

  try {
    const { checkoutUrl } = await createLemonSqueezyCheckout(config, {
      variantId: resolved.variantId,
      userId: user.id,
      userEmail: user.email,
      userName: user.full_name ?? undefined,
      testMode,
    });
    return NextResponse.json({ url: checkoutUrl });
  } catch (e) {
    console.error('LemonSqueezy checkout error:', e);
    return NextResponse.json({ error: 'Checkout creation failed' }, { status: 502 });
  }
}
