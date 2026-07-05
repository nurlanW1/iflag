'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { ChevronLeft, ChevronRight, Crown, Download, Lock, Settings2, X } from 'lucide-react';
import { CheckoutButton } from '@/components/billing/CheckoutButton';
import { useClerkUiEnabled } from '@/components/providers/ClerkUiProvider';
import { useAuth as useLegacyAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { PRICING_MARKETING } from '@/lib/marketing/pricing-config';
import { defaultState, type VSDesignerState } from '@/lib/vs-designer-types';
import VSCanvas, { renderVSDesignToCanvas } from './components/VSCanvas';
import FlagSlider from './components/FlagSlider';

const BG_PRESETS = [
  { label: 'Navy',     color: '#0A1628' },
  { label: 'Black',    color: '#000000' },
  { label: 'Slate',    color: '#0f172a' },
  { label: 'Charcoal', color: '#111827' },
  { label: 'Forest',   color: '#0a1a0a' },
  { label: 'Wine',     color: '#1a0608' },
  { label: 'Indigo',   color: '#1e1b4b' },
  { label: 'Purple',   color: '#1a0a2a' },
];

function ColorSwatch({ value, onChange, title }: { value: string; onChange: (v: string) => void; title?: string }) {
  return (
    <label className="relative block h-8 w-8 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-white/15 shadow-sm ring-1 ring-black/20" title={title}>
      <div className="h-full w-full" style={{ backgroundColor: value }} />
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" />
    </label>
  );
}

type MobileTab = 'left' | 'settings' | 'right';
type ExportTier = 'premium' | 'watermarked';

const VS_DESIGNER_PRODUCT_SLUG = 'vs-designer-export';
const VS_DESIGNER_ASSET_GROUP_KEY = 'tool:vs-designer-export';
const VS_DESIGNER_CHECKOUT_SUCCESS_PATH = '/vs-designer?checkout=vs-designer-export';
const VS_DESIGNER_STATE_KEY = 'flagswing.vsDesigner.state';
const VS_DESIGNER_PENDING_KEY = 'flagswing.vsDesigner.pendingPremiumExport';

function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png', 1.0);
  link.click();
}

function makeWatermarkedPreview(source: HTMLCanvasElement): HTMLCanvasElement {
  const out = document.createElement('canvas');
  out.width = source.width;
  out.height = source.height;
  const ctx = out.getContext('2d');
  if (!ctx) return source;

  ctx.drawImage(source, 0, 0);

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 42px Arial, sans-serif';
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(0,0,0,0.12)';
  ctx.fillStyle = 'rgba(255,255,255,0.30)';
  ctx.strokeText('FLAGSWING FREE PREVIEW', out.width / 2, out.height / 2 + 105);
  ctx.fillText('FLAGSWING FREE PREVIEW', out.width / 2, out.height / 2 + 105);
  ctx.restore();

  return out;
}

function isDesignerState(value: unknown): value is VSDesignerState {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<VSDesignerState>;
  return (
    typeof v.bgColor === 'string' &&
    typeof v.eventTitle === 'string' &&
    typeof v.left?.name === 'string' &&
    typeof v.left?.imageUrl === 'string' &&
    typeof v.right?.name === 'string' &&
    typeof v.right?.imageUrl === 'string'
  );
}

