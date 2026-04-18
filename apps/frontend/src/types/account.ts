/**
 * Future purchase / entitlement rows — shape only; populated when commerce is wired.
 */
export interface AccountPurchaseRow {
  id: string;
  productTitle: string;
  /** ISO date string when available */
  purchasedAt: string | null;
  status: 'fulfilled' | 'pending' | 'refunded';
}

export interface AccountDownloadRow {
  id: string;
  assetLabel: string;
  /** ISO date string when available */
  downloadedAt: string | null;
  tier: 'preview' | 'full';
}

/** Last lapsed subscription (for messaging when user no longer has Pro via plan). */
export interface AccountLapsedSubscription {
  planName: string;
  /** ISO end of access / period */
  endedAt: string;
  status: 'canceled' | 'expired' | 'past_due';
}

export interface AccountSubscriptionSummary {
  planName: string | null;
  status: 'none' | 'active' | 'canceled' | 'past_due' | 'trialing';
  renewsAt: string | null;
  /** Present when user no longer has Pro via subscription but had a plan end recently. */
  lapsed: AccountLapsedSubscription | null;
}

/**
 * One permanently owned file (purchase or admin grant). Stays until revoked/refunded server-side.
 */
export interface AccountOwnedFileRow {
  accessId: string;
  productId: string;
  productSlug: string;
  productTitle: string;
  fileId: string;
  fileName: string;
  format: string;
  qualityLabel: string;
  /** When entitlement was granted (webhook / fulfillment). */
  grantedAt: string;
}

/** Free preview asset (public URL); listed separately from paid ownership. */
export interface AccountFreePreviewRow {
  productId: string;
  productSlug: string;
  productTitle: string;
  fileId: string;
  fileName: string;
  format: string;
  qualityLabel: string;
}

export interface AccountSubscriptionAccessPanel {
  hasProViaSubscription: boolean;
  planName: string | null;
  status: AccountSubscriptionSummary['status'];
  validThrough: string | null;
  /** Shown when there is no longer active/trialing access but a recent plan ended. */
  lapsed: AccountLapsedSubscription | null;
}
