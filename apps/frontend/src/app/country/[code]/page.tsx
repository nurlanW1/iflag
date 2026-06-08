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
      <main className="marketplace-shell py-12 sm:py-14">
        <h1 className="mb-3 text-3xl font-semibold tracking-tight text-[#2a2a2a]">Flag assets — {cc}</h1>
        <p className="mb-8 leading-relaxed text-neutral-500">
          Catalog items linked to country code {cc}.
        </p>
        <h2 className="mb-4 text-base font-semibold text-[#2a2a2a]">Products</h2>
        <ul className="space-y-3 list-none pl-0">
          {products.map((p) => (
            <li key={p.id}>
              <Link
                href={`/flags/${p.slug}`}
                className="font-medium text-[var(--brand-blue)] hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]/30 rounded"
              >
                {p.title}
              </Link>
            </li>
          ))}
        </ul>
        {products.length === 0 ? (
          <p className="text-neutral-400">No products with this country code in the current catalog.</p>
        ) : null}
        <section className="mt-12 border-t border-neutral-200 pt-8" aria-labelledby="country-explore-heading">
          <h2 id="country-explore-heading" className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Explore more
          </h2>
          <ul className="flex flex-wrap gap-2 list-none pl-0">
            {PRIMARY_HUB_LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 text-xs font-medium text-neutral-700 shadow-sm transition-colors hover:border-[var(--brand-blue)]/40 hover:bg-[var(--brand-blue-soft)] hover:text-[var(--brand-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]/30"
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
