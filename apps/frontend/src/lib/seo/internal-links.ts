/**
 * Curated internal links for SEO (use in server pages or visible “related” blocks).
 * Expand when new hub routes are added.
 */
export const PRIMARY_HUB_LINKS = [
  { href: '/pricing', label: 'Pricing' },
  { href: '/browse', label: 'Browse catalog' },
  { href: '/assets', label: 'All assets' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/categories/country-flags', label: 'Country flags category' },
  /** Matches seed / DB slug `international-organizations` */
  { href: '/categories/international-organizations', label: 'Organization flags' },
  { href: '/categories/historical-flags', label: 'Historical flags' },
] as const;
