import Link from 'next/link';
import type { Metadata } from 'next';
import HomePageClient from '@/components/HomePageClient';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbJsonLd } from '@/lib/seo/structured-data';
import { SITE_DESCRIPTION, SITE_NAME, getSiteOrigin } from '@/lib/seo/site-config';
import { PRIMARY_HUB_LINKS } from '@/lib/seo/internal-links';

export const metadata: Metadata = {
  title: 'Flag marketplace',
  description: SITE_DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: {
    title: `${SITE_NAME} — Flag marketplace`,
    description: SITE_DESCRIPTION,
    url: getSiteOrigin(),
  },
};

export default function HomePage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: 'Home', path: '/' }])} />
      <nav className="sr-only" aria-label="Site sections">
        <ul>
          {PRIMARY_HUB_LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href}>{l.label}</Link>
            </li>
          ))}
        </ul>
      </nav>
      <HomePageClient />
    </>
  );
}
