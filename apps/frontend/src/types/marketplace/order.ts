import type { ISODateString } from './common';

/**
 * Checkout/payment not implemented — statuses reserved for future use.
 */
export type OrderStatus =
  | 'draft'
  | 'pending_payment'
  | 'paid'
  | 'fulfilled'
  | 'canceled'
  | 'refunded';

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  totalCents: number;
  currency: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  /**
   * When set, `externalId` is the Lemon Squeezy order id (stringified).
   * Used for idempotent webhook fulfillment and refunds.
   */
  externalProvider?: 'lemonsqueezy';
  externalId?: string;
}
