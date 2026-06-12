'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, X, Compass, Building2, Map, Globe2, Clock3, LayoutGrid, Rows3 } from 'lucide-react';

const KIND_TABS = [
  { id: null, label: 'All', Icon: Compass },
  { id: 'independent', label: 'Independent', Icon: Building2 },
  { id: 'us-states', label: 'US States', Icon: Map },
  { id: 'autonomy', label: 'Autonomous', Icon: Globe2 },
  { id: 'historical', label: 'Historical', Icon: Clock3 },
] as const;

const SORT_OPTIONS = [
  { id: 'name-asc', label: 'Name · A → Z' },
  { id: 'name-desc', label: 'Name · Z → A' },
  { id: 'designs-desc', label: 'Most designs' },
  { id: 'designs-asc', label: 'Fewest designs' },
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
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('name-asc');
  const [format, setFormat] = useState<'all' | 'svg' | 'png' | 'video'>('all');
  const [type, setType] = useState<'all' | 'free' | 'premium'>('all');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(buildHref(null, q, sort));
  };

  return (
    <div className="w-full">
      <div className="w-full">
        <div className="rounded-2xl border border-white/15 bg-white px-3 py-3 shadow-[0_8px_32px_-4px_rgba(0,0,0,0.2)] sm:px-4">
          <form onSubmit={handleSearch} className="flex w-full flex-col gap-2.5">
            {/* Row 1: search + sort + view */}
            <div className="flex items-center gap-2">
              <div className="relative min-h-11 w-full min-w-0 flex-1">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
                  size={18}
                  aria-hidden
                />
                <input
                  type="text"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search by country or ISO code…"
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-3 pl-11 pr-10 text-sm text-neutral-900 placeholder:text-neutral-400 transition-all focus:border-[var(--brand-blue)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]/15"
                />
                {q ? (
                  <button
                    type="button"
                    onClick={() => setQ('')}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                  >
                    <X size={16} />
                  </button>
                ) : null}
              </div>
              <div className="ml-auto hidden shrink-0 items-center gap-2 min-[620px]:flex">
                <div className="relative">
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    aria-label="Sort countries"
                    className="h-11 min-h-[44px] appearance-none rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 pl-3 pr-10 text-xs font-semibold text-neutral-800 transition-all hover:bg-white focus:border-[var(--brand-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]/15 md:min-w-[10.5rem]"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400" aria-hidden>▾</span>
                </div>
                <div className="flex shrink-0 items-center rounded-xl bg-neutral-100 p-1">
                  <Link
                    href={buildHref(null, q, sort)}
                    aria-label="Grid view"
                    className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-neutral-900 shadow-sm"
                  >
                    <LayoutGrid size={18} aria-hidden />
                  </Link>
                  <Link
                    href={buildHref(null, q, sort) + (buildHref(null, q, sort).includes('?') ? '&view=list' : '?view=list')}
                    aria-label="List view"
                    className="flex h-11 w-11 items-center justify-center rounded-lg text-neutral-500 hover:text-neutral-800"
                  >
                    <Rows3 size={18} aria-hidden />
                  </Link>
                </div>
              </div>
            </div>

            {/* Row 2: filter pills */}
            <div className="hidden border-t border-neutral-100 pt-2.5 min-[620px]:flex min-[620px]:flex-wrap min-[620px]:items-center min-[620px]:gap-x-3 min-[620px]:gap-y-1.5">
              {/* Kind tabs */}
              <div className="flex flex-wrap gap-1">
                {KIND_TABS.map(({ id, label, Icon }) => (
                  <Link
                    key={label}
                    href={buildHref(id, q, sort)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-100/80 px-3 py-2 text-xs font-semibold text-neutral-700 transition-all hover:bg-neutral-200/80"
                  >
                    <Icon size={13} aria-hidden />
                    {label}
                  </Link>
                ))}
              </div>

              <span className="h-5 w-px shrink-0 bg-neutral-200" aria-hidden />

              {/* Format filter */}
              <div className="flex flex-wrap gap-1">
                {(['all', 'svg', 'png', 'video'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => { setFormat(f); router.push(buildHref(null, q, sort)); }}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                      format === f
                        ? 'bg-neutral-800 text-white shadow-sm'
                        : 'bg-neutral-100/80 text-neutral-700 hover:bg-neutral-200/80'
                    }`}
                  >
                    {f === 'all' ? 'All formats' : f.toUpperCase()}
                  </button>
                ))}
              </div>

              <span className="h-5 w-px shrink-0 bg-neutral-200" aria-hidden />

              {/* Type filter */}
              <div className="flex flex-wrap gap-1">
                {(['all', 'free', 'premium'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setType(t); router.push(buildHref(null, q, sort)); }}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                      type === t
                        ? t === 'free'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : t === 'premium'
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'bg-neutral-800 text-white shadow-sm'
                        : 'bg-neutral-100/80 text-neutral-700 hover:bg-neutral-200/80'
                    }`}
                  >
                    {t === 'all' ? 'All types' : t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
