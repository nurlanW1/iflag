'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Search, Upload, Globe, Trophy } from 'lucide-react';
import { ALL_COUNTRIES } from '@/lib/flag-search';
import { POPULAR_TEAMS } from '@/lib/sport-logos';
import type { VSEntity } from '@/lib/vs-designer-types';

type Mode = 'flag' | 'club' | 'import';

interface FlagSliderProps {
  label: string;
  entity: VSEntity;
  onSelect: (e: VSEntity) => void;
  /** compact=true: mobile grid layout instead of 10-row horizontal scroll */
  compact?: boolean;
}

export default function FlagSlider({ label, entity, onSelect, compact = false }: FlagSliderProps) {
  const [mode, setMode] = useState<Mode>('flag');
  const [query, setQuery] = useState('');
  const gridRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const importedUrlRef = useRef<string | null>(null);

  const q = query.toLowerCase();
  const flagItems = q ? ALL_COUNTRIES.filter((c) => c.name.toLowerCase().includes(q)) : ALL_COUNTRIES;
  const clubItems = q
    ? POPULAR_TEAMS.filter((t) => t.name.toLowerCase().includes(q) || t.league.toLowerCase().includes(q))
    : POPULAR_TEAMS;
  const items = mode === 'flag' ? flagItems : mode === 'club' ? clubItems : [];

  function scroll(dir: 'left' | 'right') {
    const el = gridRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -el.clientWidth * 0.8 : el.clientWidth * 0.8, behavior: 'smooth' });
  }

  function handleFileImport(file: File) {
    if (importedUrlRef.current) URL.revokeObjectURL(importedUrlRef.current);
    const url = URL.createObjectURL(file);
    importedUrlRef.current = url;
    onSelect({ name: file.name.replace(/\.[^.]+$/, ''), imageUrl: url, type: 'flag' });
  }

  useEffect(() => {
    return () => {
      if (importedUrlRef.current) URL.revokeObjectURL(importedUrlRef.current);
    };
  }, []);

  const MODES: { id: Mode; icon: React.ReactNode; label: string }[] = [
    { id: 'flag',   icon: <Globe  size={compact ? 16 : 20} />, label: 'Country' },
    { id: 'club',   icon: <Trophy size={compact ? 16 : 20} />, label: 'Club'    },
    { id: 'import', icon: <Upload size={compact ? 16 : 20} />, label: 'Import'  },
  ];

  return (
    <div className="flex h-full flex-col gap-2">
      {/* Label */}
      <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">{label}</div>

      {/* Selected preview */}
      <div className="flex items-center gap-2 rounded-xl border border-neutral-700/70 bg-neutral-800/50 p-2">
        {entity.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={entity.imageUrl} alt={entity.name} crossOrigin="anonymous"
            className="shrink-0 rounded object-contain"
            style={{
              width:  entity.type === 'club' ? (compact ? 36 : 44) : (compact ? 54 : 66),
              height: compact ? 36 : 44,
            }}
          />
        ) : (
          <div className="h-10 w-16 shrink-0 rounded bg-neutral-700/60" />
        )}
        <div className="min-w-0 flex-1">
          <input
            type="text"
            value={entity.name}
            onChange={(e) => onSelect({ ...entity, name: e.target.value })}
            className="w-full bg-transparent text-sm font-bold text-white outline-none placeholder-neutral-600"
            placeholder="Name…"
          />
          <div className="mt-0.5 text-[10px] text-neutral-600">
            {mode === 'club' ? 'Football Club' : mode === 'import' ? 'Custom Image' : 'Country Flag'}
          </div>
        </div>
      </div>

      {/* Mode buttons */}
      <div className="grid grid-cols-3 gap-1.5">
        {MODES.map(({ id, icon, label: lbl }) =>
          id === 'import' ? (
            <label
              key={id}
              className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg py-1.5 transition-colors ${
                mode === id ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200'
              }`}
              onClick={() => setMode(id)}
            >
              {icon}
              <span className="text-[10px] font-semibold leading-none">{lbl}</span>
              <input
                ref={fileRef} type="file" accept="image/*" className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) { handleFileImport(f); e.target.value = ''; }
                }}
              />
            </label>
          ) : (
            <button
              key={id} type="button"
              onClick={() => { setMode(id); setQuery(''); }}
              className={`flex flex-col items-center justify-center gap-1 rounded-lg py-1.5 transition-colors ${
                mode === id ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200'
              }`}
            >
              {icon}
              <span className="text-[10px] font-semibold leading-none">{lbl}</span>
            </button>
          )
        )}
      </div>

      {/* Import drop zone */}
      {mode === 'import' && (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-neutral-700 py-3 text-sm text-neutral-400 transition hover:border-blue-500 hover:text-blue-400"
        >
          <Upload size={16} />
          Click to upload image
        </button>
      )}

      {/* Search */}
      {mode !== 'import' && (
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-600" aria-hidden />
          <input
            type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder={mode === 'flag' ? 'Search country…' : 'Search club…'}
            className="w-full rounded-lg border border-neutral-700/60 bg-neutral-800/60 py-1.5 pl-7 pr-3 text-xs text-white placeholder-neutral-600 outline-none focus:border-blue-500"
          />
        </div>
      )}

      {/* ── Item grid ─────────────────────────────────────────────────── */}
      {mode !== 'import' && (
        compact
          /* Mobile: simple scrollable grid */
          ? (
            <div className="flex-1 overflow-y-auto rounded-lg">
              <div className="grid grid-cols-4 gap-1.5 pb-2 sm:grid-cols-5">
                {items.map((item) => {
                  const url = 'flagUrl' in item ? item.flagUrl : item.logoUrl;
                  const isFlag = mode === 'flag';
                  const isSelected = entity.imageUrl === url;
                  return (
                    <button
                      key={item.name} type="button"
                      onClick={() => onSelect({ name: item.name, imageUrl: url, type: mode as 'flag' | 'club' })}
                      className={`flex flex-col items-center gap-0.5 rounded-lg p-1.5 transition-all ${
                        isSelected
                          ? 'bg-blue-600/30 ring-1 ring-blue-500'
                          : 'bg-neutral-800/40 hover:bg-neutral-700/60'
                      }`}
                      title={item.name}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url} alt={item.name} crossOrigin="anonymous"
                        className="object-contain"
                        style={{ width: isFlag ? 40 : 30, height: isFlag ? 26 : 30 }}
                        loading="lazy"
                      />
                      <span className="w-full truncate text-center text-[8px] leading-tight text-neutral-500">
                        {item.name.split(' ').slice(0, 2).join(' ')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )
          /* Desktop: 10-row horizontal scroll */
          : (
            <div className="relative min-h-0 flex-1">
              <button
                type="button" onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 z-20 -translate-y-1/2 rounded-md bg-neutral-900/95 p-0.5 text-neutral-400 shadow-lg transition hover:bg-neutral-800 hover:text-white"
                aria-label="Scroll left"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button" onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 z-20 -translate-y-1/2 rounded-md bg-neutral-900/95 p-0.5 text-neutral-400 shadow-lg transition hover:bg-neutral-800 hover:text-white"
                aria-label="Scroll right"
              >
                <ChevronRight size={16} />
              </button>

              <div
                ref={gridRef}
                className="h-full overflow-x-auto overflow-y-hidden"
                style={{
                  display: 'grid',
                  gridTemplateRows: 'repeat(10, auto)',
                  gridAutoFlow: 'column',
                  gridAutoColumns: mode === 'flag' ? 74 : 68,
                  gap: 4,
                  padding: '0 22px',
                  scrollSnapType: 'x mandatory',
                  scrollbarWidth: 'none',
                  WebkitMaskImage: 'linear-gradient(to right, transparent 0px, black 28px, black calc(100% - 28px), transparent 100%)',
                  maskImage: 'linear-gradient(to right, transparent 0px, black 28px, black calc(100% - 28px), transparent 100%)',
                }}
              >
                {items.map((item) => {
                  const url = 'flagUrl' in item ? item.flagUrl : item.logoUrl;
                  const isSelected = entity.imageUrl === url;
                  return (
                    <button
                      key={item.name} type="button"
                      onClick={() => onSelect({ name: item.name, imageUrl: url, type: mode as 'flag' | 'club' })}
                      className={`flex flex-col items-center justify-center gap-0.5 rounded-lg p-1 transition-all ${
                        isSelected
                          ? 'bg-blue-600/30 ring-1 ring-blue-500'
                          : 'bg-neutral-800/30 hover:bg-neutral-700/60'
                      }`}
                      style={{ scrollSnapAlign: 'start', width: mode === 'flag' ? 74 : 68 }}
                      title={item.name}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url} alt={item.name} crossOrigin="anonymous"
                        className="shrink-0 object-contain"
                        style={{ width: mode === 'flag' ? 52 : 38, height: mode === 'flag' ? 34 : 38 }}
                        loading="lazy"
                      />
                      <span className="w-full truncate text-center text-[8.5px] leading-tight text-neutral-500">
                        {item.name.split(' ').slice(0, 2).join(' ')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )
      )}
    </div>
  );
}
