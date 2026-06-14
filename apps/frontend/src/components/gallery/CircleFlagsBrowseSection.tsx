'use client';

import { useState, useMemo } from 'react';
import { Search, X, Download } from 'lucide-react';

interface CircleFlag {
  code: string; // filename without .svg, e.g. "us", "gb", "af-emirate"
  label: string; // display label e.g. "US", "GB", "AF-EMIRATE"
}

export function CircleFlagsBrowseSection({ flags }: { flags: CircleFlag[] }) {
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return flags;
    return flags.filter(f =>
      f.code.includes(term) || f.label.toLowerCase().includes(term)
    );
  }, [flags, q]);

  return (
    <div className="flex flex-col gap-6">
      {/* Search bar */}
      <div className="relative flex items-center rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <Search className="pointer-events-none absolute left-4 h-4 w-4 text-neutral-400" aria-hidden />
        <input
          type="search"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Filter by code (e.g. us, gb, af…)"
          className="min-h-12 w-full bg-transparent py-3 pl-11 pr-10 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ('')}
            className="absolute right-3 flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
            aria-label="Clear"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Count */}
      <p className="text-sm text-neutral-500">
        <span className="font-semibold text-neutral-900">{filtered.length}</span> icon{filtered.length !== 1 ? 's' : ''}
        {q ? ` matching "${q}"` : ''}
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-neutral-400">
          <Search size={32} className="opacity-30" />
          <p className="text-sm">No icons match your search</p>
        </div>
      ) : (
        <ul className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 list-none p-0">
          {filtered.map(({ code, label }) => (
            <li key={code} className="group relative flex flex-col items-center gap-2 rounded-2xl border border-neutral-200 bg-white p-3 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:border-neutral-300">
              <img
                src={`/icons/flags/circle-flags/${code}.svg`}
                alt={label}
                width={48}
                height={48}
                className="h-12 w-12 rounded-full object-cover"
                loading="lazy"
              />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500 leading-none">
                {label}
              </span>
              {/* Download overlay */}
              <a
                href={`/icons/flags/circle-flags/${code}.svg`}
                download={`${code}.svg`}
                className="absolute inset-0 flex items-center justify-center rounded-2xl bg-[#2563eb]/0 opacity-0 group-hover:bg-[#2563eb]/8 group-hover:opacity-100 transition-all"
                aria-label={`Download ${label}`}
                onClick={e => e.stopPropagation()}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                  <Download size={14} className="text-[#2563eb]" />
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
