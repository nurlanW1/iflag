/**
 * Legal / trust page placeholders — replace with your finalized details.
 * Do not invent registration numbers, addresses, or entity IDs.
 *
 * Optional: set `NEXT_PUBLIC_CONTACT_EMAIL` for mailto links site-wide.
 */

import { SITE_NAME } from '@/lib/seo/site-config';

export const LEGAL_TEMPLATE_NOTICE =
  'Bracketed text such as [PLACEHOLDER: …] must be replaced with your accurate details. This template is not legal advice; have qualified counsel review it for your markets and products.';

/** Public support / contact email shown in footers and legal pages. */
export function getPublicContactEmail(): string {
  const v = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();
  return v || 'support@flagswing.com';
}

export const P = {
  OPERATOR_LEGAL_NAME: process.env.NEXT_PUBLIC_OPERATOR_LEGAL_NAME || SITE_NAME,
  TRADING_NAME: SITE_NAME,
  JURISDICTION: process.env.NEXT_PUBLIC_JURISDICTION || 'Uzbekistan',
  REGISTERED_OFFICE: process.env.NEXT_PUBLIC_REGISTERED_OFFICE || '',
  EFFECTIVE_DATE: '4 June 2026',
  /** Merchant of Record / payment partner shown in footer & legal trust copy. */
  PAYMENT_PROCESSOR: 'Paddle',
  SUPER_AUTHORITY: '',
  VAT_OR_TAX_ID: '',
} as const;
