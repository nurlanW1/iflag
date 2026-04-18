/**
 * Account dashboard data — reads marketplace memory store (same process as webhooks).
 * Production: replace with DB queries keyed by authenticated user id.
 */

import { getMarketplaceStore } from '@/services/marketplace/memory-store';
import { listPublishedProducts } from '@/services/marketplace/product-service';
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

export async function fetchAccountPurchases(userId: string): Promise<AccountPurchaseRow[]> {
  const store = getMarketplaceStore();
  const orders = [...store.ordersById.values()].filter(
    (o) =>
      o.userId === userId &&
      (o.status === 'paid' || o.status === 'fulfilled' || o.status === 'refunded')
  );
  orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const rows: AccountPurchaseRow[] = [];
  for (const order of orders) {
    const items = store.orderItemsByOrderId.get(order.id) ?? [];
    for (const item of items) {
      const product = store.productsById.get(item.productId);
      rows.push({
        id: item.id,
        productTitle: product?.title ?? 'Product',
        purchasedAt: order.createdAt,
        status: order.status === 'refunded' ? 'refunded' : 'fulfilled',
      });
    }
  }
  return rows;
}

/** Permanent pro file entitlements (purchase / admin). */
export async function fetchAccountOwnedFileRows(userId: string): Promise<AccountOwnedFileRow[]> {
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
  return rows;
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

export async function fetchAccountSubscriptionSummary(
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

export async function fetchAccountSubscriptionAccessPanel(
  userId: string
): Promise<AccountSubscriptionAccessPanel> {
  const summary = await fetchAccountSubscriptionSummary(userId);
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
