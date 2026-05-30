import { getMarketplaceStore } from '@/services/marketplace/memory-store';
import { getProductById } from '@/services/marketplace/product-service';
import type { ProductEntitlementSnapshot } from '@/lib/storage/download-access';
import { fetchBackendPaidProductGrantDates } from '@/lib/account/billing-access.server';

const DEFAULT_OWNER_DOWNLOAD_EMAIL = 'nurlanrahmonqulov@gmail.com';

function normalizeMarketplaceEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Emails that may bypass **paid marketplace + gallery** gates (preview/pro) without Paddle.
 * Bypass is **only** for explicit `MARKETPLACE_OWNER_DOWNLOAD_EMAILS` (defaults to operator inbox). Admin allow-list alone does nothing here.
 */
export function getMarketplaceOwnerDownloadEmails(): string[] {
  const raw = process.env.MARKETPLACE_OWNER_DOWNLOAD_EMAILS;
  if (raw && raw.trim()) {
    return raw
      .split(/[,;\n]+/)
      .map((s) => normalizeMarketplaceEmail(s))
      .filter(Boolean);
  }
  return [normalizeMarketplaceEmail(DEFAULT_OWNER_DOWNLOAD_EMAIL)];
}

export function isMarketplaceOwnerDownloadBypass(email: string | null | undefined): boolean {
  if (!email?.trim()) return false;
  const n = normalizeMarketplaceEmail(email);
  return getMarketplaceOwnerDownloadEmails().includes(n);
}

/** Memory-store only: any purchase/admin grant on this product (preview unlock). */
function hasMemoryPurchaseOrAdminGrantForProduct(userId: string, productId: string): boolean {
  const store = getMarketplaceStore();
  const now = Date.now();
  return store.downloadAccess.some(
    (g) =>
      g.userId === userId &&
      g.productId === productId &&
      (g.source === 'purchase' || g.source === 'admin_grant') &&
      (g.expiresAt == null || new Date(g.expiresAt).getTime() > now)
  );
}

/**
 * Memory-store snapshot only (demo / legacy). Production gates should use
 * `resolveAuthenticatedFileDownload` with a backend JWT cookie so Paddle subscriptions
 * and orders apply.
 */
export function getUserEntitlementSnapshot(
  userId: string,
  productId: string,
  fileId: string
): ProductEntitlementSnapshot {
  const store = getMarketplaceStore();
  const now = Date.now();

  const hasPurchasedProduct = store.downloadAccess.some(
    (g) =>
      g.userId === userId &&
      g.productId === productId &&
      g.productFileId === fileId &&
      (g.source === 'purchase' || g.source === 'admin_grant') &&
      (g.expiresAt == null || new Date(g.expiresAt).getTime() > now)
  );

  const hasActiveSubscription = store.subscriptions.some((s) => {
    if (s.userId !== userId) return false;
    if (s.status !== 'active' && s.status !== 'trialing' && s.status !== 'past_due') return false;
    return new Date(s.currentPeriodEnd).getTime() > now;
  });

  return { hasPurchasedProduct, hasActiveSubscription };
}

export type ResolvedFileDownload =
  | { kind: 'public_preview'; publicUrl: string }
  | { kind: 'pro_entitled'; via: 'purchase' | 'owner' }
  | {
      kind: 'denied';
      reason: 'NOT_FOUND' | 'NOT_AUTHENTICATED' | 'NOT_ENTITLED' | 'NOT_PUBLISHED';
    };

/**
 * Authoritative server-side gate for file downloads (preview redirect vs pro entitlement).
 * When `accessToken` is set (backend JWT cookie), merges one-time paid orders from the API.
 */
export async function resolveAuthenticatedFileDownload(
  userId: string | null,
  userEmail: string | null | undefined,
  productId: string,
  fileId: string,
  accessToken?: string | null
): Promise<ResolvedFileDownload> {
  const product = getProductById(productId);
  if (!product || !product.isPublished) {
    return { kind: 'denied', reason: 'NOT_PUBLISHED' };
  }
  const file = product.files.find((f) => f.id === fileId);
  if (!file) {
    return { kind: 'denied', reason: 'NOT_FOUND' };
  }

  let billingPaidSlugs: Map<string, string> | null = null;

  if (userId && accessToken?.trim()) {
    billingPaidSlugs = await fetchBackendPaidProductGrantDates(accessToken.trim());
  }

  const mem = userId ? getUserEntitlementSnapshot(userId, productId, fileId) : null;
  const memProductGrant = userId ? hasMemoryPurchaseOrAdminGrantForProduct(userId, productId) : false;

  const slug = product.slug?.trim() ?? '';
  const billingOwnsProduct =
    Boolean(slug && billingPaidSlugs?.has(slug));

  const hasPurchasedFile = Boolean(mem?.hasPurchasedProduct || billingOwnsProduct);

  if (file.tier === 'preview_free') {
    if (!file.publicUrl) {
      return { kind: 'denied', reason: 'NOT_FOUND' };
    }
    if (!userId) {
      return { kind: 'denied', reason: 'NOT_AUTHENTICATED' };
    }
    if (isMarketplaceOwnerDownloadBypass(userEmail)) {
      return { kind: 'public_preview', publicUrl: file.publicUrl };
    }
    return { kind: 'public_preview', publicUrl: file.publicUrl };
  }

  if (file.tier === 'pro') {
    if (!userId) {
      return { kind: 'denied', reason: 'NOT_AUTHENTICATED' };
    }
    if (isMarketplaceOwnerDownloadBypass(userEmail)) {
      return { kind: 'pro_entitled', via: 'owner' };
    }
    if (hasPurchasedFile) {
      return { kind: 'pro_entitled', via: 'purchase' };
    }
    return { kind: 'denied', reason: 'NOT_ENTITLED' };
  }

  return { kind: 'denied', reason: 'NOT_FOUND' };
}
