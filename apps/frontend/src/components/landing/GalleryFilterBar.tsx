'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, ArrowRight, FileCode2, Image, Clapperboard, Layers } from 'lucide-react';

const FORMAT_TABS = [
  {
    id: 'all',
    label: 'All',
    desc: 'Every format',
    Icon: Layers,
    color: 'blue',
  },
  {
    id: 'svg',
    label: 'Vector',
    desc: 'SVG & EPS',
    Icon: FileCode2,
    color: 'violet',
  },
  {
    id: 'png',
    label: 'PNG',
    desc: 'Transparent',
    Icon: Image,
    color: 'emerald',
  },
  {
    id: 'jpg',
    label: 'JPG',
    desc: 'Photo quality',
    Icon: Image,
    color: 'amber',
  },
  {
    id: 'video',
    label: 'Video',
    desc: 'MP4 & WebM',
    Icon: Clapperboard,
    color: 'rose',
  },
] as const;

type FormatId = typeof FORMAT_TABS[number]['id'];

const COLOR_MAP: Record<string, { card: string; icon: string; ring: string }> = {
  blue:   { card: 'bg-blue-50   border-blue-200   text-blue-700',   icon: 'text-blue-500',   ring: 'ring-blue-400'   },
  violet: { card: 'bg-violet-50 border-violet-200 text-violet-700', icon: 'text-violet-500', ring: 'ring-violet-400' },
  emerald:{ card: 'bg-emerald-50 border-emerald-200 text-emerald-700', icon: 'text-emerald-500', ring: 'ring-emerald-400' },
  amber:  { card: 'bg-amber-50  border-amber-200  text-amber-700',  icon: 'text-amber-500',  ring: 'ring-amber-400'  },
  rose:   { card: 'bg-rose-50   border-rose-200   text-rose-700',   icon: 'text-rose-500',   ring: 'ring-rose-400'   },
};


function buildHref(format: FormatId, q: string) {
  const p = new URLSearchParams();
  if (format !== 'all') p.set('format', format);
  if (q.trim()) p.set('q', q.trim());
  return `/gallery${p.size > 0 ? `?${p.toString()}` : ''}`;
}

export function GalleryFilterBar() {
  const router = useRouter();
  const [q, setQ]           = useState('');
  const [format, setFormat] = useState<FormatId>('all');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(buildHref(format, q));
  };

  const go = (nextFormat: FormatId) => {
    setFormat(nextFormat);
  };

  return (
    <div className="w-full overflow-hidden rounded-2xl bg-white ring-1 ring-white/40 shadow-[0_16px_48px_-8px_rgba(0,0,0,0.22)]">

      {/* ── Row 1: Search bar ── */}
      <form onSubmit={handleSearch} className="flex items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
            size={17} aria-hidden
          />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by country or ISO code…"
            className="w-full border-0 bg-transparent py-3.5 pl-11 pr-4 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ('')}
              aria-label="Clear"
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
            >
              <X size={13} />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="flex shrink-0 items-center gap-1.5 border-l border-neutral-100 bg-[#4f8ef7] px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#3b82f6]"
        >
          <span className="hidden sm:inline">Search</span>
          <ArrowRight size={15} aria-hidden />
        </button>
      </form>

      {/* ── Row 2: Format category cards ── */}
      <div className="grid grid-cols-5 divide-x divide-neutral-100 border-t border-neutral-100">
        {FORMAT_TABS.map(({ id, label, desc, Icon, color }) => {
          const active = format === id;
          const c = COLOR_MAP[color];
          return (
            <button
              key={id}
              type="button"
              onClick={() => go(id)}
              className="group flex flex-col items-center gap-1 px-3 py-2.5 transition-all duration-150 hover:bg-neutral-50"
            >
              <span className={`transition-colors duration-150 ${
                active ? c.icon : 'text-neutral-400 group-hover:text-neutral-600'
              }`}>
                <Icon size={18} aria-hidden />
              </span>
              <span className={`text-xs font-semibold leading-none transition-colors ${active ? c.icon : 'text-neutral-600'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>

    </div>
  );
}
