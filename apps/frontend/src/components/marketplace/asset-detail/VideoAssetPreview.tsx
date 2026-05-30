'use client';

import clsx from 'clsx';
import { FlagVideoPreview } from '@/components/media/FlagVideoPreview';

type Props = {
  productTitle: string;
  videoUrl: string;
  posterUrl?: string | null;
  format?: string | null;
  className?: string;
};

/** Stock PDP — full-width playable flag video with native controls. */
export function VideoAssetPreview({
  productTitle,
  videoUrl,
  posterUrl,
  format,
  className,
}: Props) {
  return (
    <div
      className={clsx(
        'overflow-hidden border border-slate-200/80 bg-stone-950 shadow-sm',
        'flex min-h-[min(20rem,52vh)] flex-col rounded-xl lg:min-h-0 lg:flex-1',
        className,
      )}
    >
      <div className="relative flex min-h-[12rem] flex-1 items-center justify-center">
        <FlagVideoPreview
          src={videoUrl}
          title={productTitle}
          poster={posterUrl}
          format={format}
          fill
          controls
          className="absolute inset-0"
        />
      </div>
      <p className="border-t border-slate-800/80 px-4 py-2 text-center text-xs text-slate-400">
        Stream preview — purchase to download the master file
      </p>
    </div>
  );
}
