'use client';

import { useId } from 'react';
import { GalleryFilterBar } from '@/components/landing/GalleryFilterBar';

export function EditorialHero() {
  const headingId = useId();

  return (
    <section
      className="relative overflow-hidden -mt-24 pt-24"
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
      <div className="relative z-10 marketplace-shell flex flex-col items-center pb-5 pt-8 text-center sm:pb-7 sm:pt-11 lg:pb-10 lg:pt-16">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.13em] text-white/90 backdrop-blur-sm sm:text-xs">
          200+ countries · SVG · PNG · WebP
        </div>

        {/* Heading */}
        <h1
          id={headingId}
          className="mt-3 max-w-[18ch] text-balance text-[1.625rem] font-bold uppercase leading-[1.13] tracking-tight text-white sm:mt-4 sm:max-w-2xl sm:text-[2rem] sm:leading-[1.12] md:text-[2.375rem] lg:mt-5 lg:text-[2.875rem] lg:leading-[1.1] xl:text-[3.25rem]"
        >
          Assets for every project
        </h1>

        {/* Subtext */}
        <p className="mt-2.5 max-w-[30ch] text-[0.8125rem] leading-relaxed text-white/70 sm:mt-3.5 sm:max-w-lg sm:text-[0.9375rem] lg:mt-4 lg:text-base lg:text-white/80">
          Official country flags, vector designs and archives — SVG, PNG, WebP with predictable commercial licensing.
        </p>

        {/* Filter bar — inside blue section */}
        <div className="mt-5 w-full pb-6 sm:mt-7 sm:pb-8 lg:mt-9 lg:pb-11">
          <GalleryFilterBar />
        </div>
      </div>
    </section>
  );
}
