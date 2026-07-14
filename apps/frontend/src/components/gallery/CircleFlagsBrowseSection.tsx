'use client';

import { useState, useMemo, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Search, X, Download, Clock } from 'lucide-react';
import { useClerkUiEnabled } from '@/components/providers/ClerkUiProvider';
import { useAuth as useLegacyAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';

export interface FlagIcon {
  code: string;
  label: string;
  src: string; // public URL
}

export type IconStyle =
  | 'none'
  | 'circle'
  | 'rounded'
  | 'square'
  | 'solid'
  | 'outline'
  | 'wave'
  | 'shadow';

interface StyleCategory {
  id: IconStyle;
  label: string;
  description: string;
  available: boolean;
}

const STYLE_CATEGORIES: StyleCategory[] = [
  { id: 'none',    label: 'Standard',  description: 'Classic rectangular flag icons',       available: true  },
  { id: 'circle',  label: 'Circle',    description: 'Round circular flag icons',             available: true  },
  { id: 'rounded', label: 'Rounded',   description: 'Rounded rectangle flag icons',          available: false },
  { id: 'square',  label: 'Square',    description: 'Square crop flag icons',                available: false },
  { id: 'solid',   label: 'Solid',     description: 'Flat solid color flag icons',           available: false },
  { id: 'outline', label: 'Outline',   description: 'Line / outline style flag icons',       available: false },
  { id: 'wave',    label: 'Wave',      description: 'Waving flag style icons',               available: false },
  { id: 'shadow',  label: '3D Shadow', description: '3D perspective flag icons with shadow', available: false },
];

interface Props {
  rectFlags: FlagIcon[];
  circleFlags: FlagIcon[];
}

export function CircleFlagsBrowseSection({ rectFlags, circleFlags }: Props) {
  const router = useRouter();
  const clerkUiEnabled = useClerkUiEnabled();
  const { isLoaded: clerkLoaded, isSignedIn } = useUser();
  const { user: legacyUser, loading: legacyLoading } = useLegacyAuth();
  const { openModal } = useAuthModal();
  const accountReady = clerkUiEnabled ? clerkLoaded : !legacyLoading;
  const hasDownloadAccount = clerkUiEnabled ? Boolean(isSignedIn) : Boolean(legacyUser);

  const [activeStyle, setActiveStyle] = useState<IconStyle>('none');
  const [q, setQ] = useState('');

  const allFlags = activeStyle === 'circle' ? circleFlags : rectFlags;

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return allFlags;
    return allFlags.filter(f =>
      f.code.toLowerCase().includes(term) ||
      f.label.toLowerCase().includes(term)
    );
  }, [allFlags, q]);

  const activeCategory = STYLE_CATEGORIES.find(c => c.id === activeStyle)!;

  const requireDownloadAccount = (event: MouseEvent<HTMLAnchorElement>) => {
    event.stopPropagation();
    if (accountReady && hasDownloadAccount) return;
    event.preventDefault();
    if (!accountReady) return;
    if (clerkUiEnabled) {
      router.push('/sign-up?redirect_url=/flags');
    } else {
      openModal('signup');
    }
  };

  return (
    <div className="flex flex-col gap-5">

      {/* ── Style category tabs ── */}
      <div className="flex gap-2 flex-wrap">
        {STYLE_CATEGORIES.map(cat => {
          const isActive = activeStyle === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => { if (cat.available) setActiveStyle(cat.id); }}
              title={cat.description}
              disabled={!cat.available}
              className={[
                'relative flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all',
                isActive
                  ? 'border-[#2563eb] bg-[#2563eb] text-white shadow-sm'
                  : cat.available
                  ? 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50'
                  : 'border-neutral-100 bg-neutral-50 text-neutral-400 cursor-not-allowed',
              ].join(' ')}
            >
              {/* Flag thumbnail preview */}
              {cat.id === 'none' && (
                <span className="inline-block h-4 w-6 overflow-hidden rounded-sm border border-current/20 bg-white">
                  <img src="/flags/US.svg" alt="" className="h-full w-full object-cover" loading="lazy" />
                </span>
              )}
              {cat.id === 'circle' && (
                <span className="inline-block h-4 w-4 overflow-hidden rounded-full border border-current/20">
                  <img src="/icons/flags/circle-flags/us.svg" alt="" className="h-full w-full object-cover" loading="lazy" />
                </span>
              )}
              {cat.label}
              {!cat.available && (
                <span className="flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase leading-none text-amber-600">
                  <Clock size={8} /> Soon
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Search bar ── */}
      <div className="relative flex items-center rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <Search className="pointer-events-none absolute left-4 h-4 w-4 text-neutral-400" aria-hidden />
        <input
          type="search"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder={`Filter ${activeCategory.label} icons by code…`}
          className="min-h-11 w-full bg-transparent py-3 pl-11 pr-10 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none"
        />
        {q && (
          <button type="button" onClick={() => setQ('')}
            className="absolute right-3 flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
            aria-label="Clear">
            <X size={13} />
          </button>
        )}
      </div>

      {/* ── Count ── */}
      <p className="text-sm text-neutral-500">
        <span className="font-semibold text-neutral-900">{filtered.length}</span>{' '}
        {activeCategory.label} icon{filtered.length !== 1 ? 's' : ''}
        {q ? ` matching "${q}"` : ''}
      </p>

      {/* ── Grid ── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-neutral-400">
          <Search size={32} className="opacity-30" />
          <p className="text-sm">No icons match your search</p>
        </div>
      ) : activeStyle === 'circle' ? (
        /* Circle flags grid */
        <ul className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 list-none p-0">
          {filtered.map(({ code, label, src }) => (
            <li key={code} className="group relative flex flex-col items-center gap-1.5 rounded-2xl border border-neutral-200 bg-white p-3 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:border-neutral-300">
              <img src={src} alt={label} width={48} height={48}
                className="h-12 w-12 rounded-full object-cover" loading="lazy" />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500 leading-none">{label}</span>
              <a href={src} download={`${code}.svg`}
                className="absolute inset-0 flex items-center justify-center rounded-2xl opacity-0 group-hover:opacity-100 transition-all"
                style={{ background: 'rgba(37,99,235,0.06)' }}
                onClick={requireDownloadAccount} aria-label={`Download ${label}`}>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                  <Download size={14} className="text-[#2563eb]" />
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        /* Rectangle (Standard) flags grid */
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 list-none p-0">
          {filtered.map(({ code, label, src }) => (
            <li key={code} className="group relative flex flex-col items-center gap-1.5 rounded-xl border border-neutral-200 bg-white p-2 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:border-neutral-300">
              <div className="w-full overflow-hidden rounded-md" style={{ aspectRatio: '3/2' }}>
                <img src={src} alt={label} className="h-full w-full object-cover" loading="lazy" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500 leading-none">{label}</span>
              <a href={src} download={`${code}.svg`}
                className="absolute inset-0 flex items-center justify-center rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                style={{ background: 'rgba(37,99,235,0.06)' }}
                onClick={requireDownloadAccount} aria-label={`Download ${label}`}>
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
