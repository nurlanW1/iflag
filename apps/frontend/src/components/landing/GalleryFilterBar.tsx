'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search, X, Compass, Building2, Map, Globe2, Clock3,
  LayoutGrid, Rows3, ArrowRight, Crown, Tag,
} from 'lucide-react';

const KIND_TABS = [
  { id: null,          label: 'All',          Icon: Compass   },
  { id: 'independent', label: 'Independent',  Icon: Building2 },
  { id: 'us-states',   label: 'US States',    Icon: Map       },
  { id: 'autonomy',    label: 'Autonomous',   Icon: Globe2    },
  { id: 'historical',  label: 'Historical',   Icon: Clock3    },
] as const;

const SORT_OPTIONS = [
  { id: 'name-asc',     label: 'Name · A → Z'   },
  { id: 'name-desc',    label: 'Name · Z → A'   },
  { id: 'designs-desc', label: 'Most designs'   },
  { id: 'designs-asc',  label: 'Fewest designs' },
] as const;

const FORMATS = [
  { id: 'all',   label: 'All formats' },
  { id: 'svg',   label: 'SVG'         },
  { id: 'png',   label: 'PNG'         },
  { id: 'video', label: 'VIDEO'       },
] as const;

function buildHref(kind: string | null, q: string, sort: string) {
  const p = new URLSearchParams();
  if (kind) p.set('kind', kind);
  if (q.trim()) p.set('q', q.trim());
  if (sort && sort !== 'name-asc') p.set('sort', sort);
  return `/gallery${p.size > 0 ? `?${p.toString()}` : ''}`;
}

export function GalleryFilterBar() {
  const router = useRouter();
  const [q, setQ]         = useState('');
  const [sort, setSort]   = useState('name-asc');
  const [format, setFormat] = useState<'all'|'svg'|'png'|'video'>('all');
  const [type, setType]   = useState<'all'|'free'|'premium'>('all');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(buildHref(null, q, sort));
  };

  return (
    <div className="w-full overflow-hidden rounded-2xl bg-white shadow-[0_16px_48px_-8px_rgba(0,0,0,0.22)]">

      {/* ── Row 1: search ── */}
      <form onSubmit={handleSearch} className="flex items-center gap-0">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
            size={18} aria-hidden
          />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by country or ISO code…"
            className="w-full border-0 bg-transparent py-4 pl-12 pr-4 text-[15px] text-neutral-800 placeholder:text-neutral-400 focus:outline-none"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ('')}
              aria-label="Clear"
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Sort — desktop */}
        <div className="hidden shrink-0 items-center border-l border-neutral-100 sm:flex">
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              aria-label="Sort"
              className="h-full appearance-none border-0 bg-transparent py-4 pl-4 pr-8 text-xs font-semibold text-neutral-600 focus:outline-none md:min-w-[9rem]"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-neutral-400" aria-hidden>▾</span>
          </div>
        </div>

        {/* View toggle — desktop */}
        <div className="hidden shrink-0 items-center gap-1 border-l border-neutral-100 px-3 sm:flex">
          <button type="button" aria-label="Grid view"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700 transition-colors hover:bg-neutral-200"
          >
            <LayoutGrid size={16} aria-hidden />
          </button>
          <button type="button" aria-label="List view"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
          >
            <Rows3 size={16} aria-hidden />
          </button>
        </div>

        {/* Search button */}
        <button
          type="submit"
          className="flex shrink-0 items-center gap-2 border-l border-neutral-100 bg-[var(--brand-blue)] px-5 py-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-blue-hover)]"
        >
          <span className="hidden sm:inline">Search</span>
          <ArrowRight size={16} aria-hidden />
        </button>
      </form>

      {/* ── Row 2: filter pills ── */}
      <div className="flex flex-wrap items-center gap-x-0 border-t border-neutral-100 px-3 py-2.5">

        {/* Kind tabs */}
        <div className="flex flex-wrap gap-1 pr-3">
          {KIND_TABS.map(({ id, label, Icon }) => (
            <Link
              key={label}
              href={buildHref(id, q, sort)}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-neutral-600 transition-all hover:bg-[var(--brand-blue-soft)] hover:text-[var(--brand-blue)]"
            >
              <Icon size={12} aria-hidden />
              {label}
            </Link>
          ))}
        </div>

        <span className="h-5 w-px shrink-0 bg-neutral-200" aria-hidden />

        {/* Format pills */}
        <div className="flex flex-wrap gap-1 px-3">
          {FORMATS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setFormat(id)}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                format === id
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <span className="h-5 w-px shrink-0 bg-neutral-200" aria-hidden />

        {/* Type pills */}
        <div className="flex flex-wrap gap-1 pl-3">
          <button
            type="button"
            onClick={() => setType('all')}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
              type === 'all'
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            All types
          </button>
          <button
            type="button"
            onClick={() => setType('free')}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
              type === 'free'
                ? 'bg-emerald-500 text-white'
                : 'text-neutral-600 hover:bg-emerald-50 hover:text-emerald-700'
            }`}
          >
            <Tag size={11} aria-hidden />
            Free
          </button>
          <button
            type="button"
            onClick={() => setType('premium')}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
              type === 'premium'
                ? 'bg-amber-500 text-white'
                : 'text-neutral-600 hover:bg-amber-50 hover:text-amber-700'
            }`}
          >
            <Crown size={11} aria-hidden />
            Premium
          </button>
        </div>
      </div>
    </div>
  );
}
