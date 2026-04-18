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
  return v || '[PLACEHOLDER: contact@yourdomain.com]';
}

export const P = {
  OPERATOR_LEGAL_NAME: '[PLACEHOLDER: Legal name of the entity operating the marketplace]',
  TRADING_NAME: `[PLACEHOLDER: Trading / brand name — e.g. “${SITE_NAME}”]`,
  JURISDICTION: '[PLACEHOLDER: Country or region of establishment / primary governing law — customize]',
  REGISTERED_OFFICE:
    '[PLACEHOLDER: Registered office or principal business address — obtain from your records; do not invent]',
  EFFECTIVE_DATE: '[PLACEHOLDER: Effective date of this document — e.g. 17 April 2026]',
  PAYMENT_PROCESSOR: '[PLACEHOLDER: e.g. Lemon Squeezy — payment partner name]',
  SUPER_AUTHORITY:
    '[PLACEHOLDER: Supervisory or complaint body if applicable — e.g. EU/UK data authority link]',
  VAT_OR_TAX_ID: '[PLACEHOLDER: Tax / VAT ID if you publish one — or remove this sentence]',
} as const;
