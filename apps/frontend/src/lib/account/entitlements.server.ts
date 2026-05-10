import { getMarketplaceStore } from '@/services/marketplace/memory-store';
import { getProductById } from '@/services/marketplace/product-service';
import type { ProductEntitlementSnapshot } from '@/lib/storage/download-access';

const DEFAULT_OWNER_DOWNLOAD_EMAIL = 'nurlanrahmonqulov@gmail.com';

function normalizeMarketplaceEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Emails that may download **pro** marketplace files without purchase/subscription.
 * Set `MARKETPLACE_OWNER_DOWNLOAD_EMAILS` to a comma-separated list; defaults to the site owner.
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

/**
 * Build entitlement snapshot for **one concrete file** (server-side).
 * - Purchase: exact `DownloadAccess` row for that file, non-expired, purchase/admin_grant.
 * - Subscription: active or trialing with period end in the future → all pro files in catalog.
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
    if (s.status !== 'active' && s.status !== 'trialing') return false;
    return new Date(s.currentPeriodEnd).getTime() > now;
  });

  return { hasPurchasedProduct, hasActiveSubscription };
}

export type ResolvedFileDownload =
  | { kind: 'public_preview'; publicUrl: string }
  | { kind: 'pro_entitled'; via: 'purchase' | 'subscription' | 'owner' }
  | {
      kind: 'denied';
      reason: 'NOT_FOUND' | 'NOT_AUTHENTICATED' | 'NOT_ENTITLED' | 'NOT_PUBLISHED';
    };

/**
 * Authoritative server-side gate for file downloads (preview redirect vs pro entitlement).
 */
export function resolveAuthenticatedFileDownload(
  userId: string | null,
  userEmail: string | null | undefined,
  productId: string,
  fileId: string
): ResolvedFileDownload {
  const product = getProductById(productId);
  if (!product || !product.isPublished) {
    return { kind: 'denied', reason: 'NOT_PUBLISHED' };
  }
  const file = product.files.find((f) => f.id === fileId);
  if (!file) {
    return { kind: 'denied', reason: 'NOT_FOUND' };
  }

  if (file.tier === 'preview_free') {
    if (file.publicUrl) {
      return { kind: 'public_preview', publicUrl: file.publicUrl };
    }
    return { kind: 'denied', reason: 'NOT_FOUND' };
  }

  if (file.tier === 'pro') {
    if (!userId) {
      return { kind: 'denied', reason: 'NOT_AUTHENTICATED' };
    }
    if (isMarketplaceOwnerDownloadBypass(userEmail)) {
      return { kind: 'pro_entitled', via: 'owner' };
    }
    const snap = getUserEntitlementSnapshot(userId, productId, fileId);
    if (snap.hasActiveSubscription) {
      return { kind: 'pro_entitled', via: 'subscription' };
    }
    if (snap.hasPurchasedProduct) {
      return { kind: 'pro_entitled', via: 'purchase' };
    }
    return { kind: 'denied', reason: 'NOT_ENTITLED' };
  }

  return { kind: 'denied', reason: 'NOT_FOUND' };
}
