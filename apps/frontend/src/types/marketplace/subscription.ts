import type { ISODateString } from './common';

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  priceCents: number;
  currency: string;
  durationDays: number;
  isActive: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'expired'
  | 'past_due'
  | 'trialing';

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: SubscriptionStatus;
  currentPeriodStart: ISODateString;
  currentPeriodEnd: ISODateString;
  cancelAtPeriodEnd: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  /** Lemon Squeezy subscription id — required for webhook upserts / portal links. */
  lemonSqueezyId?: string | null;
}
