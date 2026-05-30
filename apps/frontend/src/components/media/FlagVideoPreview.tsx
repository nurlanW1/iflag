'use client';

import clsx from 'clsx';
import { Pause, Play } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { hrefLooksLikeFlagVideo, mimeForFlagVideoFormat } from '@/lib/flag-video-formats';

type Props = {
  src: string;
  title: string;
  /** Raster poster when available; omitted when `src` is the only asset. */
  poster?: string | null;
  format?: string | null;
  className?: string;
  /** Fill parent; default true for gallery tiles. */
  fill?: boolean;
  /** Show native controls (PDP). */
  controls?: boolean;
  /** Tap-to-play overlay instead of always-on controls (grid tiles). */
  playOverlay?: boolean;
  /** Start muted loop on hover (grid preview). */
  hoverPreview?: boolean;
};

export function FlagVideoPreview({
  src,
  title,
  poster,
  format,
  className,
  fill = true,
  controls = false,
  playOverlay = false,
  hoverPreview = false,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  const videoSrc = src.trim();
  const posterUrl =
    poster?.trim() && !hrefLooksLikeFlagVideo(poster) ? poster.trim() : undefined;
  const mime = mimeForFlagVideoFormat(format ?? 'mp4');

  const togglePlay = useCallback(() => {
    const el = videoRef.current;
    if (!el || failed) return;
    if (el.paused) {
      void el.play().catch(() => setFailed(true));
    } else {
      el.pause();
    }
  }, [failed]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onError = () => setFailed(true);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('error', onError);
    return () => {
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('error', onError);
    };
  }, []);

  if (!videoSrc || failed) {
    return (
      <div
        className={clsx(
          'flex items-center justify-center bg-stone-900 text-center text-xs text-stone-400',
          fill && 'h-full w-full',
          className,
        )}
        role="img"
        aria-label={`${title} — video unavailable`}
      >
        Video preview unavailable
      </div>
    );
  }

  return (
    <div
      className={clsx('relative overflow-hidden bg-stone-900', fill && 'h-full w-full', className)}
      onMouseEnter={() => {
        if (!hoverPreview) return;
        const el = videoRef.current;
        if (!el) return;
        el.muted = true;
        void el.play().catch(() => undefined);
      }}
      onMouseLeave={() => {
        if (!hoverPreview) return;
        const el = videoRef.current;
        if (!el) return;
        el.pause();
        el.currentTime = 0;
      }}
    >
      <video
        ref={videoRef}
        className={clsx('h-full w-full', fill ? 'object-cover' : 'max-h-full max-w-full object-contain')}
        src={videoSrc}
        poster={posterUrl}
        controls={controls && !playOverlay}
        playsInline
        preload="metadata"
        aria-label={title}
        onClick={
          playOverlay
            ? (e) => {
                e.preventDefault();
                e.stopPropagation();
                togglePlay();
              }
            : undefined
        }
      >
        <source src={videoSrc} type={mime} />
      </video>

      {playOverlay && !playing ? (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            togglePlay();
          }}
          className="pointer-events-auto absolute inset-0 z-[1] flex items-center justify-center bg-black/25 transition hover:bg-black/15"
          aria-label={`Play ${title}`}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-[#2563eb] shadow-md">
            <Play size={20} className="ml-0.5" fill="currentColor" aria-hidden />
          </span>
        </button>
      ) : null}

      {playOverlay && playing ? (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            togglePlay();
          }}
          className="pointer-events-auto absolute bottom-2 right-2 z-[2] flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm"
          aria-label={`Pause ${title}`}
        >
          <Pause size={16} aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
