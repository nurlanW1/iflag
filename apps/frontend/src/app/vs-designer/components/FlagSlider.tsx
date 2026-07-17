'use client';

import { useEffect, useRef, useState } from 'react';
import { Flag, Search, Trophy, Upload } from 'lucide-react';
import { ALL_COUNTRIES } from '@/lib/flag-search';
import { POPULAR_TEAMS, type FootballTeam } from '@/lib/sport-logos';
import type { VSEntity } from '@/lib/vs-designer-types';

type Mode = 'flag' | 'club' | 'import';

interface FlagSliderProps {
  label: string;
  entity: VSEntity;
  onSelect: (e: VSEntity) => void;
  compact?: boolean;
}

const modeButtonBase =
  'inline-flex h-9 items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-bold transition';
const modeButtonInactive = 'bg-transparent text-white/45 hover:bg-white/[0.07] hover:text-white';

let r2ClubLogoCache: FootballTeam[] | null = null;
let r2ClubLogoPromise: Promise<FootballTeam[]> | null = null;

async function loadR2ClubLogos(): Promise<FootballTeam[]> {
  if (r2ClubLogoCache) return r2ClubLogoCache;
  r2ClubLogoPromise ??= fetch('/api/vs-designer/clubs', { cache: 'no-store' })
    .then((res) => (res.ok ? res.json() : { clubs: [] }))
    .then((data) => (Array.isArray(data.clubs) ? data.clubs as FootballTeam[] : []))
    .catch(() => []);

  r2ClubLogoCache = await r2ClubLogoPromise;
  return r2ClubLogoCache;
}

