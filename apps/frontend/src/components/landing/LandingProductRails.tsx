'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { SectionReveal } from '@/components/motion/SectionReveal';
import { MarketplaceProductCard } from '@/components/marketplace/MarketplaceProductCard';
import { marketplaceProductCardGridClasses } from '@/lib/ui/marketplace-layout';
import type { PublicProduct } from '@/lib/marketplace/product-mapper';
import type { Category } from '@/types/marketplace';

type ProductsApi = {
  data: PublicProduct[];
};

function ProductRailSection({
  id,
  title,
  subtitle,
  products,
  loading,
  viewAllHref,
  viewAllLabel,
  categoryNames,
}: {
  id: string;
  title: string;
  subtitle: string;
  products: PublicProduct[];
  loading: boolean;
  viewAllHref: string;
  viewAllLabel: string;
  categoryNames: Record<string, string>;
}) {
  return (
    <section className="border-t border-gray-100 bg-white py-16 md:py-20 lg:py-24" aria-labelledby={id}>
      <div className="marketplace-shell">
        <SectionReveal
          hidden={{ opacity: 0, y: 14 }}
          visible={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-10 flex flex-col gap-4 sm:mb-12 sm:flex-row sm:items-end sm:justify-between"
        >
          <div className="max-w-3xl text-left">
            <h2 id={id} className="text-3xl font-black tracking-tight text-gray-950 sm:text-4xl lg:text-[2.125rem]">
              {title}
            </h2>
            <p className="mt-2 max-w-2xl text-pretty text-base leading-relaxed text-gray-600 sm:text-lg">{subtitle}</p>
          </div>
          <Link
            href={viewAllHref}
            className="inline-flex min-h-[3rem] shrink-0 items-center justify-center rounded-xl border-2 border-gray-200 px-8 py-3 text-base font-semibold text-gray-900 shadow-sm transition hover:border-[#009ab6] hover:text-[#009ab6]"
          >
            {viewAllLabel}
          </Link>
        </SectionReveal>

        {loading ? (
          <ul className={marketplaceProductCardGridClasses}>
            {Array.from({ length: 8 }).map((_, i) => (
              <li key={i}>
                <div className="h-[22rem] animate-pulse rounded-2xl border border-gray-100 bg-gray-100/80 sm:h-[24rem]" />
              </li>
            ))}
          </ul>
        ) : products.length === 0 ? (
          <p className="text-center text-base text-gray-500">No catalog items loaded yet.</p>
        ) : (
          <ul className={marketplaceProductCardGridClasses}>
            {products.map((p) => (
              <li key={p.id} className="min-h-0">
                <MarketplaceProductCard
                  product={p}
                  categoryName={categoryNames[p.categoryId] ?? 'Flags'}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/** Trending, new uploads, premium — pulls from marketplace API (browse parity). */
export function LandingProductRails() {
  const [cats, setCats] = useState<Category[]>([]);
  const [newest, setNewest] = useState<PublicProduct[]>([]);
  const [popular, setPopular] = useState<PublicProduct[]>([]);
  const [premium, setPremium] = useState<PublicProduct[]>([]);
  const [loadingRails, setLoadingRails] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [cRes, nRes, pRes, premRes] = await Promise.all([
          fetch('/api/marketplace/categories'),
          fetch('/api/marketplace/products?page=1&limit=8&sort=newest'),
          fetch('/api/marketplace/products?page=1&limit=8&sort=popular'),
          fetch('/api/marketplace/products?page=1&limit=8&sort=newest&tier=pro'),
        ]);

        let categories: Category[] = [];
        if (cRes.ok) {
          const j = await cRes.json();
          categories = j.data ?? [];
        }
        const pick = async (r: Response) => {
          if (!r.ok) return [];
          const j = (await r.json()) as ProductsApi;
          return j.data ?? [];
        };
        const n = await pick(nRes);
        const po = await pick(pRes);
        const pr = await pick(premRes);

        if (!cancelled) {
          setCats(categories);
          setNewest(n);
          setPopular(po);
          setPremium(pr);
        }
      } catch {
        if (!cancelled) {
          setNewest([]);
          setPopular([]);
          setPremium([]);
        }
      } finally {
        if (!cancelled) setLoadingRails(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const categoryMap = useMemo(
    () => Object.fromEntries(cats.filter((c) => c.isApproved).map((c) => [c.id, c.name])),
    [cats]
  );

  return (
    <>
      <ProductRailSection
        id="rail-trending"
        title="Trending flags"
        subtitle="What creators are discovering right now in the marketplace."
        products={popular}
        loading={loadingRails}
        viewAllHref="/browse?sort=popular"
        viewAllLabel="View all trending"
        categoryNames={categoryMap}
      />
      <ProductRailSection
        id="rail-new"
        title="New uploads"
        subtitle="Freshly added vectors, renders, and video assets ready to license."
        products={newest}
        loading={loadingRails}
        viewAllHref="/browse?sort=newest"
        viewAllLabel="See new assets"
        categoryNames={categoryMap}
      />
      <ProductRailSection
        id="rail-premium"
        title="Premium assets"
        subtitle="Commercial-ready downloads with Paddle checkout on the pricing page."
        products={premium}
        loading={loadingRails}
        viewAllHref="/browse?tier=pro"
        viewAllLabel="Explore premium"
        categoryNames={categoryMap}
      />
    </>
  );
}
