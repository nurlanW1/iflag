/**
 * Backend lifetime asset ownership (user_asset_purchases).
 */

import { resolveBackendApiBase } from '@/lib/auth/backend-url';

export type AssetOwnershipSnapshot = {
  ownsProduct: boolean;
  alreadyPurchased: boolean;
  productSlug?: string;
  assetGroupKey?: string;
};

export async function fetchBackendAssetOwnership(
  accessToken: string,
  params: { productSlug: string; assetGroupKey?: string | null }
): Promise<AssetOwnershipSnapshot | null> {
  try {
    const api = resolveBackendApiBase();
    if (!api.ok) return null;

    const q = new URLSearchParams();
    q.set('productSlug', params.productSlug.trim());
    if (params.assetGroupKey?.trim()) {
      q.set('assetGroupKey', params.assetGroupKey.trim());
    }

    const res = await fetch(`${api.baseUrl}/billing/ownership?${q.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken.trim()}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;

    const data = (await res.json()) as AssetOwnershipSnapshot;
    return {
      ownsProduct: Boolean(data.ownsProduct),
      alreadyPurchased: Boolean(data.alreadyPurchased ?? data.ownsProduct),
      productSlug: data.productSlug,
      assetGroupKey: data.assetGroupKey,
    };
  } catch {
    return null;
  }
}

export type PurchasedAssetRow = {
  id: string;
  asset_group_key: string;
  product_slug: string | null;
  purchased_at: string;
  display_title: string | null;
  country_slug: string | null;
};

export async function fetchBackendPurchasedAssets(
  accessToken: string
): Promise<PurchasedAssetRow[] | null> {
  try {
    const api = resolveBackendApiBase();
    if (!api.ok) return null;

    const res = await fetch(`${api.baseUrl}/billing/purchased-assets`, {
      headers: { Authorization: `Bearer ${accessToken.trim()}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;

    const data = (await res.json()) as { assets?: PurchasedAssetRow[] };
    return data.assets ?? [];
  } catch {
    return null;
  }
}
