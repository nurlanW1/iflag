'use client';

import Image from 'next/image';
import { shouldUnoptimizeFlagImageHref } from '@/lib/media/svg-image-url';

type Props = {
  countryName: string;
  coverUrl?: string | null;
  hasWebpCover: boolean;
  /** ISO 3166-1 alpha-2 code (e.g. "US", "BR") — used for flagcdn.com fallback. */
  countryCode?: string | null;
  className?: string;
  imageClassName?: string;
  sizes?: string;
  priority?: boolean;
};

function flagCdnUrl(code: string): string {
  return `https://flagcdn.com/w320/${code.toLowerCase()}.webp`;
}

/**
 * Country folder tile cover.
 * Priority: any cover URL (SVG/PNG/WebP) → flagcdn.com (by ISO code) → grey placeholder.
 */
export function CountryHubFolderCover({
  countryName,
  coverUrl,
  countryCode,
  className = '',
  imageClassName = 'object-contain p-3',
  priority = false,
}: Props) {
  const coverSrc = coverUrl?.trim() ?? '';
  const fallbackSrc = countryCode?.trim() ? flagCdnUrl(countryCode.trim()) : null;

  if (coverSrc || fallbackSrc) {
    const src = coverSrc || fallbackSrc!;
    return (
      <div className={`relative h-full w-full ${className}`.trim()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={`${countryName} flag`}
          className={`h-full w-full ${imageClassName}`.trim()}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          referrerPolicy="no-referrer"
          draggable={false}
          onError={(e) => {
            const el = e.currentTarget;
            if (coverSrc && fallbackSrc && el.src !== fallbackSrc) {
              el.src = fallbackSrc;
              return;
            }
            el.style.display = 'none';
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-neutral-100 ${className}`.trim()}
    >
      <span className="sr-only">{countryName}</span>
    </div>
  );
}

/** Next/Image fill variant for layouts that require fill. */
export function CountryHubFolderCoverFill({
  countryName,
  coverUrl,
  countryCode,
  className = 'absolute inset-0',
  imageClassName = 'object-contain p-3',
  sizes,
  priority = false,
}: Props) {
  const coverSrc = coverUrl?.trim() ?? '';
  const fallbackSrc = countryCode?.trim() ? flagCdnUrl(countryCode.trim()) : null;

  if (coverSrc || fallbackSrc) {
    const src = coverSrc || fallbackSrc!;
    const unoptimized = shouldUnoptimizeFlagImageHref(src, ['webp']);
    return (
      <div className={className}>
        <Image
          src={src}
          alt={`${countryName} flag`}
          fill
          unoptimized={unoptimized}
          className={imageClassName}
          sizes={sizes}
          priority={priority}
          draggable={false}
        />
      </div>
    );
  }

  return (
    <div className={`${className} flex items-center justify-center bg-neutral-100`}>
      <span className="sr-only">{countryName}</span>
    </div>
  );
}
