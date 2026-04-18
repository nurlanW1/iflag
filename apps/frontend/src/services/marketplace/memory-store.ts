import type { Cart, Category, DownloadAccess, Order, OrderItem, Product, Subscription, SubscriptionPlan, User } from '@/types/marketplace';
import {
  seedCarts,
  seedCategories,
  seedDownloadAccess,
  seedOrderItems,
  seedOrders,
  seedProducts,
  seedSubscriptionPlans,
  seedSubscriptions,
  seedUsers,
} from './seed';

/**
 * In-memory stand-in for a database. Swappable for Postgres repository later.
 */
export interface MarketplaceMemoryStore {
  categories: Map<string, Category>;
  productsById: Map<string, Product>;
  productsBySlug: Map<string, Product>;
  usersById: Map<string, User>;
  cartsById: Map<string, Cart>;
  ordersById: Map<string, Order>;
  orderItemsByOrderId: Map<string, OrderItem[]>;
  downloadAccess: DownloadAccess[];
  plansById: Map<string, SubscriptionPlan>;
  subscriptions: Subscription[];
}

function buildStore(): MarketplaceMemoryStore {
  const categories = new Map(seedCategories.map((c) => [c.id, c]));
  const productsById = new Map<string, Product>();
  const productsBySlug = new Map<string, Product>();
  for (const p of seedProducts) {
    productsById.set(p.id, p);
    productsBySlug.set(p.slug, p);
  }
  const usersById = new Map(seedUsers.map((u) => [u.id, u]));
  const cartsById = new Map(seedCarts.map((c) => [c.id, c]));
  const ordersById = new Map(seedOrders.map((o) => [o.id, o]));
  const orderItemsByOrderId = new Map<string, OrderItem[]>();
  for (const item of seedOrderItems) {
    const list = orderItemsByOrderId.get(item.orderId) ?? [];
    list.push(item);
    orderItemsByOrderId.set(item.orderId, list);
  }
  const plansById = new Map(seedSubscriptionPlans.map((p) => [p.id, p]));

  return {
    categories,
    productsById,
    productsBySlug,
    usersById,
    cartsById,
    ordersById,
    orderItemsByOrderId,
    downloadAccess: [...seedDownloadAccess],
    plansById,
    subscriptions: [...seedSubscriptions],
  };
}

let store: MarketplaceMemoryStore = buildStore();

export function getMarketplaceStore(): MarketplaceMemoryStore {
  return store;
}

/** Tests or dev-only resets */
export function resetMarketplaceStore(): void {
  store = buildStore();
}
