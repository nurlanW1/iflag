'use client';

import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { searchFlags } from '@/lib/flag-search';
import { searchTeams } from '@/lib/sport-logos';
import type { VSEntity } from '@/lib/vs-designer-types';

interface SearchDropdownProps {
  mode: 'flag' | 'club';
  onSelect: (entity: Omit<VSEntity, 'type'>) => void;
}

export default function SearchDropdown({ mode, onSelect }: SearchDropdownProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const results =
    mode === 'flag'
      ? searchFlags(query).map((c) => ({ name: c.name, imageUrl: c.flagUrl, sub: c.isoCode.toUpperCase() }))
      : searchTeams(query).map((t) => ({ name: t.name, imageUrl: t.logoUrl, sub: `${t.league}` }));

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" aria-hidden />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={mode === 'flag' ? 'Davlat qidirish...' : 'Klub qidirish...'}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-800/80 py-2 pl-8 pr-3 text-sm text-white placeholder-neutral-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-lg border border-neutral-700 bg-neutral-800 shadow-2xl">
          {results.map((r) => (
            <button
              key={r.name}
              type="button"
              className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-neutral-700/80 transition-colors"
              onClick={() => {
                onSelect({ name: r.name, imageUrl: r.imageUrl });
                setQuery(r.name);
                setOpen(false);
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={r.imageUrl}
                alt={r.name}
                crossOrigin="anonymous"
                className="h-6 w-9 shrink-0 rounded object-contain"
              />
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-white">{r.name}</div>
                <div className="truncate text-xs text-neutral-500">{r.sub}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
