/**
 * Demo commerce fixtures (users, carts, orders) + catalog loading.
 *
 * Product and category data live under `content/catalog/` (JSON) for a file-based CMS workflow.
 * Swap `loadCatalogFromDisk()` for a database repository later — keep `compileCatalogToProducts` / `rowToProduct`.
 */

import { loadCatalogFromDisk } from '@/services/marketplace/catalog/load-catalog';
import type {
  Cart,
  Category,
  DownloadAccess,
  Order,
  OrderItem,
  Product,
  Subscription,
  SubscriptionPlan,
  User,
} from '@/types/marketplace';

const now = '2026-01-15T12:00:00.000Z';

const { categories: loadedCategories, products: loadedProducts } = loadCatalogFromDisk();

/** ——— Fixed IDs for reproducible mocks ——— */
export const SEED_IDS = {
  catCountry: '11111111-1111-4111-8111-111111111101',
  catHistorical: '11111111-1111-4111-8111-111111111102',
  catOrg: '11111111-1111-4111-8111-111111111103',
  catOther: '11111111-1111-4111-8111-111111111104',
  productUs: '22222222-2222-4222-8222-222222222201',
  productUn: '22222222-2222-4222-8222-222222222202',
  userDemo: '33333333-3333-4333-8333-333333333301',
  planMonthly: '44444444-4444-4444-8444-444444444401',
  cartDemo: '55555555-5555-4555-8555-555555555501',
  orderDemo: '66666666-6666-4666-8666-666666666601',
} as const;

export const seedCategories: Category[] = loadedCategories;

export const seedProducts: Product[] = loadedProducts;

export const seedUsers: User[] = [
  {
    id: SEED_IDS.userDemo,
    email: 'demo@example.com',
    displayName: 'Demo User',
    createdAt: now,
    updatedAt: now,
  },
];

/** Illustrates permanent access after purchase (checkout not implemented). */
export const seedDownloadAccess: DownloadAccess[] = [
  {
    id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbb001',
    userId: SEED_IDS.userDemo,
    productId: SEED_IDS.productUs,
    productFileId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0002',
    source: 'purchase',
    orderId: SEED_IDS.orderDemo,
    subscriptionId: null,
    grantedAt: now,
    expiresAt: null,
  },
];

export const seedSubscriptionPlans: SubscriptionPlan[] = [
  {
    id: SEED_IDS.planMonthly,
    name: 'Pro Monthly',
    slug: 'pro-monthly',
    priceCents: 2999,
    currency: 'USD',
    durationDays: 30,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
];

export const seedSubscriptions: Subscription[] = [];

export const seedOrders: Order[] = [
  {
    id: SEED_IDS.orderDemo,
    userId: SEED_IDS.userDemo,
    status: 'paid',
    totalCents: 899,
    currency: 'USD',
    createdAt: now,
    updatedAt: now,
  },
];

export const seedOrderItems: OrderItem[] = [
  {
    id: 'cccccccc-cccc-4ccc-8ccc-cccccccc0001',
    orderId: SEED_IDS.orderDemo,
    productId: SEED_IDS.productUs,
    quantity: 1,
    unitPriceCents: 899,
    createdAt: now,
  },
];

export const seedCarts: Cart[] = [
  {
    id: SEED_IDS.cartDemo,
    userId: SEED_IDS.userDemo,
    sessionId: null,
    lines: [{ productId: SEED_IDS.productUn, quantity: 1 }],
    updatedAt: now,
  },
];
