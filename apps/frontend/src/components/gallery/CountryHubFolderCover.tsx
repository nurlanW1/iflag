'use client';

import Image from 'next/image';
import { shouldUnoptimizeFlagImageHref } from '@/lib/media/svg-image-url';

type Props = {
  countryName: string;
  coverUrl?: string | null;
  hasWebpCover: boolean;
  countryCode?: string | null;
  className?: string;
  imageClassName?: string;
  sizes?: string;
  priority?: boolean;
};

export function CountryHubFolderCover({
  countryName,
  coverUrl,
  className = '',
  imageClassName = 'object-contain p-3',
  priority = false,
}: Props) {
  const src = coverUrl?.trim() ?? '';

  if (src) {
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
            (e.currentTarget as HTMLImageElement).style.display = 'none';
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
  className = 'absolute inset-0',
  imageClassName = 'object-contain p-3',
  sizes,
  priority = false,
}: Props) {
  const src = coverUrl?.trim() ?? '';

  if (src) {
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
