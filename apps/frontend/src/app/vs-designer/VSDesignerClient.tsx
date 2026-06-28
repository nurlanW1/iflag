'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Crown, Download, Lock, Settings2, X } from 'lucide-react';
import { CheckoutButton } from '@/components/billing/CheckoutButton';
import { PRICING_MARKETING } from '@/lib/marketing/pricing-config';
import { defaultState, type VSDesignerState } from '@/lib/vs-designer-types';
import VSCanvas from './components/VSCanvas';
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
    <label className="relative block h-6 w-6 shrink-0 cursor-pointer overflow-hidden rounded border border-neutral-700" title={title}>
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

async function waitForCanvasAssets(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll('img'));
  await Promise.all(
    images.map((img) => {
      if (img.complete && img.naturalWidth > 0) return;
      return new Promise<void>((resolve) => {
        const done = () => {
          window.clearTimeout(timeout);
          resolve();
        };
        const timeout = window.setTimeout(resolve, 3000);
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
        void img.decode?.().then(done).catch(() => undefined);
      });
    }),
  );
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }
}

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

  ctx.save();
  ctx.filter = 'blur(0.8px) brightness(0.78) contrast(0.9) saturate(0.86)';
  ctx.drawImage(source, 0, 0);
  ctx.restore();

  ctx.fillStyle = 'rgba(5,12,24,0.22)';
  ctx.fillRect(0, 0, out.width, out.height);

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.26)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 8;
  ctx.font = '900 76px Arial, sans-serif';
  ctx.lineWidth = 6;
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.fillStyle = 'rgba(255,255,255,0.30)';
  ctx.strokeText('FLAGSWING FREE PREVIEW', out.width / 2, out.height / 2 - 10);
  ctx.fillText('FLAGSWING FREE PREVIEW', out.width / 2, out.height / 2 - 10);

  ctx.shadowBlur = 10;
  ctx.font = '700 30px Arial, sans-serif';
  ctx.lineWidth = 3;
  ctx.fillStyle = 'rgba(255,255,255,0.30)';
  ctx.strokeStyle = 'rgba(0,0,0,0.14)';
  ctx.strokeText('Unlock clean HD export for $1', out.width / 2, out.height / 2 + 58);
  ctx.fillText('Unlock clean HD export for $1', out.width / 2, out.height / 2 + 58);
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
    const el = canvasRef.current;
    if (!el) return null;
    let clone: HTMLDivElement | null = null;
    try {
      clone = el.cloneNode(true) as HTMLDivElement;
      // Set only positioning props — do NOT use cssText (it wipes VSCanvas
      // inline styles like display:flex, alignItems, etc., breaking layout).
      clone.style.position       = 'fixed';
      clone.style.top            = '0';
      clone.style.left           = '0';
      clone.style.width          = '1920px';
      clone.style.height         = '1080px';
      clone.style.transform      = 'none';
      clone.style.transformOrigin = 'top left';
      clone.style.zIndex         = '-9999';
      clone.style.pointerEvents  = 'none';
      clone.style.overflow       = 'hidden';
      document.body.appendChild(clone);
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => requestAnimationFrame(r));
      await waitForCanvasAssets(clone);
      const html2canvas = (await import('html2canvas')).default;
      const png = await html2canvas(clone, {
        width: 1920, height: 1080, scale: tier === 'premium' ? 2 : 1,
        useCORS: true, allowTaint: false,
        backgroundColor: state.bgColor, logging: false,
        imageTimeout: 15_000, scrollX: 0, scrollY: 0,
        windowWidth: 1920, windowHeight: 1080,
      });
      return tier === 'watermarked' ? makeWatermarkedPreview(png) : png;
    } finally {
      clone?.parentNode?.removeChild(clone);
    }
  }

  async function handleExport(tier: ExportTier) {
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
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 md:flex-nowrap md:overflow-x-auto">
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
      className="fixed left-0 right-0 bottom-0 z-40 flex flex-col bg-neutral-950"
      style={{ top: 64 }}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center justify-between border-b border-neutral-800 bg-neutral-950 px-3 md:px-4" style={{ height: 48 }}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold tracking-tight text-white md:text-base">VS Designer</span>
          <span className="hidden rounded bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-200 md:inline">
            Create match graphics in 30 seconds
          </span>
          <span className="hidden rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] font-bold uppercase text-neutral-400 sm:inline">
            1920×1080
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button" onClick={() => void handleExport('watermarked')} disabled={exporting || checkingAccess}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-900 px-2.5 py-1.5 text-xs font-bold text-neutral-200 transition hover:bg-neutral-800 disabled:opacity-60 sm:px-3"
          >
            <Download size={13} aria-hidden />
            <span className="sm:hidden">Free</span>
            <span className="hidden sm:inline">Free preview</span>
          </button>
          <button
            type="button" onClick={() => void verifyPremiumAndExport()} disabled={exporting || checkingAccess}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-bold text-white transition hover:bg-blue-500 disabled:opacity-60 sm:gap-2 sm:px-4 sm:text-sm"
          >
            {premiumUnlocked ? <Download size={13} aria-hidden /> : <Crown size={13} aria-hidden />}
            {exporting ? 'Exporting...' : checkingAccess ? 'Checking...' : premiumUnlocked ? 'Export HD' : <><span className="sm:hidden">Premium</span><span className="hidden sm:inline">Premium PNG $1</span></>}
          </button>
        </div>
      </div>

      {/* ── Desktop controls (hidden on mobile) ─────────────────────────── */}
      <div className="hidden shrink-0 border-b border-neutral-800 bg-neutral-900/90 px-4 py-1.5 md:block">
        {renderControlRows()}
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      {/*
        Single flex-row: sidebars hidden on mobile via hidden md:flex.
        Canvas lives ONCE inside the center column — no duplication.
        On mobile the center column is full-width (sidebars not rendered).
      */}
      <div className="flex min-h-0 flex-1">

        {/* Left sidebar — desktop only */}
        <div className="relative z-10 hidden w-56 shrink-0 flex-col border-r border-neutral-800 p-3 md:flex lg:w-72">
          <FlagSlider label="Left Side" entity={state.left} onSelect={(e) => onChange({ left: e })} />
        </div>

        {/* Center column — canvas always here, tabs below on mobile */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">

          {/* Canvas — always at top of center column */}
          <div className="shrink-0 bg-black/40 p-2 md:p-3 lg:p-4">
            <div ref={wrapperRef} className="w-full overflow-hidden rounded-xl shadow-2xl">
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
          <div className="hidden min-h-0 flex-1 md:block" />
        </div>

        {/* Right sidebar — desktop only */}
        <div className="relative z-10 hidden w-56 shrink-0 flex-col border-l border-neutral-800 p-3 md:flex lg:w-72">
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
