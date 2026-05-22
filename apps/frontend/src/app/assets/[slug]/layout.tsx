import type { ReactNode } from 'react';

/** SEO + JSON-LD live on `page.tsx` for marketplace assets; legacy CMS pages opt in via their own markup. */
export default function AssetSlugLayout({ children }: { children: ReactNode }) {
  return children;
}
