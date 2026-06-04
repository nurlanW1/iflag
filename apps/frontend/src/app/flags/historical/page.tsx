import type { Metadata } from 'next';
import Link from 'next/link';
import { Clock } from 'lucide-react';
import { SITE_NAME } from '@/lib/seo/site-config';
import historicalFlags from '../../../../content/historical-flags.json';

export const metadata: Metadata = {
  title: `Historical Country Flags SVG — Soviet Union, Ottoman, Byzantine | ${SITE_NAME}`,
  description: 'Download historical and former country flags in SVG, PNG formats. Soviet Union, Ottoman Empire, Byzantine, Mughal, Imperial Japan and more.',
  alternates: { canonical: '/flags/historical' },
};

export default function HistoricalFlagsPage() {
  return (
    <main className="min-h-screen bg-stone-50">
      {/* Header */}
      <section className="border-b border-stone-200 bg-white px-4 py-10 sm:py-14">
        <div className="marketplace-shell">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-stone-400">
            <Clock size={13} aria-hidden /> Historical
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
            Historical &amp; Former Country Flags
          </h1>
          <p className="mt-3 max-w-2xl text-base text-stone-500">
            Flags of empires, unions, and nations that no longer exist — preserved in vector and raster formats for education, design, and research.
          </p>
        </div>
      </section>

      {/* Grid */}
      <div className="marketplace-shell py-10 sm:py-14">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {historicalFlags.map((flag) => (
            <Link
              key={flag.slug}
              href={`/gallery/${flag.slug}`}
              className="group overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              {/* Color preview */}
              <div
                className="flex h-32 items-center justify-center text-4xl font-bold text-white/40"
                style={{ backgroundColor: flag.previewColor }}
              >
                {flag.name.charAt(0)}
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-sm font-semibold leading-snug text-stone-900 group-hover:text-[#2563eb]">
                    {flag.name}
                  </h2>
                  <span className="shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-500">
                    {flag.years}
                  </span>
                </div>
                <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-stone-500">
                  {flag.description}
                </p>
                <div className="mt-3 flex items-center gap-1.5">
                  <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-semibold text-stone-600">SVG</span>
                  <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-semibold text-stone-600">PNG</span>
                  <span className="ml-auto text-xs font-medium text-[#2563eb] opacity-0 transition-opacity group-hover:opacity-100">
                    View →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
