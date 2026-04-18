/**
 * Access control for **pro** file downloads — entitlement snapshot is filled later
 * (e.g. LemonSqueezy webhooks → DB → API). No payment provider calls here.
 */

export interface ProductEntitlementSnapshot {
  /** User has a permanent grant for this specific file (purchase or admin). */
  hasPurchasedProduct: boolean;
  /** Active/trialing subscription unlocking pro tier for the catalog. */
  hasActiveSubscription: boolean;
}

export interface ProDownloadAuthContext {
  userId: string;
  productId: string;
  fileId: string;
  entitlement: ProductEntitlementSnapshot;
}

export type ProDownloadGateResult =
  | { allowed: true }
  | { allowed: false; reason: 'NOT_AUTHENTICATED' | 'NOT_ENTITLED' | 'UNKNOWN_FILE' };

/**
 * Pure policy check — call **after** you know the user is authenticated.
 * `entitlement` must be **file-scoped** (see `getUserEntitlementSnapshot` in entitlements.server.ts).
 */
export function validateProDownloadAccess(ctx: ProDownloadAuthContext): ProDownloadGateResult {
  if (!ctx.userId) {
    return { allowed: false, reason: 'NOT_AUTHENTICATED' };
  }
  if (ctx.entitlement.hasPurchasedProduct || ctx.entitlement.hasActiveSubscription) {
    return { allowed: true };
  }
  return { allowed: false, reason: 'NOT_ENTITLED' };
}
