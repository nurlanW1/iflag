'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { PRICING_MARKETING } from '@/lib/marketing/pricing-config';
import { SectionReveal } from '@/components/motion/SectionReveal';
import { MarketplaceProductCard } from '@/components/marketplace/MarketplaceProductCard';
import { marketplaceProductCardGridClasses } from '@/lib/ui/marketplace-layout';
import type { PublicProduct } from '@/lib/marketplace/product-mapper';
import type { Category } from '@/types/marketplace';
import {
  railwayPublishedFlagsToGroupedPublicProducts,
  type RailwayPublishedFlagAsset,
} from '@/lib/marketplace/railway-assets-mapper';

type ProductsApi = {
  data: PublicProduct[];
};

import { getClientBackendApiBaseUrl } from '@/lib/auth/backend-url';

async function mapMarketplacePick(r: Response): Promise<PublicProduct[]> {
  if (!r.ok) return [];
  const j = (await r.json()) as ProductsApi;
  return j.data ?? [];
}

async function fetchRailPublishedFlags(fullUrl: string): Promise<PublicProduct[]> {
  const res = await fetch(fullUrl, { cache: 'no-store' });
  if (!res.ok) return [];
  const j = (await res.json()) as { data?: RailwayPublishedFlagAsset[] };
  return railwayPublishedFlagsToGroupedPublicProducts(j.data ?? []);
}

async function catalogStripFromRailThenMarket(
  railwayUrl: string | null,
  marketplaceUrl: string
): Promise<PublicProduct[]> {
  if (!railwayUrl) {
    const r = await fetch(marketplaceUrl, { cache: 'no-store' });
    return mapMarketplacePick(r);
  }
  const mapped = await fetchRailPublishedFlags(railwayUrl);
  if (mapped.length > 0) return mapped;
  const r = await fetch(marketplaceUrl, { cache: 'no-store' });
  return mapMarketplacePick(r);
}

