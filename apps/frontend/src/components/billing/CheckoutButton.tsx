'use client';

import { useClerkUiEnabled } from '@/components/providers/ClerkUiProvider';
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
 * Paddle checkout entry. Uses Clerk when enabled in root layout (ClerkProvider).
 */
export function CheckoutButton(props: Props) {
  const clerkUiEnabled = useClerkUiEnabled();
  if (clerkUiEnabled) {
    return <CheckoutButtonClerk {...props} />;
  }
  return <CheckoutButtonFallback {...props} />;
}
