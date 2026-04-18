import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import { listPublishedProducts } from '@/services/marketplace';
import { PRIMARY_HUB_LINKS } from '@/lib/seo/internal-links';
import { normalizeCountryCode } from '@/lib/seo/slug';
import { getSiteOrigin, SITE_NAME } from '@/lib/seo/site-config';
import { breadcrumbJsonLd, countryCollectionJsonLd } from '@/lib/seo/structured-data';

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const cc = normalizeCountryCode(code);
  if (!cc) {
    return { title: 'Not found' };
  }
  const title = `Flags — ${cc}`;
  const description = `Browse flag assets for ${cc} on ${SITE_NAME}.`;
  const canonical = `/country/${cc.toLowerCase()}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url: `${getSiteOrigin()}${canonical}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${SITE_NAME}`,
      description,
    },
  };
}

export default async function CountryHubPage({ params }: Props) {
  const { code } = await params;
  const cc = normalizeCountryCode(code);
  if (!cc) {
    notFound();
  }

  const products = listPublishedProducts().filter((p) => {
    const raw = p.countryCode?.trim().toUpperCase();
    if (!raw) return false;
    const alpha2 = raw.length === 2 ? raw : raw.slice(0, 2);
    return alpha2 === cc;
  });

  return (
    <>
      <JsonLd
        data={[
          countryCollectionJsonLd(cc, products.length),
          breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: `Country ${cc}`, path: `/country/${cc.toLowerCase()}` },
          ]),
        ]}
      />
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-black text-black mb-4">Flag assets — {cc}</h1>
        <p className="text-black/70 mb-8 leading-relaxed">
          Catalog items linked to country code {cc}. Data depends on your connected backend or seed
          catalog.
        </p>
        <h2 className="text-xl font-bold text-black mb-4">Products</h2>
        <ul className="space-y-3 list-none pl-0">
          {products.map((p) => (
            <li key={p.id}>
              <Link
                href={`/flags/${p.slug}`}
                className="text-[#009ab6] font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-[#009ab6]/30 rounded"
              >
                {p.title}
              </Link>
            </li>
          ))}
        </ul>
        {products.length === 0 ? (
          <p className="text-black/60">No products with this country code in the current catalog.</p>
        ) : null}
        <section className="mt-12 border-t border-gray-200 pt-8" aria-labelledby="country-explore-heading">
          <h2 id="country-explore-heading" className="text-lg font-bold text-black mb-3">
            Explore more
          </h2>
          <ul className="flex flex-wrap gap-3 text-sm list-none pl-0">
            {PRIMARY_HUB_LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-[#009ab6] hover:underline focus:outline-none focus:ring-2 focus:ring-[#009ab6]/30 rounded"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
