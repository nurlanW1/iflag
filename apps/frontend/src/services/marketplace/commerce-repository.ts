/**
 * Mutations for orders, download grants, and subscriptions (in-memory store).
 * Swap for Postgres transactions in production; keep function names stable for webhooks.
 *
 * Subscription "Pro" access is modeled on the Subscription row only (no per-file rows),
 * so entitlement checks stay O(1) and scale to large catalogs.
 */

import type { DownloadAccess, Order, OrderItem, Product, Subscription } from '@/types/marketplace';
import { getMarketplaceStore } from '@/services/marketplace/memory-store';
import { getProductBySlug } from '@/services/marketplace/product-service';
import type { SubscriptionPlan } from '@/types/marketplace';

function nowIso(): string {
  return new Date().toISOString();
}

export function findOrderByExternalLemonId(externalId: string): Order | null {
  const { ordersById } = getMarketplaceStore();
  for (const o of ordersById.values()) {
    if (o.externalProvider === 'lemonsqueezy' && o.externalId === externalId) return o;
  }
  return null;
}

export function revokeDownloadGrantsForOrder(orderId: string): void {
  const store = getMarketplaceStore();
  store.downloadAccess = store.downloadAccess.filter((g) => g.orderId !== orderId);
}

function grantProFilesForProductPurchase(params: {
  userId: string;
  product: Product;
  orderId: string;
}): void {
  const store = getMarketplaceStore();
  const ts = nowIso();
  for (const file of params.product.files) {
    if (file.tier !== 'pro') continue;
    const exists = store.downloadAccess.some(
      (g) =>
        g.userId === params.userId &&
        g.productId === params.product.id &&
        g.productFileId === file.id &&
        g.orderId === params.orderId
    );
    if (exists) continue;
    const row: DownloadAccess = {
      id: crypto.randomUUID(),
      userId: params.userId,
      productId: params.product.id,
      productFileId: file.id,
      source: 'purchase',
      orderId: params.orderId,
      subscriptionId: null,
      grantedAt: ts,
      expiresAt: null,
    };
    store.downloadAccess.push(row);
  }
}

export function fulfillOneTimeOrderFromLemonSqueezy(params: {
  userId: string;
  lemonOrderId: string;
  productSlug: string;
  totalCents: number;
  currency: string;
}): Order {
  const store = getMarketplaceStore();
  const existing = findOrderByExternalLemonId(params.lemonOrderId);
  if (existing) return existing;

  const product = getProductBySlug(params.productSlug);
  if (!product) {
    throw new Error(`Unknown product slug: ${params.productSlug}`);
  }

  const ts = nowIso();
  const order: Order = {
    id: crypto.randomUUID(),
    userId: params.userId,
    status: 'paid',
    totalCents: params.totalCents,
    currency: params.currency || 'USD',
    createdAt: ts,
    updatedAt: ts,
    externalProvider: 'lemonsqueezy',
    externalId: params.lemonOrderId,
  };
  store.ordersById.set(order.id, order);

  const item: OrderItem = {
    id: crypto.randomUUID(),
    orderId: order.id,
    productId: product.id,
    quantity: 1,
    unitPriceCents: params.totalCents,
    createdAt: ts,
  };
  const items = store.orderItemsByOrderId.get(order.id) ?? [];
  items.push(item);
  store.orderItemsByOrderId.set(order.id, items);

  grantProFilesForProductPurchase({ userId: params.userId, product, orderId: order.id });
  return order;
}

export function markOrderRefundedByLemonId(lemonOrderId: string): void {
  const order = findOrderByExternalLemonId(lemonOrderId);
  if (!order) return;
  order.status = 'refunded';
  order.updatedAt = nowIso();
  revokeDownloadGrantsForOrder(order.id);
}

function findPlanBySlug(slug: string): SubscriptionPlan | null {
  const { plansById } = getMarketplaceStore();
  for (const p of plansById.values()) {
    if (p.slug === slug) return p;
  }
  return null;
}

export function mapLsSubscriptionStatus(lsStatus: string | undefined): Subscription['status'] {
  const s = (lsStatus || '').toLowerCase();
  if (s === 'active') return 'active';
  if (s === 'on_trial') return 'trialing';
  if (s === 'cancelled') return 'canceled';
  if (s === 'expired') return 'expired';
  if (s === 'past_due' || s === 'unpaid') return 'past_due';
  if (s === 'paused') return 'canceled';
  return 'expired';
}

export function upsertSubscriptionFromLemonSqueezy(params: {
  userId: string;
  lemonSubscriptionId: string;
  planSlug: string;
  lsStatus: string | undefined;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}): Subscription {
  const store = getMarketplaceStore();
  const plan = findPlanBySlug(params.planSlug);
  if (!plan) {
    throw new Error(`Unknown plan slug: ${params.planSlug}`);
  }

  const status = mapLsSubscriptionStatus(params.lsStatus);
  const existingIdx = store.subscriptions.findIndex(
    (s) => s.lemonSqueezyId === params.lemonSubscriptionId
  );
  const ts = nowIso();

  if (existingIdx >= 0) {
    const sub = store.subscriptions[existingIdx]!;
    sub.status = status;
    sub.planId = plan.id;
    sub.currentPeriodStart = params.currentPeriodStart;
    sub.currentPeriodEnd = params.currentPeriodEnd;
    sub.cancelAtPeriodEnd = params.cancelAtPeriodEnd;
    sub.updatedAt = ts;
    return sub;
  }

  const sub: Subscription = {
    id: crypto.randomUUID(),
    userId: params.userId,
    planId: plan.id,
    status,
    currentPeriodStart: params.currentPeriodStart,
    currentPeriodEnd: params.currentPeriodEnd,
    cancelAtPeriodEnd: params.cancelAtPeriodEnd,
    createdAt: ts,
    updatedAt: ts,
    lemonSqueezyId: params.lemonSubscriptionId,
  };
  store.subscriptions.push(sub);
  return sub;
}
