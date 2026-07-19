/**
 * Public legal / trust details used by contact, footer, SEO, and policy pages.
 * Do not invent registration numbers, addresses, or entity IDs.
 */

import { SITE_NAME } from '@/lib/seo/site-config';

export const DEFAULT_PUBLIC_CONTACT_EMAIL = 'nurlanrahmonqulov@gmail.com';
export const DEFAULT_PUBLIC_CONTACT_PHONE_DISPLAY = '+998 97 566 79 96';
export const DEFAULT_PUBLIC_CONTACT_PHONE_TEL = '+998975667996';

/** Public support / contact email shown in footers and legal pages. */
export function getPublicContactEmail(): string {
  return process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || DEFAULT_PUBLIC_CONTACT_EMAIL;
}

export function getPublicContactPhoneDisplay(): string {
  return process.env.NEXT_PUBLIC_CONTACT_PHONE_DISPLAY?.trim() || DEFAULT_PUBLIC_CONTACT_PHONE_DISPLAY;
}

export function getPublicContactPhoneHref(): string {
  const raw = process.env.NEXT_PUBLIC_CONTACT_PHONE_TEL?.trim() || DEFAULT_PUBLIC_CONTACT_PHONE_TEL;
  return `tel:${raw.replace(/[^+\d]/g, '')}`;
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
