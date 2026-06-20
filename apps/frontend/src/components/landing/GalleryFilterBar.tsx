'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, ArrowRight, FileCode2, Image, Clapperboard, Layers, Loader2 } from 'lucide-react';

const FORMAT_TABS = [
  { id: 'all',   label: 'All',    desc: 'Every format',    Icon: Layers,      color: 'blue'    },
  { id: 'svg',   label: 'Vector', desc: 'SVG & EPS',       Icon: FileCode2,   color: 'violet'  },
  { id: 'png',   label: 'PNG',    desc: 'Transparent',     Icon: Image,       color: 'emerald' },
  { id: 'jpg',   label: 'JPG',    desc: 'Photo quality',   Icon: Image,       color: 'amber'   },
  { id: 'video', label: 'Video',  desc: 'MP4 & WebM',      Icon: Clapperboard,color: 'rose'    },
] as const;

type FormatId = typeof FORMAT_TABS[number]['id'];

const COLOR_MAP: Record<string, { card: string; icon: string; ring: string; activeBg: string }> = {
  blue:    { card: 'bg-blue-50   border-blue-200   text-blue-700',   icon: 'text-blue-500',    ring: 'ring-blue-400',    activeBg: '#3b82f6' },
  violet:  { card: 'bg-violet-50 border-violet-200 text-violet-700', icon: 'text-violet-500',  ring: 'ring-violet-400',  activeBg: '#7c3aed' },
  emerald: { card: 'bg-emerald-50 border-emerald-200 text-emerald-700', icon: 'text-emerald-500', ring: 'ring-emerald-400', activeBg: '#059669' },
  amber:   { card: 'bg-amber-50  border-amber-200  text-amber-700',  icon: 'text-amber-500',   ring: 'ring-amber-400',   activeBg: '#d97706' },
  rose:    { card: 'bg-rose-50   border-rose-200   text-rose-700',   icon: 'text-rose-500',    ring: 'ring-rose-400',    activeBg: '#e11d48' },
};

export function GalleryFilterBar() {
  const router = useRouter();
  const [q, setQ]           = useState('');
  const [format, setFormat] = useState<FormatId>('all');
  const [loading, setLoading] = useState(false);

  const navigate = (fmtId: FormatId, query?: string) => {
    const qTrimmed = (query ?? q).trim();
    const p = new URLSearchParams();
    if (fmtId !== 'all') p.set('format', fmtId);
    if (qTrimmed) p.set('q', qTrimmed);
    router.push(`/gallery${p.size > 0 ? `?${p.toString()}` : ''}`);
  };

  const handleFormatClick = (fmtId: FormatId) => {
    setFormat(fmtId);
    // If no search query, navigate to gallery with format filter immediately
    if (!q.trim()) {
      navigate(fmtId);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = q.trim();

    if (!query) {
      navigate(format);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/gallery/resolve-country?q=${encodeURIComponent(query)}`,
        { cache: 'no-store' },
      );
      if (res.ok) {
        const data = (await res.json()) as { slug?: string | null };
        const slug = data.slug?.trim();
        if (slug) {
          const suffix = format !== 'all' ? `?format=${format}` : '';
          router.push(`/gallery/${encodeURIComponent(slug)}${suffix}`);
          return;
        }
      }
    } catch {
      // fall through to list search
    } finally {
      setLoading(false);
    }

    navigate(format, query);
  };

  return (
    <div className="w-full overflow-hidden rounded-xl bg-white ring-1 ring-white/40 shadow-[0_16px_48px_-8px_rgba(0,0,0,0.22)] sm:rounded-2xl">

      {/* ── Row 1: Search bar ── */}
      <form onSubmit={handleSearch} className="flex items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 sm:left-4"
            size={16} aria-hidden
          />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by country or ISO code…"
            aria-label="Search flags"
            className="w-full border-0 bg-transparent py-3 pl-9 pr-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none sm:py-3.5 sm:pl-11 sm:pr-4"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors sm:right-3"
            >
              <X size={13} />
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="flex shrink-0 items-center gap-1.5 border-l border-neutral-100 bg-[#4f8ef7] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#3b82f6] disabled:opacity-70 sm:px-5 sm:py-3.5"
        >
          {loading
            ? <Loader2 size={15} className="animate-spin" aria-hidden />
            : <><span className="hidden sm:inline">Search</span><ArrowRight size={15} aria-hidden /></>
          }
        </button>
      </form>

      {/* ── Row 2: Format category tabs ── */}
      <div className="grid grid-cols-5 divide-x divide-neutral-100 border-t border-neutral-100">
        {FORMAT_TABS.map(({ id, label, desc, Icon, color }) => {
          const active = format === id;
          const c = COLOR_MAP[color];
          return (
            <button
              key={id}
              type="button"
              onClick={() => handleFormatClick(id)}
              title={desc}
              className="group relative flex flex-col items-center gap-0.5 px-1 py-2 transition-all duration-150 hover:bg-neutral-50 sm:gap-1 sm:px-2 sm:py-2.5"
            >
              {active && (
                <span
                  className="absolute inset-x-0 bottom-0 h-0.5 rounded-t"
                  style={{ background: c.activeBg }}
                />
              )}
              <span className={`transition-colors duration-150 ${
                active ? c.icon : 'text-neutral-400 group-hover:text-neutral-600'
              }`}>
                <Icon size={16} className="sm:hidden" aria-hidden />
                <Icon size={18} className="hidden sm:block" aria-hidden />
              </span>
              <span className={`text-[10px] font-semibold leading-none transition-colors sm:text-xs ${
                active ? c.icon : 'text-neutral-600'
              }`}>
                {label}
              </span>
              <span className={`hidden text-[10px] leading-none transition-colors md:block ${
                active ? 'text-neutral-500' : 'text-neutral-400'
              }`}>
                {desc}
              </span>
            </button>
          );
        })}
      </div>

    </div>
  );
}
