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
      {/* Abstract background */}
      <div className="pointer-events-none absolute inset-0 select-none" aria-hidden>
        {/* Top-left light burst */}
        <div style={{
          position: 'absolute', top: '-30%', left: '-15%',
          width: '65%', height: '130%',
          background: 'radial-gradient(ellipse, rgba(255,255,255,0.13) 0%, transparent 62%)',
          transform: 'rotate(-20deg)',
        }} />
        {/* Bottom-right indigo depth */}
        <div style={{
          position: 'absolute', bottom: '-40%', right: '-10%',
          width: '60%', height: '110%',
          background: 'radial-gradient(ellipse, rgba(79,70,229,0.45) 0%, transparent 60%)',
        }} />
        {/* Center-bottom warm shimmer */}
        <div style={{
          position: 'absolute', bottom: '-10%', left: '30%',
          width: '45%', height: '80%',
          background: 'radial-gradient(ellipse, rgba(255,255,255,0.06) 0%, transparent 65%)',
        }} />
        {/* Subtle dot grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }} />
      </div>
      <div className="marketplace-shell flex flex-col items-center pb-6 pt-10 text-center sm:pt-12 lg:pt-16">
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
