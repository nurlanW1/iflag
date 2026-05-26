'use client';

import Image from 'next/image';
import { Star } from 'lucide-react';
import { shouldUnoptimizeFlagImageHref } from '@/lib/media/svg-image-url';

type Props = {
  countryName: string;
  /** Resolved WebP cover URL — hub cards use WebP only. */
  coverUrl?: string | null;
  hasWebpCover: boolean;
  className?: string;
  imageClassName?: string;
  sizes?: string;
  priority?: boolean;
};

/**
 * Country folder tile cover: WebP when uploaded, temporary star placeholder otherwise.
 */
export function CountryHubFolderCover({
  countryName,
  coverUrl,
  hasWebpCover,
  className = '',
  imageClassName = 'object-contain p-3',
  sizes = '(max-width: 767px) 50vw, 25vw',
  priority = false,
}: Props) {
  const src = coverUrl?.trim() ?? '';
  const showWebp = hasWebpCover && src.length > 0;

  if (showWebp) {
    const svg = shouldUnoptimizeFlagImageHref(src, ['webp']);
    return (
      <div className={`relative h-full w-full ${className}`.trim()}>
        {/* eslint-disable-next-line @next/next/no-img-element -- dynamic R2/CDN */}
        <img
          src={src}
          alt={`${countryName} — folder cover`}
          className={`h-full w-full ${imageClassName}`.trim()}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          referrerPolicy="no-referrer"
          draggable={false}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-amber-50/90 via-white to-neutral-100 ${className}`.trim()}
      aria-hidden={false}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100/90 ring-1 ring-amber-200/80 sm:h-14 sm:w-14">
        <Star className="h-6 w-6 fill-amber-400 text-amber-500 sm:h-7 sm:w-7" strokeWidth={1.5} aria-hidden />
      </span>
      <span className="sr-only">{countryName} — cover coming soon</span>
    </div>
  );
}

/** Next/Image variant for layouts that require fill (landing). */
export function CountryHubFolderCoverFill({
  countryName,
  coverUrl,
  hasWebpCover,
  className = 'absolute inset-0',
  imageClassName = 'object-contain p-3',
  sizes,
}: Props) {
  const src = coverUrl?.trim() ?? '';
  const showWebp = hasWebpCover && src.length > 0;

  if (showWebp) {
    const svg = shouldUnoptimizeFlagImageHref(src, ['webp']);
    return (
      <div className={className}>
        <Image
          src={src}
          alt={`${countryName} — folder cover`}
          fill
          unoptimized={svg}
          className={imageClassName}
          sizes={sizes}
          draggable={false}
        />
      </div>
    );
  }

  return (
    <div className={`${className} flex items-center justify-center bg-gradient-to-br from-amber-50/90 via-white to-neutral-100`}>
      <Star className="h-10 w-10 fill-amber-400 text-amber-500 sm:h-12 sm:w-12" strokeWidth={1.5} aria-hidden />
      <span className="sr-only">{countryName} — cover coming soon</span>
    </div>
  );
}
