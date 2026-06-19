export const AFFILIATE_LINKS = {
  magnific: 'https://referral.magnific.com/mzUYO3C',
  shutterstock_base: 'https://www.shutterstock.com',
} as const;

export function getMagnificSearchUrl(query: string): string {
  return (
    `${AFFILIATE_LINKS.magnific}?redirect=` +
    encodeURIComponent(
      `https://www.freepik.com/search?format=search&query=${encodeURIComponent(query)}`,
    )
  );
}
