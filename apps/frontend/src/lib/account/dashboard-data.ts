/**
 * Account dashboard data — merges marketplace memory store with backend billing when JWT cookie is present.
 */

import { getMarketplaceStore } from '@/services/marketplace/memory-store';
import { listPublishedProducts, getProductBySlug } from '@/services/marketplace/product-service';
import { fetchSubscriptionSummaryFromBillingApi } from '@/lib/account/billing-subscription.server';
import {
  fetchBackendPaidProductGrantDates,
  fetchAllBillingOrders,
} from '@/lib/account/billing-access.server';
import {
  fetchBackendPurchasedAssets,
  type PurchasedAssetRow,
} from '@/lib/account/billing-ownership.server';
import type {
  AccountDownloadRow,
  AccountFreePreviewRow,
  AccountLapsedSubscription,
  AccountOwnedFileRow,
  AccountPurchaseRow,
  AccountSubscriptionAccessPanel,
  AccountSubscriptionSummary,
} from '@/types/account';

function nowMs(): number {
  return Date.now();
}

/** User can download pro files via subscription (paid period not ended). */
export function userHasLiveSubscription(userId: string): boolean {
  const store = getMarketplaceStore();
  const now = nowMs();
  return store.subscriptions.some((s) => {
    if (s.userId !== userId) return false;
    if (new Date(s.currentPeriodEnd).getTime() <= now) return false;
    return s.status === 'active' || s.status === 'trialing' || s.status === 'past_due';
  });
}

function pickLapsedSubscription(userId: string): AccountLapsedSubscription | null {
  const store = getMarketplaceStore();
  const now = nowMs();
  const subs = store.subscriptions.filter((s) => s.userId === userId);
  if (subs.length === 0) return null;

  const ended = subs.filter((s) => {
    const end = new Date(s.currentPeriodEnd).getTime();
    return end <= now || s.status === 'canceled' || s.status === 'expired';
  });
  ended.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const s = ended[0];
  if (!s) return null;

  const plan = store.plansById.get(s.planId);
  let st: AccountLapsedSubscription['status'] = 'expired';
  if (s.status === 'canceled') st = 'canceled';
  else if (s.status === 'past_due') st = 'past_due';

  return {
    planName: plan?.name ?? 'Subscription',
    endedAt: s.currentPeriodEnd,
    status: st,
  };
}

function mapBillingPurchaseStatus(st: string): AccountPurchaseRow['status'] {
  if (st === 'refunded') return 'refunded';
  if (st === 'paid' || st === 'partial_refund') return 'fulfilled';
  return 'pending';
}

/** Lifetime owned designs from `user_asset_purchases` (Paddle one-time). */
export async function fetchAccountPurchasedAssets(
  accessToken?: string | null
): Promise<PurchasedAssetRow[]> {
  if (!accessToken?.trim()) return [];
  const assets = await fetchBackendPurchasedAssets(accessToken.trim());
  return assets ?? [];
}

export async function fetchAccountPurchases(
  userId: string,
  accessToken?: string | null
): Promise<AccountPurchaseRow[]> {
  const store = getMarketplaceStore();
  const memoryOrders = [...store.ordersById.values()].filter(
    (o) =>
      o.userId === userId &&
      (o.status === 'paid' || o.status === 'fulfilled' || o.status === 'refunded')
  );
  memoryOrders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const memoryRows: AccountPurchaseRow[] = [];
  for (const order of memoryOrders) {
    const items = store.orderItemsByOrderId.get(order.id) ?? [];
    for (const item of items) {
      const product = store.productsById.get(item.productId);
      memoryRows.push({
        id: item.id,
        productTitle: product?.title ?? 'Product',
        purchasedAt: order.createdAt,
        status: order.status === 'refunded' ? 'refunded' : 'fulfilled',
      });
    }
  }

  if (!accessToken?.trim()) return memoryRows;

  const billingOrders = await fetchAllBillingOrders(accessToken.trim());
  if (!billingOrders?.length) return memoryRows;

  const billingRows: AccountPurchaseRow[] = billingOrders.map((o) => {
    const slug = o.product_slug?.trim() ?? '';
    const title = slug ? getProductBySlug(slug)?.title ?? slug : 'Purchase';
    return {
      id: `billing:${o.id}`,
      productTitle: title,
      purchasedAt: o.created_at || null,
      status: mapBillingPurchaseStatus(o.status),
    };
  });

  const merged = [...billingRows, ...memoryRows];
  merged.sort((a, b) => {
    const ta = a.purchasedAt ?? '';
    const tb = b.purchasedAt ?? '';
    return tb.localeCompare(ta);
  });
  return merged;
}

