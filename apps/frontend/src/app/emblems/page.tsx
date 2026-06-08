import type { Metadata } from 'next';
import Link from 'next/link';
import { Shield, Info } from 'lucide-react';
import { SITE_NAME } from '@/lib/seo/site-config';

export const metadata: Metadata = {
  title: `National Coats of Arms SVG Free Download | ${SITE_NAME}`,
  description: 'Download national coats of arms and emblems in SVG, PNG formats. Public domain heraldic symbols from countries worldwide.',
  alternates: { canonical: '/emblems' },
};

const EMBLEMS = [
  { slug: 'usa', name: 'United States', region: 'Americas', license: 'Public Domain' },
  { slug: 'united-kingdom', name: 'United Kingdom', region: 'Europe', license: 'Public Domain' },
  { slug: 'france', name: 'France', region: 'Europe', license: 'Public Domain' },
  { slug: 'germany', name: 'Germany', region: 'Europe', license: 'Public Domain' },
  { slug: 'russia', name: 'Russia', region: 'Europe', license: 'Public Domain' },
  { slug: 'china', name: 'China', region: 'Asia', license: 'Public Domain' },
  { slug: 'japan', name: 'Japan', region: 'Asia', license: 'Public Domain' },
  { slug: 'turkey', name: 'Turkey', region: 'Asia', license: 'Public Domain' },
  { slug: 'india', name: 'India', region: 'Asia', license: 'Public Domain' },
  { slug: 'brazil', name: 'Brazil', region: 'Americas', license: 'Public Domain' },
  { slug: 'canada', name: 'Canada', region: 'Americas', license: 'Public Domain' },
  { slug: 'australia', name: 'Australia', region: 'Oceania', license: 'Public Domain' },
  { slug: 'italy', name: 'Italy', region: 'Europe', license: 'Public Domain' },
  { slug: 'spain', name: 'Spain', region: 'Europe', license: 'Public Domain' },
  { slug: 'ukraine', name: 'Ukraine', region: 'Europe', license: 'Public Domain' },
  { slug: 'uzbekistan', name: 'Uzbekistan', region: 'Asia', license: 'Public Domain' },
  { slug: 'kazakhstan', name: 'Kazakhstan', region: 'Asia', license: 'Public Domain' },
  { slug: 'saudi-arabia', name: 'Saudi Arabia', region: 'Asia', license: 'Public Domain' },
  { slug: 'uae', name: 'UAE', region: 'Asia', license: 'Public Domain' },
  { slug: 'south-korea', name: 'South Korea', region: 'Asia', license: 'Public Domain' },
];

const REGIONS = ['All', 'Europe', 'Asia', 'Americas', 'Africa', 'Oceania'];

export default function EmblemsPage() {
  return (
    <main className="min-h-screen bg-stone-50">
      {/* Header */}
      <section className="border-b border-stone-200 bg-white px-4 py-10 sm:py-14">
        <div className="marketplace-shell">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-stone-400">
            <Shield size={13} aria-hidden /> Heraldry
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
            National Coats of Arms
          </h1>
          <p className="mt-3 max-w-2xl text-base text-stone-500">
            Official national emblems and coats of arms in SVG and PNG formats.
          </p>
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <Info size={15} className="mt-0.5 shrink-0" aria-hidden />
            <span>All emblems sourced from public domain. Commercial use restrictions may apply in some countries.</span>
          </div>
        </div>
      </section>

      {/* Grid */}
      <div className="marketplace-shell py-10">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {EMBLEMS.map((emblem) => (
            <Link
              key={emblem.slug}
              href={`/gallery/${emblem.slug}`}
              className="group overflow-hidden rounded-2xl border border-stone-200 bg-white p-4 shadow-sm text-center transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex h-20 items-center justify-center text-4xl">
                🛡️
              </div>
              <p className="mt-3 text-sm font-semibold text-stone-900 group-hover:text-[var(--brand-blue)]">
                {emblem.name}
              </p>
              <p className="mt-1 text-xs text-stone-400">{emblem.region}</p>
              <span className="mt-2 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                {emblem.license}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
