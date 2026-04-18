import Link from 'next/link';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import { ProductBrowseSection } from '@/components/marketplace/ProductBrowseSection';
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

  const products = listPublishedProducts({ categoryId: category.id });

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
      <main className="max-w-4xl mx-auto px-4 py-12">
        <article>
          <h1 className="text-3xl font-black text-black mb-4">{category.name}</h1>
          {category.description ? (
            <p className="text-black/70 mb-8 leading-relaxed">{category.description}</p>
          ) : null}
          <h2 className="text-xl font-bold text-black mb-4">Products</h2>
          <Suspense fallback={<p className="text-black/60">Loading catalog…</p>}>
            <ProductBrowseSection fixedCategorySlug={category.slug} syncUrl={false} />
          </Suspense>
          <section className="mt-12 border-t border-gray-200 pt-8" aria-labelledby="related-hubs-heading">
            <h2 id="related-hubs-heading" className="text-lg font-bold text-black mb-3">
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
        </article>
      </main>
    </>
  );
}
