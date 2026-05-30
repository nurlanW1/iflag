import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/seo/JsonLd';
import { ProductBrowseSection } from '@/components/marketplace/ProductBrowseSection';
import { CountryHubBrowseSection } from '@/components/gallery/CountryHubBrowseSection';
import { FlagVideoBrowseSection } from '@/components/gallery/FlagVideoBrowseSection';
import {
  categoryUsesCountryHubGrid,
  categoryUsesFlagVideoGallery,
  galleryApiPathForCategory,
} from '@/lib/marketplace/category-country-hub-api';
import { visualsForCategoryKind } from '@/lib/marketplace/category-visuals';
import { getCategoryBySlug, listPublishedProducts } from '@/services/marketplace';
import { PRIMARY_HUB_LINKS } from '@/lib/seo/internal-links';
import { isValidPublicSlug } from '@/lib/seo/slug';
import { getSiteOrigin, SITE_NAME } from '@/lib/seo/site-config';
import { breadcrumbJsonLd, categoryCollectionJsonLd } from '@/lib/seo/structured-data';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!isValidPublicSlug(slug)) {
    return { title: 'Not found' };
  }
  const category = getCategoryBySlug(slug);
  if (!category || !category.isApproved) {
    return { title: 'Not found' };
  }
  const title = `${category.name} — browse flags`;
  const description =
    category.description || `Browse ${category.name.toLowerCase()} on ${SITE_NAME}.`;
  const canonical = `/categories/${category.slug}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${category.name} | ${SITE_NAME}`,
      description,
      url: `${getSiteOrigin()}${canonical}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${category.name} | ${SITE_NAME}`,
      description,
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  if (!isValidPublicSlug(slug)) {
    notFound();
  }
  const category = getCategoryBySlug(slug);
  if (!category || !category.isApproved) {
    notFound();
  }

  const useFlagVideos = categoryUsesFlagVideoGallery(category);
  const useCountryHubs = !useFlagVideos && categoryUsesCountryHubGrid(category);
  const products =
    useFlagVideos || useCountryHubs ? [] : listPublishedProducts({ categoryId: category.id });
  const vis = visualsForCategoryKind(category.kind);
  const Icon = vis.Icon;

  return (
    <>
      <JsonLd
        data={[
          categoryCollectionJsonLd(category, products.length),
          breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: category.name, path: `/categories/${category.slug}` },
          ]),
        ]}
      />
      <main className="marketplace-shell py-12 sm:py-14">
        <article>
          <header className="mb-8 flex flex-col gap-5 border-b border-neutral-200 pb-10 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex max-w-3xl flex-col gap-4 sm:flex-row sm:gap-6">
              <span
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-sm ${vis.accent}`}
              >
                <Icon className="h-8 w-8" aria-hidden strokeWidth={2} />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">{vis.chip}</p>
                <h1 className="mt-1 text-3xl font-black tracking-tight text-neutral-950 sm:text-4xl">{category.name}</h1>
                {category.description ? (
                  <p className="mt-3 text-pretty text-base leading-relaxed text-neutral-600">{category.description}</p>
                ) : null}
              </div>
            </div>
          </header>
          {useFlagVideos ? (
            <FlagVideoBrowseSection />
          ) : useCountryHubs ? (
            <CountryHubBrowseSection fetchPath={galleryApiPathForCategory(category)} />
          ) : (
            <Suspense fallback={<p className="text-black/60">Loading catalog…</p>}>
              <ProductBrowseSection fixedCategorySlug={category.slug} syncUrl={false} />
            </Suspense>
          )}
          <section className="mt-12 border-t border-gray-200 pt-8" aria-labelledby="related-hubs-heading">
            <h2 id="related-hubs-heading" className="text-lg font-bold text-black mb-3">
              Explore more
            </h2>
            <ul className="flex flex-wrap gap-3 text-sm list-none pl-0">
              {PRIMARY_HUB_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-[#2563eb] hover:underline focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30 rounded"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </article>
      </main>
    </>
  );
}