export default function VSDesignerClient() {
  const router = useRouter();
  const clerkUiEnabled = useClerkUiEnabled();
  const { isLoaded: clerkUserLoaded, isSignedIn } = useUser();
  const { user: legacyUser, loading: legacyAuthLoading } = useLegacyAuth();
  const { openModal } = useAuthModal();
  const accountReady = clerkUiEnabled ? clerkUserLoaded : !legacyAuthLoading;
  const hasExportAccount = clerkUiEnabled ? Boolean(isSignedIn) : Boolean(legacyUser);

  const [state, setState]         = useState<VSDesignerState>(defaultState);
  const [exporting, setExporting] = useState(false);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(false);
  const [checkoutPending, setCheckoutPending] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [premiumUnlocked, setPremiumUnlocked] = useState(false);
  const [stateRestored, setStateRestored] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>('left');

  const canvasRef    = useRef<HTMLDivElement>(null);
  const scaleRef     = useRef<HTMLDivElement>(null);
  const wrapperRef   = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoExportedRef = useRef(false);

  const onChange = useCallback((patch: Partial<VSDesignerState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const requireExportAccount = useCallback(() => {
    if (!accountReady) return false;
    if (hasExportAccount) return true;
    if (clerkUiEnabled) {
      router.push(`/sign-up?redirect_url=${encodeURIComponent('/vs-designer')}`);
    } else {
      openModal('signup');
    }
    return false;
  }, [accountReady, hasExportAccount, clerkUiEnabled, openModal, router]);

  useEffect(() => {
    try {
      const savedState = window.localStorage.getItem(VS_DESIGNER_STATE_KEY);
      if (savedState) {
        const parsed = JSON.parse(savedState) as unknown;
        if (isDesignerState(parsed)) {
          setState(parsed);
        }
      }

      const params = new URLSearchParams(window.location.search);
      const checkoutReturn = params.get('checkout') === VS_DESIGNER_PRODUCT_SLUG;
      const pending = window.localStorage.getItem(VS_DESIGNER_PENDING_KEY);
      if (checkoutReturn || pending) {
        setPurchaseOpen(true);
        setCheckoutPending(true);
        setAccessError('Waiting for Paddle confirmation. HD download will start automatically.');
      }
      if (checkoutReturn) {
        window.history.replaceState(null, '', '/vs-designer');
      }
    } catch {
      // Local storage is an enhancement only; the designer still works without it.
    } finally {
      setStateRestored(true);
    }
  }, []);

  useEffect(() => {
    if (!stateRestored) return;
    try {
      window.localStorage.setItem(VS_DESIGNER_STATE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota/private-mode errors.
    }
  }, [state, stateRestored]);

  const checkPremiumOwnership = useCallback(async (): Promise<boolean> => {
    const qs = new URLSearchParams({
      productSlug: VS_DESIGNER_PRODUCT_SLUG,
      assetGroupKey: VS_DESIGNER_ASSET_GROUP_KEY,
    });
    const res = await fetch(`/api/billing/ownership?${qs.toString()}`, {
      credentials: 'include',
      cache: 'no-store',
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { ownsProduct?: boolean; alreadyPurchased?: boolean };
    return Boolean(data.ownsProduct || data.alreadyPurchased);
  }, []);

  const markPremiumUnlockedAndExport = useCallback(() => {
    setPremiumUnlocked(true);
    setPurchaseOpen(false);
    setCheckoutPending(false);
    setAccessError(null);
    try {
      window.localStorage.removeItem(VS_DESIGNER_PENDING_KEY);
    } catch {
      // Ignore storage errors.
    }
    if (!autoExportedRef.current) {
      autoExportedRef.current = true;
      window.setTimeout(() => {
        void handleExport('premium');
      }, 250);
    }
  }, []);

  const beginPremiumCheckout = useCallback(() => {
    autoExportedRef.current = false;
    setCheckoutPending(true);
    setPurchaseOpen(true);
    setAccessError('Waiting for Paddle confirmation. HD download will start automatically.');
    try {
      window.localStorage.setItem(VS_DESIGNER_STATE_KEY, JSON.stringify(state));
      window.localStorage.setItem(
        VS_DESIGNER_PENDING_KEY,
        JSON.stringify({
          productSlug: VS_DESIGNER_PRODUCT_SLUG,
          assetGroupKey: VS_DESIGNER_ASSET_GROUP_KEY,
          startedAt: Date.now(),
        }),
      );
    } catch {
      // Ignore storage errors.
    }
  }, [state]);

  useEffect(() => {
    const nav = document.querySelector('nav[aria-label="Primary"]') as HTMLElement | null;
    const navH = nav?.offsetHeight ?? 64;
    if (containerRef.current) containerRef.current.style.top = `${navH}px`;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    function update() {
      if (!wrapperRef.current || !scaleRef.current) return;
      scaleRef.current.style.transform = `scale(${wrapperRef.current.clientWidth / 1920})`;
    }
    update();
    const ro = new ResizeObserver(update);
    if (wrapperRef.current) ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!checkoutPending) return;
    let stopped = false;
    const startedAt = Date.now();

    const poll = async () => {
      if (stopped) return;
      try {
        const owns = await checkPremiumOwnership();
        if (stopped) return;
        if (owns) {
          markPremiumUnlockedAndExport();
          return;
        }
        if (Date.now() - startedAt > 120_000) {
          setCheckoutPending(false);
          setAccessError('Payment is not confirmed yet. Click "I already paid" after Paddle finishes.');
        }
      } catch {
        if (!stopped) {
          setAccessError('Still checking Paddle confirmation. HD download starts automatically after payment syncs.');
        }
      }
    };

    void poll();
    const interval = window.setInterval(() => void poll(), 3000);
    return () => {
      stopped = true;
      window.clearInterval(interval);
    };
  }, [checkoutPending, checkPremiumOwnership, markPremiumUnlockedAndExport]);

  async function renderExportCanvas(tier: ExportTier): Promise<HTMLCanvasElement | null> {
    const canvas = await renderVSDesignToCanvas(state, 1);
    return tier === 'watermarked' ? makeWatermarkedPreview(canvas) : canvas;
  }
  async function handleExport(tier: ExportTier) {
    if (!requireExportAccount()) return;
    setExporting(true);
    try {
      const canvas = await renderExportCanvas(tier);
      if (!canvas) return;
      const suffix = tier === 'premium' ? 'premium-hd' : 'free-preview';
      downloadCanvas(canvas, `vs-${suffix}-${Date.now()}.png`);
    } finally {
      setExporting(false);
    }
  }

  async function verifyPremiumAndExport() {
    if (!requireExportAccount()) return;
    setAccessError(null);
    if (premiumUnlocked) {
      await handleExport('premium');
      return;
    }
    setCheckingAccess(true);
    try {
      const owns = await checkPremiumOwnership();
      if (owns) {
        markPremiumUnlockedAndExport();
        return;
      }
      setPurchaseOpen(true);
      setAccessError('No confirmed purchase found yet. Use Paddle checkout or retry after payment finishes.');
    } catch {
      setPurchaseOpen(true);
      setAccessError('Network error while checking premium access.');
    } finally {
      setCheckingAccess(false);
    }
  }

  /* ─── Controls panel (shared between desktop panel + mobile settings tab) ── */
  const renderControlRows = () => (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 md:flex-nowrap md:overflow-x-auto">
      {/* LEFT name */}
      <div className="flex shrink-0 items-center gap-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Left</span>
        <input value={state.left.name} onChange={(e) => onChange({ left: { ...state.left, name: e.target.value } })}
          className="w-20 rounded border border-neutral-700 bg-neutral-800 px-1.5 py-0.5 text-xs text-white outline-none focus:border-blue-500" />
      </div>
      {/* EVENT */}
      <div className="flex shrink-0 items-center gap-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Event</span>
        <input value={state.eventTitle} onChange={(e) => onChange({ eventTitle: e.target.value })}
          className="w-24 rounded border border-neutral-700 bg-neutral-800 px-1.5 py-0.5 text-xs text-white outline-none focus:border-blue-500" />
      </div>
      {/* RIGHT name */}
      <div className="flex shrink-0 items-center gap-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Right</span>
        <input value={state.right.name} onChange={(e) => onChange({ right: { ...state.right, name: e.target.value } })}
          className="w-20 rounded border border-neutral-700 bg-neutral-800 px-1.5 py-0.5 text-xs text-white outline-none focus:border-blue-500" />
      </div>
      <div className="h-4 w-px shrink-0 bg-neutral-700" />
      {/* SCORE toggle + inputs */}
      <div className="flex shrink-0 items-center gap-1">
        <button type="button" onClick={() => onChange({ scoreMode: !state.scoreMode })}
          className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide transition-colors ${
            state.scoreMode ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'}`}>
          Score
        </button>
        {state.scoreMode ? (
          <div className="flex items-center gap-1">
            <input type="text" value={state.leftScore} maxLength={3} onChange={(e) => onChange({ leftScore: e.target.value })}
              className="w-9 rounded border border-neutral-700 bg-neutral-800 py-0.5 text-center text-xs font-bold text-white outline-none focus:border-blue-500" />
            <span className="text-neutral-500">–</span>
            <input type="text" value={state.rightScore} maxLength={3} onChange={(e) => onChange({ rightScore: e.target.value })}
              className="w-9 rounded border border-neutral-700 bg-neutral-800 py-0.5 text-center text-xs font-bold text-white outline-none focus:border-blue-500" />
          </div>
        ) : (
          <input type="text" value={state.vsText} onChange={(e) => onChange({ vsText: e.target.value })}
            className="w-12 rounded border border-neutral-700 bg-neutral-800 px-1.5 py-0.5 text-center text-xs font-bold text-white outline-none focus:border-blue-500" />
        )}
      </div>
      <div className="h-4 w-px shrink-0 bg-neutral-700" />
      {/* DATE */}
      <div className="flex shrink-0 items-center gap-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Date</span>
        <div className="flex overflow-hidden rounded border border-neutral-700">
          {(['auto', 'manual'] as const).map((m) => (
            <button key={m} type="button" onClick={() => onChange({ dateMode: m })}
              className={`px-1.5 py-0.5 text-[10px] font-semibold transition-colors ${
                state.dateMode === m ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-500 hover:bg-neutral-700'}`}>
              {m === 'auto' ? 'Auto' : 'Custom'}
            </button>
          ))}
        </div>
        {state.dateMode === 'manual' && (
          <input value={state.dateText} placeholder="JUNE 26, 2026" onChange={(e) => onChange({ dateText: e.target.value })}
            className="w-28 rounded border border-neutral-700 bg-neutral-800 px-1.5 py-0.5 text-xs text-white outline-none focus:border-blue-500" />
        )}
      </div>
      <div className="h-4 w-px shrink-0 bg-neutral-700" />
      {/* BG presets */}
      <div className="flex shrink-0 items-center gap-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">BG</span>
        {BG_PRESETS.map((p) => (
          <button key={p.color} type="button" title={p.label} onClick={() => onChange({ bgColor: p.color })}
            style={{ backgroundColor: p.color }}
            className={`h-6 w-6 shrink-0 rounded-md border-2 shadow-sm transition-transform hover:scale-110 ${
              state.bgColor === p.color ? 'border-blue-400 ring-2 ring-blue-400/30' : 'border-neutral-600'}`} />
        ))}
        <label className="cursor-pointer" title="Custom">
          <div className="flex h-6 w-6 items-center justify-center rounded-md border-2 border-dashed border-neutral-600 text-[11px] font-bold text-neutral-400 shadow-sm hover:border-blue-400"
            style={{ backgroundColor: BG_PRESETS.some((p) => p.color === state.bgColor) ? undefined : state.bgColor }}>+</div>
          <input type="color" value={state.bgColor} onChange={(e) => onChange({ bgColor: e.target.value })} className="sr-only" />
        </label>
      </div>
      <div className="h-4 w-px shrink-0 bg-neutral-700" />
      {/* NAME size + color */}
      <div className="flex shrink-0 items-center gap-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Name</span>
        <input type="range" min={14} max={40} value={state.nameSize} onChange={(e) => onChange({ nameSize: Number(e.target.value) })} className="w-14 accent-blue-500" />
        <span className="w-5 text-[10px] text-neutral-600">{state.nameSize}</span>
        <ColorSwatch value={state.nameColor} onChange={(v) => onChange({ nameColor: v })} title="Name color" />
      </div>
      {/* TITLE size + color */}
      <div className="flex shrink-0 items-center gap-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Title</span>
        <input type="range" min={14} max={56} value={state.titleSize} onChange={(e) => onChange({ titleSize: Number(e.target.value) })} className="w-14 accent-blue-500" />
        <span className="w-5 text-[10px] text-neutral-600">{state.titleSize}</span>
        <ColorSwatch value={state.titleColor} onChange={(v) => onChange({ titleColor: v })} title="Title color" />
      </div>
      {/* SCORE/VS size + color */}
      <div className="flex shrink-0 items-center gap-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">{state.scoreMode ? 'Score' : 'VS'}</span>
        <input type="range" min={60} max={160} value={state.centerSize} onChange={(e) => onChange({ centerSize: Number(e.target.value) })} className="w-14 accent-blue-500" />
        <span className="w-5 text-[10px] text-neutral-600">{state.centerSize}</span>
        <ColorSwatch value={state.centerColor} onChange={(v) => onChange({ centerColor: v })} title="Score/VS color" />
      </div>
    </div>
  );

  return (
    <div
      ref={containerRef}
      className="fixed left-0 right-0 bottom-0 z-40 flex flex-col bg-[#070910] text-white"
      style={{ top: 64 }}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#0b0e14]/95 px-3 shadow-[0_8px_30px_-24px_rgba(59,130,246,0.7)] backdrop-blur md:px-5" style={{ height: 64 }}>
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-blue-400/25 bg-blue-500/12 text-blue-200 shadow-[0_0_24px_rgba(37,99,235,0.18)]">
            <Crown size={18} aria-hidden />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-tight text-white md:text-lg">VS Designer</span>
              <span className="hidden rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/55 sm:inline">
                1920x1080
              </span>
            </div>
            <p className="hidden truncate text-[11px] font-semibold text-white/45 md:block">
              Match graphics, flags, scores, club logos, and clean PNG export
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button" onClick={() => void handleExport('watermarked')} disabled={exporting || checkingAccess || !accountReady}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/12 bg-white/[0.06] px-3 text-xs font-bold text-white/85 shadow-sm transition hover:border-white/20 hover:bg-white/[0.1] disabled:opacity-60 sm:px-4"
          >
            <Download size={14} aria-hidden />
            <span className="sm:hidden">Free</span>
            <span className="hidden sm:inline">Free preview</span>
          </button>
          <button
            type="button" onClick={() => void verifyPremiumAndExport()} disabled={exporting || checkingAccess || !accountReady}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-3 text-xs font-black text-white shadow-[0_10px_30px_-16px_rgba(37,99,235,0.9)] transition hover:bg-blue-500 disabled:opacity-60 sm:px-5 sm:text-sm"
          >
            {premiumUnlocked ? <Download size={14} aria-hidden /> : <Crown size={14} aria-hidden />}
            {exporting ? 'Exporting...' : checkingAccess ? 'Checking...' : premiumUnlocked ? 'Export HD' : <><span className="sm:hidden">Premium</span><span className="hidden sm:inline">Premium PNG $1</span></>}
          </button>
        </div>
      </div>
      {/* ── Desktop controls (hidden on mobile) ─────────────────────────── */}
      <div className="hidden shrink-0 border-b border-white/10 bg-[#10131b]/95 px-5 py-2.5 shadow-[0_8px_30px_-28px_rgba(0,0,0,0.9)] md:block">
        {renderControlRows()}
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      {/*
        Single flex-row: sidebars hidden on mobile via hidden md:flex.
        Canvas lives ONCE inside the center column — no duplication.
        On mobile the center column is full-width (sidebars not rendered).
      */}
      <div className="flex min-h-0 flex-1 bg-[#070910]">

        {/* Left sidebar — desktop only */}
        <div className="relative z-10 hidden w-[18rem] shrink-0 flex-col border-r border-white/10 bg-[#0b0e14] p-4 shadow-[18px_0_40px_-34px_rgba(0,0,0,0.9)] md:flex xl:w-[20rem]">
          <FlagSlider label="Left Side" entity={state.left} onSelect={(e) => onChange({ left: e })} />
        </div>

        {/* Center column — canvas always here, tabs below on mobile */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">

          {/* Canvas — always at top of center column */}
          <div className="shrink-0 bg-[#070910] p-2 md:flex md:min-h-0 md:flex-1 md:items-center md:justify-center md:bg-[radial-gradient(circle_at_center,#111827_0%,#070910_72%)] md:p-5 lg:p-6">
            <div ref={wrapperRef} className="w-full max-w-[1400px] overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[0_30px_90px_-52px_rgba(37,99,235,0.75)]">
              <div style={{ position: 'relative', paddingBottom: '56.25%' }}>
                <div
                  ref={scaleRef}
                  style={{ position: 'absolute', top: 0, left: 0, transformOrigin: 'top left' }}
                >
                  <VSCanvas ref={canvasRef} {...state} />
                </div>
              </div>
            </div>
          </div>

          {/* Mobile-only: tab bar + tab content */}
          <div className="flex min-h-0 flex-1 flex-col md:hidden">
            {/* Tab bar */}
            <div className="flex shrink-0 border-b border-t border-neutral-800 bg-neutral-900">
              {(
                [
                  { id: 'left'    as MobileTab, icon: <ChevronLeft  size={14} />, label: state.left.name  || 'Left'     },
                  { id: 'settings'as MobileTab, icon: <Settings2    size={14} />, label: 'Settings'                    },
                  { id: 'right'   as MobileTab, icon: <ChevronRight size={14} />, label: state.right.name || 'Right'    },
                ]
              ).map(({ id, icon, label }) => (
                <button
                  key={id} type="button" onClick={() => setMobileTab(id)}
                  className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold transition-colors ${
                    mobileTab === id
                      ? 'border-b-2 border-blue-500 text-white'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  {icon}
                  <span className="max-w-[72px] truncate">{label}</span>
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              {mobileTab === 'left' && (
                <div className="h-full p-3">
                  <FlagSlider label="Left Side" entity={state.left} onSelect={(e) => onChange({ left: e })} compact />
                </div>
              )}
              {mobileTab === 'right' && (
                <div className="h-full p-3">
                  <FlagSlider label="Right Side" entity={state.right} onSelect={(e) => onChange({ right: e })} compact />
                </div>
              )}
              {mobileTab === 'settings' && (
                <div className="p-4">
                  {renderControlRows()}
                </div>
              )}
            </div>
          </div>

          {/* Desktop: fill remaining vertical space */}
        </div>

        {/* Right sidebar — desktop only */}
        <div className="relative z-10 hidden w-[18rem] shrink-0 flex-col border-l border-white/10 bg-[#0b0e14] p-4 shadow-[-18px_0_40px_-34px_rgba(0,0,0,0.9)] md:flex xl:w-[20rem]">
          <FlagSlider label="Right Side" entity={state.right} onSelect={(e) => onChange({ right: e })} />
        </div>
      </div>

      {purchaseOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-950 p-4 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400/12 text-yellow-300">
                  <Lock size={16} aria-hidden />
                </div>
                <h2 className="text-base font-bold text-white">Clean HD export</h2>
                <p className="mt-1 text-xs leading-5 text-neutral-400">
                  Free preview is watermarked. Pay {PRICING_MARKETING.oneTimeShort} once for clean 1920x1080 PNG.
                </p>
                {checkoutPending ? (
                  <div className="mt-3 rounded-lg border border-blue-500/25 bg-blue-500/10 px-3 py-2 text-xs font-semibold leading-5 text-blue-100">
                    Checking Paddle. HD download starts automatically.
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setPurchaseOpen(false)}
                className="rounded-lg p-1 text-neutral-500 transition hover:bg-neutral-800 hover:text-white"
                aria-label="Close premium export dialog"
              >
                <X size={17} aria-hidden />
              </button>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => void handleExport('watermarked')}
                disabled={exporting}
                className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2.5 text-xs font-bold text-neutral-100 transition hover:bg-neutral-800 disabled:opacity-60"
              >
                Free PNG
              </button>
              <CheckoutButton
                kind="one_time"
                productSlug="flag-stock"
                assetGroupKey={VS_DESIGNER_ASSET_GROUP_KEY}
                assetProductSlug={VS_DESIGNER_PRODUCT_SLUG}
                successUrl={VS_DESIGNER_CHECKOUT_SUCCESS_PATH}
                onCheckoutStarted={beginPremiumCheckout}
                className="w-full rounded-lg bg-blue-600 px-3 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-500 disabled:opacity-60"
                minimal
                onAlreadyPurchased={() => {
                  markPremiumUnlockedAndExport();
                }}
              >
                Pay {PRICING_MARKETING.oneTimeShort}
              </CheckoutButton>
            </div>

            <button
              type="button"
              onClick={() => void verifyPremiumAndExport()}
              disabled={checkingAccess || exporting}
              className="mt-2.5 w-full rounded-lg border border-blue-500/35 bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-200 transition hover:bg-blue-500/15 disabled:opacity-60"
            >
              {checkingAccess ? 'Checking...' : 'I already paid'}
            </button>
            {accessError ? <p className="mt-2 text-xs leading-5 text-red-300">{accessError}</p> : null}
          </div>
        </div>
      )}
    </div>
  );
}