export default function FlagSlider({ entity, onSelect, compact = false }: FlagSliderProps) {
  const [mode, setMode] = useState<Mode>(entity.type === 'club' ? 'club' : 'flag');
  const [query, setQuery] = useState('');
  const [r2ClubLogos, setR2ClubLogos] = useState<FootballTeam[]>(r2ClubLogoCache ?? []);
  const fileRef = useRef<HTMLInputElement>(null);
  const importedUrlRef = useRef<string | null>(null);

  const q = query.toLowerCase();
  const flagItems = q ? ALL_COUNTRIES.filter((c) => c.name.toLowerCase().includes(q)) : ALL_COUNTRIES;
  const allClubItems = [
    ...r2ClubLogos,
    ...POPULAR_TEAMS.filter((team) =>
      !r2ClubLogos.some((r2Team) => r2Team.name.toLowerCase() === team.name.toLowerCase()),
    ),
  ];
  const clubItems = q
    ? allClubItems.filter((t) =>
        t.name.toLowerCase().includes(q) ||
        t.league.toLowerCase().includes(q) ||
        t.country.toLowerCase().includes(q))
    : allClubItems;
  const items = mode === 'flag' ? flagItems : mode === 'club' ? clubItems : [];

  function handleFileImport(file: File) {
    if (importedUrlRef.current) URL.revokeObjectURL(importedUrlRef.current);
    const url = URL.createObjectURL(file);
    importedUrlRef.current = url;
    setMode('import');
    onSelect({ name: file.name.replace(/\.[^.]+$/, ''), imageUrl: url, type: 'club' });
  }

  useEffect(() => {
    return () => {
      if (importedUrlRef.current) URL.revokeObjectURL(importedUrlRef.current);
    };
  }, []);

  useEffect(() => {
    let active = true;
    void loadR2ClubLogos().then((clubs) => {
      if (active) setR2ClubLogos(clubs);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col gap-2.5">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleFileImport(file);
            e.target.value = '';
          }
        }}
      />

      <div className="rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.075),rgba(255,255,255,0.035))] p-3 shadow-[0_18px_40px_-34px_rgba(59,130,246,0.9)]">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/32">Selected</span>
          <span className="rounded-full border border-white/10 bg-black/25 px-2 py-0.5 text-[8px] font-black uppercase tracking-wide text-white/35">
            {entity.type === 'club' ? 'Club' : 'Country'}
          </span>
        </div>
        <div className="grid grid-cols-[4.75rem_minmax(0,1fr)] items-center gap-3">
          <div className="flex h-14 w-[4.75rem] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-black/30 ring-1 ring-white/[0.03]">
            {entity.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={entity.imageUrl}
                alt={entity.name}
                crossOrigin="anonymous"
                className="max-h-11 max-w-[4.6rem] object-contain"
              />
            ) : (
              <div className="h-8 w-12 rounded bg-neutral-700/70" />
            )}
          </div>
          <label className="min-w-0 flex-1">
            <span className="text-[9px] font-black uppercase tracking-[0.16em] text-white/32">Display name</span>
            <input
              type="text"
              value={entity.name}
              onChange={(e) => onSelect({ ...entity, name: e.target.value })}
              className="mt-1 h-9 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm font-bold text-white outline-none transition placeholder:text-white/20 focus:border-blue-400 focus:bg-black/40"
              placeholder="Team name"
            />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-2xl border border-white/10 bg-black/25 p-1.5 shadow-inner shadow-black/20">
        <button
          type="button"
          onClick={() => {
            setMode('flag');
            setQuery('');
          }}
          className={`${modeButtonBase} ${mode === 'flag' ? 'bg-blue-600 text-white shadow-[0_12px_26px_-18px_rgba(37,99,235,0.95)]' : modeButtonInactive}`}
        >
          <Flag
            size={18}
            strokeWidth={2.8}
            className={`shrink-0 drop-shadow-sm ${mode === 'flag' ? 'text-cyan-200' : 'text-sky-400'}`}
            aria-hidden
          />
          Country
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('club');
            setQuery('');
          }}
          className={`${modeButtonBase} ${mode === 'club' ? 'bg-amber-500 text-black shadow-[0_12px_26px_-18px_rgba(245,158,11,0.95)]' : modeButtonInactive}`}
        >
          <Trophy size={16} className={mode === 'club' ? 'text-black' : 'text-amber-300'} aria-hidden />
          Club
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className={`${modeButtonBase} ${mode === 'import' ? 'bg-emerald-500 text-black shadow-[0_12px_26px_-18px_rgba(16,185,129,0.95)]' : modeButtonInactive}`}
        >
          <Upload size={16} className={mode === 'import' ? 'text-black' : 'text-emerald-300'} aria-hidden />
          Import
        </button>
      </div>

      {mode === 'import' ? (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex min-h-[9rem] flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.035] px-4 text-center text-sm font-semibold text-white/50 transition hover:border-blue-400/60 hover:bg-blue-500/10 hover:text-white"
        >
          <Upload size={22} className="mb-2" aria-hidden />
          Upload a transparent PNG logo, flag, or stadium image
        </button>
      ) : (
        <>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" aria-hidden />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={mode === 'flag' ? 'Search country...' : 'Search football club...'}
              className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.055] py-2 pl-9 pr-3 text-xs font-semibold text-white outline-none transition placeholder:text-white/25 focus:border-blue-400 focus:bg-white/[0.08]"
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.2)_transparent]">
            <div className={`grid gap-1.5 pb-2 ${compact ? 'grid-cols-4 sm:grid-cols-5' : 'grid-cols-3 xl:grid-cols-4'}`}>
              {items.map((item) => {
                const url = 'flagUrl' in item ? item.flagUrl : item.logoUrl;
                const isFlag = mode === 'flag';
                const isSelected = entity.imageUrl === url;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => onSelect({ name: item.name, imageUrl: url, type: mode as 'flag' | 'club' })}
                    className={`group flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-xl border p-1.5 transition ${
                      isSelected
                        ? 'border-blue-400 bg-blue-600/25 text-white ring-1 ring-blue-400/45'
                        : 'border-white/8 bg-white/[0.045] text-white/40 hover:border-white/18 hover:bg-white/[0.08] hover:text-white/80'
                    }`}
                    title={item.name}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={item.name}
                      crossOrigin="anonymous"
                      className="shrink-0 object-contain"
                      style={{ width: isFlag ? 52 : 40, height: isFlag ? 34 : 40 }}
                      loading="lazy"
                    />
                    <span className="w-full truncate text-center text-[9px] font-semibold leading-tight">
                      {item.name.split(' ').slice(0, 2).join(' ')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
