'use client';

import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { ALL_COUNTRIES } from '@/lib/flag-search';
import { POPULAR_TEAMS } from '@/lib/sport-logos';
import type { VSEntity } from '@/lib/vs-designer-types';

interface FlagSliderProps {
  label: string;
  entity: VSEntity;
  onSelect: (e: VSEntity) => void;
}

export default function FlagSlider({ label, entity, onSelect }: FlagSliderProps) {
  const [mode, setMode] = useState<'flag' | 'club'>('flag');
  const [query, setQuery] = useState('');
  const gridRef = useRef<HTMLDivElement>(null);

  const q = query.toLowerCase();
  const flagItems = q
    ? ALL_COUNTRIES.filter((c) => c.name.toLowerCase().includes(q))
    : ALL_COUNTRIES;
  const clubItems = q
    ? POPULAR_TEAMS.filter((t) => t.name.toLowerCase().includes(q) || t.league.toLowerCase().includes(q))
    : POPULAR_TEAMS;
  const items = mode === 'flag' ? flagItems : clubItems;

  function scroll(dir: 'left' | 'right') {
    const el = gridRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -el.clientWidth : el.clientWidth, behavior: 'smooth' });
  }

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Label */}
      <div className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">{label}</div>

      {/* Selected preview */}
      <div className="flex items-center gap-3 rounded-xl border border-neutral-700 bg-neutral-800/60 p-3">
        {entity.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={entity.imageUrl} alt={entity.name} crossOrigin="anonymous"
            className="h-11 shrink-0 object-contain"
            style={{ width: entity.type === 'club' ? 44 : 66 }}
          />
        )}
        <div className="min-w-0 flex-1">
          <input
            type="text"
            value={entity.name}
            onChange={(e) => onSelect({ ...entity, name: e.target.value })}
            className="w-full bg-transparent text-sm font-bold text-white outline-none"
          />
          <div className="text-[11px] text-neutral-500">{mode === 'flag' ? 'Country Flag' : 'Football Club'}</div>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex overflow-hidden rounded-lg border border-neutral-700">
        {(['flag', 'club'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setQuery(''); }}
            className={`flex-1 py-1.5 text-xs font-semibold transition-colors ${m === mode ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}
          >
            {m === 'flag' ? '🏳 Country' : '⚽ Club'}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" aria-hidden />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={mode === 'flag' ? 'Search country...' : 'Search club...'}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-800 py-2 pl-7 pr-3 text-sm text-white placeholder-neutral-600 outline-none focus:border-blue-500"
        />
      </div>

      {/* Slider */}
      <div className="relative flex-1">
        {/* Arrows */}
        <button
          type="button" onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-lg bg-neutral-900/90 p-1 text-neutral-300 shadow hover:bg-neutral-800 hover:text-white"
          aria-label="Scroll left"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button" onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-lg bg-neutral-900/90 p-1 text-neutral-300 shadow hover:bg-neutral-800 hover:text-white"
          aria-label="Scroll right"
        >
          <ChevronRight size={18} />
        </button>

        {/* 2-row horizontal grid */}
        <div
          ref={gridRef}
          className="h-full overflow-x-auto overflow-y-hidden"
          style={{
            display: 'grid',
            gridTemplateRows: 'repeat(2, 1fr)',
            gridAutoFlow: 'column',
            gridAutoColumns: mode === 'flag' ? 78 : 72,
            gap: 6,
            padding: '0 28px',
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none',
          }}
        >
          {items.map((item) => {
            const url = 'flagUrl' in item ? item.flagUrl : item.logoUrl;
            const selected = entity.imageUrl === url;
            return (
              <button
                key={item.name}
                type="button"
                onClick={() => onSelect({ name: item.name, imageUrl: url, type: mode })}
                className={`flex flex-col items-center justify-start gap-1 rounded-lg p-1.5 transition-all hover:bg-neutral-700/80 ${
                  selected ? 'bg-blue-600/25 ring-1 ring-blue-500' : 'bg-neutral-800/40'
                }`}
                style={{ scrollSnapAlign: 'start', width: mode === 'flag' ? 78 : 72 }}
                title={item.name}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url} alt={item.name} crossOrigin="anonymous"
                  className="shrink-0 object-contain"
                  style={{
                    width: mode === 'flag' ? 54 : 40,
                    height: mode === 'flag' ? 36 : 40,
                  }}
                />
                <span className="w-full truncate text-center text-[9px] leading-tight text-neutral-400">
                  {item.name.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
