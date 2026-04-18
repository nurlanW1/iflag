import type { ISODateString } from './common';

export type DownloadGrantSource = 'purchase' | 'subscription' | 'admin_grant';

/**
 * Entitlement row: which user may download which file and why.
 * expiresAt null => permanent (typical for one-time purchase).
 */
export interface DownloadAccess {
  id: string;
  userId: string;
  productId: string;
  productFileId: string;
  source: DownloadGrantSource;
  orderId: string | null;
  subscriptionId: string | null;
  grantedAt: ISODateString;
  expiresAt: ISODateString | null;
}
