import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { isClerkConfigured } from '@/lib/auth/clerk-env';
import { getAccessTokenFromCookies } from '@/lib/auth/session.server';
import { fetchBackendAssetOwnership } from '@/lib/account/billing-ownership.server';
import { isMarketplaceOwnerDownloadBypass } from '@/lib/account/entitlements.server';
import { normalizedEmailsFromClerkUser } from '@/lib/auth/admin-email';

export const runtime = 'nodejs';

/**
 * Purchase entitlement snapshot for download UI (`?productSlug=` per design).
 */
export async function GET(request: Request) {
  if (!isClerkConfigured()) {
    return NextResponse.json({ signedIn: false, hasActivePlan: false, ownsProduct: false });
  }
  const user = await currentUser();
  if (!user?.id) {
    return NextResponse.json({ signedIn: false, hasActivePlan: false, ownsProduct: false });
  }

  const params = new URL(request.url).searchParams;
  const productSlug = params.get('productSlug')?.trim() ?? '';
  const assetGroupKey = params.get('assetGroupKey')?.trim() ?? '';

  try {
    const accessToken = await getAccessTokenFromCookies();
    const emails = normalizedEmailsFromClerkUser(user);
    const owner = emails.some((e) => isMarketplaceOwnerDownloadBypass(e));

    let ownsProduct = owner;
    if (!ownsProduct && productSlug && accessToken?.trim()) {
      const snap = await fetchBackendAssetOwnership(accessToken.trim(), {
        productSlug,
        assetGroupKey: assetGroupKey || null,
      });
      ownsProduct = Boolean(snap?.ownsProduct);
    }

    return NextResponse.json({
      signedIn: true,
      /** @deprecated subscriptions removed — always false */
      hasActivePlan: false,
      ownsProduct,
      alreadyPurchased: ownsProduct,
    });
  } catch (e) {
    console.error('[flagswing-plan] error:', e);
    return NextResponse.json({ signedIn: true, hasActivePlan: false, ownsProduct: false });
  }
}
