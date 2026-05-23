'use client';

import { getClerkPublishableKey } from '@/lib/auth/clerk-env';
import { CheckoutButtonClerk } from './CheckoutButtonClerk';
import { CheckoutButtonFallback } from './CheckoutButtonFallback';
import type { CheckoutKind } from './checkout-button-types';

export type { CheckoutKind };

type Props = {
  kind: CheckoutKind;
  productSlug?: string;
  planSlug?: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

/**
 * Paddle checkout entry. Uses Clerk `getToken()` when a publishable key is configured
 * (always under `ClerkProvider` in root layout). Otherwise cookie-only / email auth.
 */
export function CheckoutButton(props: Props) {
  if (getClerkPublishableKey()) {
    return <CheckoutButtonClerk {...props} />;
  }
  return <CheckoutButtonFallback {...props} />;
}
