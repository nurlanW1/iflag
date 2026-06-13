'use client';

import { useId } from 'react';
import { GalleryFilterBar } from '@/components/landing/GalleryFilterBar';

export function EditorialHero() {
  const headingId = useId();

  return (
    <section
      className="relative overflow-hidden"
      style={{ background: 'var(--brand-blue)' }}
      aria-labelledby={headingId}
    >
      {/* Abstract background — z-0, content is z-10 */}
      <div className="pointer-events-none absolute inset-0 select-none" style={{ zIndex: 0 }} aria-hidden>
        {/* Noise grain texture */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.06'/%3E%3C/svg%3E")`,
          backgroundSize: '256px 256px',
          opacity: 1,
        }} />
        {/* Top-left cyan-white radial */}
        <div style={{
          position: 'absolute', top: '-20%', left: '-10%',
          width: '55%', height: '110%',
          background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.18) 0%, transparent 65%)',
          transform: 'rotate(-15deg)',
        }} />
        {/* Bottom-right deep indigo */}
        <div style={{
          position: 'absolute', bottom: '-20%', right: '-5%',
          width: '50%', height: '90%',
          background: 'radial-gradient(ellipse at center, rgba(67,56,202,0.55) 0%, transparent 60%)',
        }} />
        {/* Dot grid overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.09) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />
      </div>
      <div className="relative z-10 marketplace-shell flex flex-col items-center pb-6 pt-10 text-center sm:pt-12 lg:pt-16">
        {/* Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/90">
            Editorial marketplace
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white ring-1 ring-white/25">
            200+ countries · Free flags
          </span>
        </div>

        {/* Heading */}
        <h1
          id={headingId}
          className="mt-4 max-w-2xl text-balance text-2xl font-semibold leading-[1.14] tracking-tight text-white sm:mt-5 sm:text-[1.875rem] sm:leading-[1.12] md:text-[2.125rem] lg:text-[2.625rem] lg:leading-[1.1]"
        >
          Professional flag assets for every project
        </h1>

        {/* Subtext */}
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/75 sm:mt-4 sm:text-base lg:text-[1.0625rem]">
          Official country flags, vector designs and archives — SVG, PNG, WebP formats with predictable commercial licensing.
        </p>

        {/* Filter bar — inside blue section */}
        <div className="mt-6 w-full pb-8 sm:mt-8 lg:mt-10 lg:pb-10">
          <GalleryFilterBar />
        </div>
      </div>
    </section>
  );
}