/** Permanent pro file entitlements (purchase / admin / Paddle one-time orders). */
export async function fetchAccountOwnedFileRows(
  userId: string,
  accessToken?: string | null
): Promise<AccountOwnedFileRow[]> {
  const store = getMarketplaceStore();
  const now = nowMs();
  const rows: AccountOwnedFileRow[] = [];

  for (const g of store.downloadAccess) {
    if (g.userId !== userId) continue;
    if (g.source !== 'purchase' && g.source !== 'admin_grant') continue;
    if (g.expiresAt != null && new Date(g.expiresAt).getTime() <= now) continue;

    const product = store.productsById.get(g.productId);
    const file = product?.files.find((f) => f.id === g.productFileId);
    if (!product?.isPublished || !file || file.tier !== 'pro') continue;

    rows.push({
      accessId: g.id,
      productId: product.id,
      productSlug: product.slug,
      productTitle: product.title,
      fileId: file.id,
      fileName: file.fileName,
      format: file.format,
      qualityLabel: file.qualityLabel,
      grantedAt: g.grantedAt,
    });
  }

  rows.sort((a, b) => b.grantedAt.localeCompare(a.grantedAt));

  if (!accessToken?.trim()) return rows;

  const slugDates = await fetchBackendPaidProductGrantDates(accessToken.trim());
  if (!slugDates?.size) return rows;

  const seen = new Set(rows.map((r) => `${r.productId}:${r.fileId}`));
  const billingExtras: AccountOwnedFileRow[] = [];

  for (const [slug, grantedAt] of slugDates) {
    const product = getProductBySlug(slug);
    if (!product?.isPublished) continue;

    for (const file of product.files) {
      if (file.tier !== 'pro') continue;
      const key = `${product.id}:${file.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      billingExtras.push({
        accessId: `billing:${slug}:${file.id}`,
        productId: product.id,
        productSlug: product.slug,
        productTitle: product.title,
        fileId: file.id,
        fileName: file.fileName,
        format: file.format,
        qualityLabel: file.qualityLabel,
        grantedAt: grantedAt || new Date().toISOString(),
      });
    }
  }

  billingExtras.sort((a, b) => b.grantedAt.localeCompare(a.grantedAt));
  return [...rows, ...billingExtras].sort((a, b) => b.grantedAt.localeCompare(a.grantedAt));
}

/** Catalog free previews (public URLs) — separate from paid ownership. */
export async function fetchAccountFreePreviewRows(): Promise<AccountFreePreviewRow[]> {
  const products = listPublishedProducts();
  const rows: AccountFreePreviewRow[] = [];
  for (const p of products) {
    for (const f of p.files) {
      if (f.tier !== 'preview_free' || !f.publicUrl) continue;
      rows.push({
        productId: p.id,
        productSlug: p.slug,
        productTitle: p.title,
        fileId: f.id,
        fileName: f.fileName,
        format: f.format,
        qualityLabel: f.qualityLabel,
      });
    }
  }
  rows.sort((a, b) => a.productTitle.localeCompare(b.productTitle));
  return rows;
}

export async function fetchAccountDownloads(_userId: string): Promise<AccountDownloadRow[]> {
  return [];
}

async function subscriptionSummaryFromMemoryStore(
  userId: string
): Promise<AccountSubscriptionSummary> {
  const store = getMarketplaceStore();
  const now = nowMs();
  const live = userHasLiveSubscription(userId);
  const lapsed = !live ? pickLapsedSubscription(userId) : null;

  const subs = store.subscriptions.filter((s) => s.userId === userId);
  if (subs.length === 0) {
    return { planName: null, status: 'none', renewsAt: null, lapsed };
  }
  subs.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const primary = subs[0]!;
  const plan = store.plansById.get(primary.planId);

  const periodLive =
    new Date(primary.currentPeriodEnd).getTime() > now &&
    (primary.status === 'active' ||
      primary.status === 'trialing' ||
      primary.status === 'past_due');

  if (primary.status === 'expired' || primary.status === 'canceled') {
    return {
      planName: plan?.name ?? null,
      status: 'canceled',
      renewsAt: null,
      lapsed,
    };
  }

  if (primary.status === 'past_due') {
    return {
      planName: plan?.name ?? null,
      status: 'past_due',
      renewsAt: primary.currentPeriodEnd,
      lapsed: periodLive ? null : lapsed,
    };
  }

  if (primary.status === 'trialing') {
    return {
      planName: plan?.name ?? null,
      status: 'trialing',
      renewsAt: primary.currentPeriodEnd,
      lapsed: periodLive ? null : lapsed,
    };
  }

  if (primary.status === 'active') {
    const stillValid = new Date(primary.currentPeriodEnd).getTime() > now;
    if (!stillValid) {
      return { planName: plan?.name ?? null, status: 'none', renewsAt: null, lapsed };
    }
    return {
      planName: plan?.name ?? null,
      status: 'active',
      renewsAt: primary.currentPeriodEnd,
      lapsed: null,
    };
  }

  return { planName: plan?.name ?? null, status: 'none', renewsAt: null, lapsed };
}

/**
 * Subscription summary for dashboard / account UI.
 * Uses backend `/billing/subscription` when `accessToken` is available; otherwise falls back to the demo memory store.
 */
export async function fetchAccountSubscriptionSummary(
  userId: string,
  accessToken?: string | null
): Promise<AccountSubscriptionSummary> {
  if (accessToken?.trim()) {
    const billing = await fetchSubscriptionSummaryFromBillingApi(accessToken.trim());
    if (billing.ok) return billing.summary;
  }
  return subscriptionSummaryFromMemoryStore(userId);
}

export async function fetchAccountSubscriptionAccessPanel(
  userId: string,
  accessToken?: string | null
): Promise<AccountSubscriptionAccessPanel> {
  const summary = await fetchAccountSubscriptionSummary(userId, accessToken);
  const hasProViaSubscription =
    summary.status === 'active' ||
    summary.status === 'trialing' ||
    (summary.status === 'past_due' &&
      summary.renewsAt != null &&
      new Date(summary.renewsAt).getTime() > nowMs());

  return {
    hasProViaSubscription,
    planName: summary.planName,
    status: summary.status,
    validThrough: summary.renewsAt,
    lapsed: summary.lapsed,
  };
}
