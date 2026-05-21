'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import HomeGalleryPreview from '@/components/HomeGalleryPreview';
import { SectionReveal } from '@/components/motion/SectionReveal';
import { MarketplaceProductCard } from '@/components/marketplace/MarketplaceProductCard';
import { marketplaceProductCardGridClasses } from '@/lib/ui/marketplace-layout';
import type { PublicProduct } from '@/lib/marketplace/product-mapper';
import type { Category } from '@/types/marketplace';
import {
  railwayPublishedFlagToPublicProduct,
  type RailwayPublishedFlagAsset,
} from '@/lib/marketplace/railway-assets-mapper';

type ProductsApi = {
  data: PublicProduct[];
};

const NEXT_PUBLIC_BACKEND =
  typeof process.env.NEXT_PUBLIC_API_URL === 'string' ? process.env.NEXT_PUBLIC_API_URL.trim() : '';

function railwayApiBase(raw: string): string | null {
  const t = raw.trim().replace(/\/$/, '');
  return t.length > 0 ? t : null;
}

async function mapMarketplacePick(r: Response): Promise<PublicProduct[]> {
  if (!r.ok) return [];
  const j = (await r.json()) as ProductsApi;
  return j.data ?? [];
}

async function fetchRailPublishedFlags(fullUrl: string): Promise<PublicProduct[]> {
  const res = await fetch(fullUrl, { cache: 'no-store' });
  if (!res.ok) return [];
  const j = (await res.json()) as { data?: RailwayPublishedFlagAsset[] };
  return (j.data ?? []).map(railwayPublishedFlagToPublicProduct);
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
    <section
      className="border-t border-neutral-200/90 bg-white py-14 md:py-20 lg:py-24"
      aria-labelledby={id}
    >
      <div className="marketplace-shell">
        <SectionReveal
          hidden={{ opacity: 0, y: 14 }}
          visible={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-10 flex flex-col gap-5 sm:mb-12 sm:flex-row sm:items-end sm:justify-between"
        >
          <div className="max-w-3xl text-left">
            <h2
              id={id}
              className="text-3xl font-bold tracking-tight text-neutral-950 sm:text-[2rem] lg:text-[2.125rem]"
            >
              {title}
            </h2>
            <p className="mt-3 max-w-2xl text-pretty text-base leading-relaxed text-neutral-600 lg:text-[1.0625rem]">
              {subtitle}
            </p>
          </div>
          <Link
            href={viewAllHref}
            className="inline-flex min-h-14 shrink-0 items-center justify-center rounded-xl border border-neutral-300 bg-white px-8 py-3.5 text-base font-semibold text-neutral-900 shadow-sm transition hover:border-[#009ab6] hover:text-[#009ab6]"
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
          <p className="text-center text-base text-neutral-500">No catalog items loaded yet.</p>
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
  const [historical, setHistorical] = useState<PublicProduct[]>([]);
  const [sports, setSports] = useState<PublicProduct[]>([]);
  const [loadingRails, setLoadingRails] = useState(true);
  const missingPublicApiBanner = NEXT_PUBLIC_BACKEND.length === 0;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const base = railwayApiBase(NEXT_PUBLIC_BACKEND);

        const cRes = await fetch('/api/marketplace/categories', { cache: 'no-store' });
        let categories: Category[] = [];
        if (cRes.ok) {
          const j = await cRes.json();
          categories = j.data ?? [];
        }

        const newestUrl = base ? `${base}/assets?page=1&limit=8&sort=newest` : null;
        const trendingUrl = base ? `${base}/assets?page=2&limit=8&sort=newest` : null;
        const premiumPaidUrl = base ? `${base}/assets?page=1&limit=8&premium_tier=paid` : null;

        const [n, po, premiumOut, hist, sport] = await Promise.all([
          catalogStripFromRailThenMarket(
            newestUrl,
            '/api/marketplace/products?page=1&limit=8&sort=newest',
          ),
          catalogStripFromRailThenMarket(
            trendingUrl,
            '/api/marketplace/products?page=1&limit=8&sort=popular',
          ),
          catalogStripFromRailThenMarket(
            premiumPaidUrl,
            '/api/marketplace/products?page=1&limit=8&sort=newest&tier=pro',
          ),
          mapMarketplacePick(
            await fetch('/api/marketplace/products?page=1&limit=8&q=historical', { cache: 'no-store' }),
          ),
          mapMarketplacePick(
            await fetch('/api/marketplace/products?page=1&limit=8&q=sports', { cache: 'no-store' }),
          ),
        ]);

        if (!cancelled) {
          setCats(categories);
          setNewest(n);
          setPopular(po);
          setPremium(premiumOut);
          setHistorical(hist);
          setSports(sport);
        }
      } catch {
        if (!cancelled) {
          setNewest([]);
          setPopular([]);
          setPremium([]);
          setHistorical([]);
          setSports([]);
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
      {missingPublicApiBanner ? (
        <div role="alert" className="border-b border-amber-200 bg-amber-50 text-amber-950">
          <div className="marketplace-shell py-4 text-base leading-relaxed">
            <p className="font-semibold">Backend API URL is not configured in the browser</p>
            <p className="mt-2 text-amber-900/95">
              Set <code className="rounded bg-amber-100/80 px-1">NEXT_PUBLIC_API_URL</code> to your Railway
              API origin including <code className="rounded bg-amber-100/80 px-1">/api</code>{' '}
              (example:{' '}
              <code className="rounded bg-amber-100/80 px-1">https://api.yoursite.com/api</code>). Without
              it, rails fall back to the merged Next.js marketplace feed; direct{' '}
              <code className="rounded bg-amber-100/80 px-1">GET /assets</code> parity from the deployed API
              is skipped.
            </p>
          </div>
        </div>
      ) : null}

      <ProductRailSection
        id="rail-trending"
        title="Trending flags"
        subtitle="High‑intent downloads and editorial picks updated from live marketplace activity."
        products={popular}
        loading={loadingRails}
        viewAllHref="/browse?sort=popular"
        viewAllLabel="View all trending"
        categoryNames={categoryMap}
      />

      <HomeGalleryPreview />

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
        subtitle="Commercial-ready masters with predictable licensing — checkout handled securely via Paddle."
        products={premium}
        loading={loadingRails}
        viewAllHref="/browse?tier=pro"
        viewAllLabel="Explore premium"
        categoryNames={categoryMap}
      />

      <ProductRailSection
        id="rail-historical"
        title="Historical collections"
        subtitle="Heritage marks, alternate histories, and archival-inspired treatments."
        products={historical}
        loading={loadingRails}
        viewAllHref="/gallery?kind=historical"
        viewAllLabel="Browse historical gallery"
        categoryNames={categoryMap}
      />

      <ProductRailSection
        id="rail-sports"
        title="Sports organizations"
        subtitle="Leagues, federations, and athletic marks curated for broadcast-ready pipelines."
        products={sports}
        loading={loadingRails}
        viewAllHref="/browse?q=sports"
        viewAllLabel="See sports assets"
        categoryNames={categoryMap}
      />
    </>
  );
}
