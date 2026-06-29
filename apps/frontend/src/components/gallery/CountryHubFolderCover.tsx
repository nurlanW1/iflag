'use client';

import { useMemo, useState } from 'react';
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

function coverInitials(name: string): string {
  const words = name
    .replace(/[^a-zA-Z0-9\s-]+/g, ' ')
    .split(/[\s-]+/)
    .map((w) => w.trim())
    .filter(Boolean);
  if (words.length === 0) return 'FS';
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
  return `${words[0]![0]}${words[words.length - 1]![0]}`.toUpperCase();
}

function FallbackCover({ countryName, className = '' }: { countryName: string; className?: string }) {
  const initials = useMemo(() => coverInitials(countryName), [countryName]);
  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#f8fafc,#eef2ff)] ${className}`.trim()}
      aria-label={`${countryName} preview unavailable`}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-white/80 text-lg font-bold tracking-tight text-slate-400 shadow-sm">
        {initials}
      </div>
    </div>
  );
}

export function CountryHubFolderCover({
  countryName,
  coverUrl,
  className = '',
  imageClassName = 'object-contain p-3',
  priority = false,
}: Props) {
  const src = coverUrl?.trim() ?? '';
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const canRender = Boolean(src) && failedSrc !== src;

  if (canRender) {
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
          onError={() => setFailedSrc(src)}
        />
      </div>
    );
  }

  return <FallbackCover countryName={countryName} className={className} />;
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
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const canRender = Boolean(src) && failedSrc !== src;

  if (canRender) {
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
          onError={() => setFailedSrc(src)}
        />
      </div>
    );
  }

  return <FallbackCover countryName={countryName} className={className} />;
}