function ProductRailSection({
  id,
  title,
  subtitle,
  products,
  loading,
  viewAllHref,
  viewAllLabel,
  categoryNames,
  surface = 'white',
}: {
  id: string;
  title: string;
  subtitle: string;
  products: PublicProduct[];
  loading: boolean;
  viewAllHref: string;
  viewAllLabel: string;
  categoryNames: Record<string, string>;
  surface?: 'white' | 'mist';
}) {
  const bg = surface === 'mist' ? 'bg-[#fafaf9]' : 'bg-white';
  return (
    <section
      className={`border-t border-neutral-200/80 py-16 md:py-24 lg:py-28 ${bg}`}
      aria-labelledby={id}
    >
      <div className="marketplace-shell">
        <SectionReveal
          hidden={{ opacity: 0, y: 12 }}
          visible={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-12 flex flex-col gap-6 sm:mb-14 sm:flex-row sm:items-end sm:justify-between lg:mb-16"
        >
          <div className="max-w-3xl text-left">
            <h2 id={id} className="text-3xl font-semibold tracking-tight text-[#2a2a2a] sm:text-[2rem] lg:text-[2.125rem]">
              {title}
            </h2>
            <p className="mt-3 max-w-2xl text-pretty text-base leading-relaxed text-neutral-600 lg:text-[1.0625rem]">
              {subtitle}
            </p>
          </div>
          <Link
            href={viewAllHref}
            className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-lg border border-neutral-300 bg-white px-7 py-3 text-base font-medium text-[#2a2a2a] shadow-sm transition-colors duration-200 hover:border-neutral-400 hover:bg-neutral-50"
          >
            {viewAllLabel}
          </Link>
        </SectionReveal>

        {loading ? (
          <ul className={marketplaceProductCardGridClasses}>
            {Array.from({ length: 8 }).map((_, i) => (
              <li key={i}>
                <div className="h-[22rem] animate-pulse rounded-xl border border-neutral-100 bg-neutral-100/90 sm:h-[24rem]" />
              </li>
            ))}
          </ul>
        ) : products.length === 0 ? (
          <p className="text-center text-base text-neutral-500">No catalog items loaded yet.</p>
        ) : (
          <ul className={marketplaceProductCardGridClasses}>
            {products.map((p) => (
              <li key={p.id} className="min-h-0">
                <MarketplaceProductCard product={p} categoryName={categoryNames[p.categoryId] ?? 'Flags'} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/** Editorial homepage rails — featured, historical, vectors, premium, recent; optional gallery slot between featured & historical. */
export function LandingProductRails({ gallerySlot }: { gallerySlot?: ReactNode }) {
  const [cats, setCats] = useState<Category[]>([]);
  const [newest, setNewest] = useState<PublicProduct[]>([]);
  const [popular, setPopular] = useState<PublicProduct[]>([]);
  const [premium, setPremium] = useState<PublicProduct[]>([]);
  const [historical, setHistorical] = useState<PublicProduct[]>([]);
  const [vectors, setVectors] = useState<PublicProduct[]>([]);
  const [loadingRails, setLoadingRails] = useState(true);
  const missingPublicApiBanner = !process.env.NEXT_PUBLIC_API_URL?.trim();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const base = process.env.NEXT_PUBLIC_API_URL?.trim()
          ? getClientBackendApiBaseUrl()
          : null;

        const cRes = await fetch('/api/marketplace/categories', { cache: 'no-store' });
        let categories: Category[] = [];
        if (cRes.ok) {
          const j = await cRes.json();
          categories = j.data ?? [];
        }

        const newestUrl = base ? `${base}/assets?page=1&limit=8&sort=newest` : null;
        const trendingUrl = base ? `${base}/assets?page=2&limit=8&sort=newest` : null;
        const premiumPaidUrl = base ? `${base}/assets?page=1&limit=8&premium_tier=paid` : null;
        const historicalUrl = base ? `${base}/assets?page=1&limit=8&q=${encodeURIComponent('historical')}` : null;
        const vectorUrl = base ? `${base}/assets?page=1&limit=8&q=${encodeURIComponent('svg')}` : null;

        const [n, po, premiumOut, hist, vec] = await Promise.all([
          catalogStripFromRailThenMarket(newestUrl, '/api/marketplace/products?page=1&limit=8&sort=newest'),
          catalogStripFromRailThenMarket(trendingUrl, '/api/marketplace/products?page=1&limit=8&sort=popular'),
          catalogStripFromRailThenMarket(
            premiumPaidUrl,
            '/api/marketplace/products?page=1&limit=8&sort=newest&tier=pro',
          ),
          catalogStripFromRailThenMarket(
            historicalUrl,
            '/api/marketplace/products?page=1&limit=8&q=historical&sort=popular',
          ),
          catalogStripFromRailThenMarket(vectorUrl, '/api/marketplace/products?page=1&limit=8&q=vector&sort=popular'),
        ]);

        if (!cancelled) {
          setCats(categories);
          setNewest(n);
          setPopular(po);
          setPremium(premiumOut);
          setHistorical(hist);
          setVectors(vec);
        }
      } catch {
        if (!cancelled) {
          setNewest([]);
          setPopular([]);
          setPremium([]);
          setHistorical([]);
          setVectors([]);
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
    [cats],
  );

  return (
    <>
      {missingPublicApiBanner ? (
        <div role="alert" className="border-b border-amber-200/90 bg-amber-50/95 text-amber-950">
          <div className="marketplace-shell py-4 text-sm leading-relaxed">
            <p className="font-semibold text-amber-950">Backend API URL is not configured in the browser</p>
            <p className="mt-1 text-amber-950/90">
              Set <code className="rounded bg-amber-100/90 px-1">NEXT_PUBLIC_API_URL</code> to your Railway API origin
              including <code className="rounded bg-amber-100/90 px-1">/api</code> (example:{' '}
              <code className="rounded bg-amber-100/90 px-1">https://api.yoursite.com/api</code>). Without it, rails fall
              back to the merged Next.js marketplace feed; direct{' '}
              <code className="rounded bg-amber-100/90 px-1">GET /assets</code> parity from the deployed API is skipped.
            </p>
          </div>
        </div>
      ) : null}

      <ProductRailSection
        id="rail-featured"
        title="Featured collections"
        subtitle="Curated rails editors revisit — steady sellers and seasonal picks."
        products={popular}
        loading={loadingRails}
        viewAllHref="/gallery"
        viewAllLabel="View featured"
        categoryNames={categoryMap}
        surface="white"
      />

      {gallerySlot ?? null}

      <ProductRailSection
        id="rail-historical"
        title="Historical archives"
        subtitle="Marks that trace eras and territories — respectful reproductions with clear licensing."
        products={historical}
        loading={loadingRails}
        viewAllHref="/gallery?kind=historical"
        viewAllLabel="Open archive"
        categoryNames={categoryMap}
        surface="mist"
      />

      <ProductRailSection
        id="rail-vector-packs"
        title="Popular vector packs"
        subtitle="SVG-forward bundles suited for interfaces, motion, and large-format reproduction."
        products={vectors}
        loading={loadingRails}
        viewAllHref="/categories/country-flags"
        viewAllLabel="Country flags"
        categoryNames={categoryMap}
        surface="white"
      />

      <ProductRailSection
        id="rail-premium"
        title="Premium assets"
        subtitle={PRICING_MARKETING.catalogRailSubtitle}
        products={premium}
        loading={loadingRails}
        viewAllHref="/pricing"
        viewAllLabel="Explore premium"
        categoryNames={categoryMap}
        surface="mist"
      />

      <ProductRailSection
        id="rail-recent"
        title="Recently added"
        subtitle="Fresh uploads across formats — newest arrivals to the merged catalog."
        products={newest}
        loading={loadingRails}
        viewAllHref="/gallery"
        viewAllLabel={"See what's new"}
        categoryNames={categoryMap}
        surface="white"
      />
    </>
  );
}
