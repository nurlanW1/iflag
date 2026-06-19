export const AFFILIATE_LINKS = {
  magnific: 'https://referral.magnific.com/mzUYO3C',
  shutterstock_base: 'https://www.shutterstock.com',
} as const;

export function getFreepikSearchUrl(query: string): string {
  return `https://www.freepik.com/search?format=search&query=${encodeURIComponent(query)}`;
}
