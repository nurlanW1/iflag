'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Crown, Download, Home, Image as ImageIcon, Lock, Settings2, Sparkles, Trophy, Upload, Users, X } from 'lucide-react';
import { CheckoutButton } from '@/components/billing/CheckoutButton';
import { useClerkUiEnabled } from '@/components/providers/ClerkUiProvider';
import { useAuth as useLegacyAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { PRICING_MARKETING } from '@/lib/marketing/pricing-config';
import { defaultState, type VSBannerTemplate, type VSEntity, type VSBackgroundStyle, type VSDesignerState } from '@/lib/vs-designer-types';
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

const TEMPLATE_PRESETS: Array<{
  id: VSBannerTemplate;
  label: string;
  description: string;
  icon: ReactNode;
  patch: Partial<VSDesignerState>;
}> = [
  {
    id: 'matchday',
    label: 'Match Day',
    description: 'Fixture poster for previews and announcements',
    icon: <Sparkles size={14} />,
    patch: {
      template: 'matchday',
      scoreMode: false,
      eventTitle: 'MATCH DAY',
      statusText: 'KICK OFF',
      hashtag: '#MATCHDAY',
    },
  },
  {
    id: 'result',
    label: 'Result',
    description: 'Full-time score graphic for blogs and channels',
    icon: <Trophy size={14} />,
    patch: {
      template: 'result',
      scoreMode: true,
      eventTitle: 'EL CLASICO',
      statusText: 'FULL TIME',
      hashtag: '#FULLTIME',
    },
  },
  {
    id: 'group',
    label: 'Group',
    description: 'Group lineup banner with four clubs or countries',
    icon: <Users size={14} />,
    patch: {
      template: 'group',
      eventTitle: 'GROUP STAGE',
      statusText: 'DRAW',
      hashtag: '#GROUPSTAGE',
    },
  },
];

const BACKGROUND_STYLES: Array<{ id: VSBackgroundStyle; label: string }> = [
  { id: 'gradient', label: 'Gradient' },
  { id: 'stadium', label: 'Stadium' },
  { id: 'image', label: 'Image' },
];

function ColorSwatch({ value, onChange, title }: { value: string; onChange: (v: string) => void; title?: string }) {
  return (
    <label className="relative block h-6 w-6 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-white/15 shadow-sm ring-1 ring-black/20" title={title}>
      <div className="h-full w-full" style={{ backgroundColor: value }} />
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" />
    </label>
  );
}

type MobileTab = 'left' | 'settings' | 'right';
type ExportTier = 'premium' | 'watermarked';
type ExportAccountState = { ready: boolean; signedIn: boolean };

const VS_DESIGNER_PRODUCT_SLUG = 'vs-designer-export';
const VS_DESIGNER_ASSET_GROUP_KEY = 'tool:vs-designer-export';
const VS_DESIGNER_CHECKOUT_SUCCESS_PATH = '/vs-designer?checkout=vs-designer-export';
const VS_DESIGNER_STATE_KEY = 'flagswing.vsDesigner.state';
const VS_DESIGNER_PENDING_KEY = 'flagswing.vsDesigner.pendingPremiumExport';

function ClerkExportAccountSync({
  onChange,
}: {
  onChange: (state: ExportAccountState) => void;
}) {
  const { isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    onChange({ ready: isLoaded, signedIn: Boolean(isSignedIn) });
  }, [isLoaded, isSignedIn, onChange]);

  return null;
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
  const { user: legacyUser, loading: legacyAuthLoading } = useLegacyAuth();
  const { openModal } = useAuthModal();

  const [state, setState]         = useState<VSDesignerState>(defaultState);
  const [exporting, setExporting] = useState(false);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(false);
  const [checkoutPending, setCheckoutPending] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [premiumUnlocked, setPremiumUnlocked] = useState(false);
  const [stateRestored, setStateRestored] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>('left');
  const [activeGroupSlot, setActiveGroupSlot] = useState(0);

  const canvasRef    = useRef<HTMLDivElement>(null);
  const scaleRef     = useRef<HTMLDivElement>(null);
  const wrapperRef   = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const importedBackgroundUrlRef = useRef<string | null>(null);
  const autoExportedRef = useRef(false);

  const [clerkExportAccount, setClerkExportAccount] = useState<ExportAccountState>({
    ready: !clerkUiEnabled,
    signedIn: false,
  });
  const syncClerkExportAccount = useCallback((next: ExportAccountState) => {
    setClerkExportAccount((prev) =>
      prev.ready === next.ready && prev.signedIn === next.signedIn ? prev : next,
    );
  }, []);
  useEffect(() => {
    if (!clerkUiEnabled) {
      setClerkExportAccount((prev) =>
        prev.ready && !prev.signedIn ? prev : { ready: true, signedIn: false },
      );
    }
  }, [clerkUiEnabled]);

  const accountReady = clerkUiEnabled ? clerkExportAccount.ready : !legacyAuthLoading;
  const hasExportAccount = clerkUiEnabled ? clerkExportAccount.signedIn : Boolean(legacyUser);

  const onChange = useCallback((patch: Partial<VSDesignerState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const applyTemplate = useCallback((template: VSBannerTemplate) => {
    const preset = TEMPLATE_PRESETS.find((item) => item.id === template);
    if (!preset) return;
    setState((prev) => ({
      ...prev,
      ...preset.patch,
      template,
      groupTeams: prev.groupTeams?.length ? prev.groupTeams : defaultState.groupTeams,
    }));
  }, []);

  const updateGroupTeam = useCallback((index: number, team: VSEntity) => {
    setState((prev) => {
      const groupTeams = [...(prev.groupTeams?.length ? prev.groupTeams : defaultState.groupTeams)];
      groupTeams[index] = team;
      return { ...prev, groupTeams };
    });
  }, []);

  const updateGroupTeamName = useCallback((index: number, name: string) => {
    setState((prev) => {
      const groupTeams = [...(prev.groupTeams?.length ? prev.groupTeams : defaultState.groupTeams)];
      groupTeams[index] = { ...(groupTeams[index] ?? defaultState.groupTeams[index]), name };
      return { ...prev, groupTeams };
    });
  }, []);

  const handleBackgroundImport = useCallback((file: File) => {
    if (importedBackgroundUrlRef.current) URL.revokeObjectURL(importedBackgroundUrlRef.current);
    const url = URL.createObjectURL(file);
    importedBackgroundUrlRef.current = url;
    onChange({ backgroundStyle: 'image', backgroundImageUrl: url });
  }, [onChange]);

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
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
      if (importedBackgroundUrlRef.current) URL.revokeObjectURL(importedBackgroundUrlRef.current);
    };
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

  const renderControlRows = () => (
    <div className="grid min-w-[1120px] grid-cols-[0.72fr_1.62fr_1.02fr_1.18fr] items-stretch gap-2">
      <section className="h-[88px] rounded-xl border border-white/10 bg-white/[0.04] p-2">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[9px] font-black uppercase tracking-[0.18em] text-white/35">Type</span>
          <span className="text-[8px] font-black uppercase tracking-wide text-white/20">Banner</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {TEMPLATE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              title={preset.description}
              onClick={() => applyTemplate(preset.id)}
              className={`flex h-12 flex-col items-center justify-center gap-1 rounded-lg border px-1 text-center transition ${
                state.template === preset.id
                  ? 'border-blue-400 bg-blue-600 text-white shadow-[0_12px_26px_-18px_rgba(37,99,235,0.9)]'
                  : 'border-white/10 bg-black/25 text-white/48 hover:bg-white/[0.075] hover:text-white'
              }`}
            >
              {preset.icon}
              <span className="text-[9px] font-black uppercase leading-none tracking-wide">{preset.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="h-[88px] rounded-xl border border-white/10 bg-white/[0.04] p-2">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[9px] font-black uppercase tracking-[0.18em] text-white/35">Text</span>
          <span className="text-[8px] font-black uppercase tracking-wide text-white/20">Main fields</span>
        </div>
        <div className="grid grid-cols-6 gap-1.5">
          <label className="col-span-2">
            <span className="mb-0.5 block text-[8px] font-black uppercase tracking-wide text-white/30">Left</span>
            <input value={state.left.name} onChange={(e) => onChange({ left: { ...state.left, name: e.target.value } })} className="h-7 w-full rounded-lg border border-white/10 bg-black/25 px-2 text-xs font-black text-white outline-none focus:border-blue-400" />
          </label>
          <label className="col-span-2">
            <span className="mb-0.5 block text-[8px] font-black uppercase tracking-wide text-white/30">Right</span>
            <input value={state.right.name} onChange={(e) => onChange({ right: { ...state.right, name: e.target.value } })} className="h-7 w-full rounded-lg border border-white/10 bg-black/25 px-2 text-xs font-black text-white outline-none focus:border-blue-400" />
          </label>
          <label className="col-span-2">
            <span className="mb-0.5 block text-[8px] font-black uppercase tracking-wide text-white/30">Event</span>
            <input value={state.eventTitle} onChange={(e) => onChange({ eventTitle: e.target.value })} className="h-7 w-full rounded-lg border border-white/10 bg-black/25 px-2 text-xs font-black text-white outline-none focus:border-blue-400" />
          </label>
          <label className="col-span-2">
            <span className="mb-0.5 block text-[8px] font-black uppercase tracking-wide text-white/24">Status</span>
            <input value={state.statusText ?? ''} placeholder="FULL TIME" onChange={(e) => onChange({ statusText: e.target.value })} className="h-6 w-full rounded-lg border border-white/10 bg-black/20 px-2 text-[11px] font-bold text-white/80 outline-none focus:border-blue-400" />
          </label>
          <label className="col-span-2">
            <span className="mb-0.5 block text-[8px] font-black uppercase tracking-wide text-white/24">Tag</span>
            <input value={state.hashtag ?? ''} placeholder="#MATCHDAY" onChange={(e) => onChange({ hashtag: e.target.value })} className="h-6 w-full rounded-lg border border-white/10 bg-black/20 px-2 text-[11px] font-bold text-white/80 outline-none focus:border-blue-400" />
          </label>
          <div className="col-span-2">
            <span className="mb-0.5 block text-[8px] font-black uppercase tracking-wide text-white/24">Date</span>
            <div className="flex gap-1">
              {(['auto', 'manual'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => onChange({ dateMode: m })}
                  className={`h-6 flex-1 rounded-lg text-[9px] font-black uppercase tracking-wide transition ${
                    state.dateMode === m ? 'bg-blue-600 text-white' : 'border border-white/10 bg-black/20 text-white/45 hover:text-white'
                  }`}
                >
                  {m === 'auto' ? 'Auto' : 'Custom'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="h-[88px] rounded-xl border border-blue-400/20 bg-blue-500/[0.055] p-2">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-100/70">Score</span>
          <button
            type="button"
            onClick={() => onChange({ scoreMode: !state.scoreMode })}
            className={`h-6 rounded-lg px-2 text-[9px] font-black uppercase tracking-wide transition ${state.scoreMode ? 'bg-blue-600 text-white' : 'border border-white/10 bg-black/25 text-white/55 hover:text-white'}`}
          >
            {state.scoreMode ? 'Score' : 'VS'}
          </button>
        </div>
        <div className="grid grid-cols-[5rem_auto_5rem_1fr] items-end gap-1.5">
          {state.scoreMode ? (
            <>
              <label>
                <span className="mb-0.5 block text-[8px] font-black uppercase text-white/35">Left</span>
                <input type="text" value={state.leftScore} maxLength={3} onChange={(e) => onChange({ leftScore: e.target.value })} className="h-9 w-full rounded-xl border border-white/10 bg-black/30 px-2 text-center text-lg font-black text-white outline-none focus:border-blue-400" />
              </label>
              <span className="pb-2 text-sm font-black text-white/35">-</span>
              <label>
                <span className="mb-0.5 block text-[8px] font-black uppercase text-white/35">Right</span>
                <input type="text" value={state.rightScore} maxLength={3} onChange={(e) => onChange({ rightScore: e.target.value })} className="h-9 w-full rounded-xl border border-white/10 bg-black/30 px-2 text-center text-lg font-black text-white outline-none focus:border-blue-400" />
              </label>
            </>
          ) : (
            <label className="col-span-3">
              <span className="mb-0.5 block text-[8px] font-black uppercase text-white/35">Center</span>
              <input type="text" value={state.vsText} onChange={(e) => onChange({ vsText: e.target.value })} className="h-9 w-full rounded-xl border border-white/10 bg-black/30 px-2 text-center text-lg font-black text-white outline-none focus:border-blue-400" />
            </label>
          )}
          <div className="grid grid-cols-1 gap-1">
            <input value={state.venueName ?? ''} placeholder="Venue" onChange={(e) => onChange({ venueName: e.target.value })} className="h-5 rounded-md border border-white/10 bg-black/20 px-2 text-[10px] font-bold text-white/65 outline-none focus:border-blue-400" />
            <input value={state.venueCity ?? ''} placeholder="City" onChange={(e) => onChange({ venueCity: e.target.value })} className="h-5 rounded-md border border-white/10 bg-black/20 px-2 text-[10px] font-bold text-white/65 outline-none focus:border-blue-400" />
          </div>
        </div>
      </section>

      <section className="h-[88px] rounded-xl border border-white/10 bg-white/[0.04] p-2">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="text-[9px] font-black uppercase tracking-[0.18em] text-white/35">Background</span>
          <button
            type="button"
            onClick={() => backgroundInputRef.current?.click()}
            className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-lg bg-white px-2.5 text-[9px] font-black uppercase tracking-wide text-black transition hover:bg-blue-100"
          >
            <Upload size={12} aria-hidden />
            Upload
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          {BACKGROUND_STYLES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange({ backgroundStyle: item.id })}
              className={`h-6 rounded-lg px-2 text-[9px] font-black uppercase tracking-wide transition ${
                (state.backgroundStyle ?? 'gradient') === item.id
                  ? 'bg-blue-600 text-white'
                  : 'border border-white/10 bg-black/20 text-white/45 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
          {BG_PRESETS.map((p) => (
            <button
              key={p.color}
              type="button"
              title={p.label}
              onClick={() => onChange({ bgColor: p.color, backgroundStyle: state.backgroundStyle === 'image' ? 'gradient' : state.backgroundStyle })}
              style={{ backgroundColor: p.color }}
              className={`h-6 w-6 shrink-0 rounded-md border-2 shadow-sm transition-transform hover:scale-105 ${
                state.bgColor === p.color ? 'border-blue-400 ring-2 ring-blue-400/30' : 'border-white/15'
              }`}
            />
          ))}
          <label className="cursor-pointer" title="Custom background color">
            <div
              className="flex h-6 w-6 items-center justify-center rounded-md border-2 border-dashed border-white/15 text-[10px] font-black text-white/45 shadow-sm hover:border-blue-400"
              style={{ backgroundColor: BG_PRESETS.some((p) => p.color === state.bgColor) ? undefined : state.bgColor }}
            >
              +
            </div>
            <input type="color" value={state.bgColor} onChange={(e) => onChange({ bgColor: e.target.value })} className="sr-only" />
          </label>
        </div>
        <div className="mt-1.5 grid grid-cols-3 gap-2">
          <label>
            <span className="mb-0.5 block text-[8px] font-black uppercase text-white/26">Name</span>
            <div className="flex items-center gap-1.5">
              <input type="range" min={14} max={40} value={state.nameSize} onChange={(e) => onChange({ nameSize: Number(e.target.value) })} className="min-w-0 flex-1 accent-blue-500" />
              <ColorSwatch value={state.nameColor} onChange={(v) => onChange({ nameColor: v })} title="Name color" />
            </div>
          </label>
          <label>
            <span className="mb-0.5 block text-[8px] font-black uppercase text-white/26">Title</span>
            <div className="flex items-center gap-1.5">
              <input type="range" min={14} max={56} value={state.titleSize} onChange={(e) => onChange({ titleSize: Number(e.target.value) })} className="min-w-0 flex-1 accent-blue-500" />
              <ColorSwatch value={state.titleColor} onChange={(v) => onChange({ titleColor: v })} title="Title color" />
            </div>
          </label>
          <label>
            <span className="mb-0.5 block text-[8px] font-black uppercase text-white/26">Score</span>
            <div className="flex items-center gap-1.5">
              <input type="range" min={60} max={160} value={state.centerSize} onChange={(e) => onChange({ centerSize: Number(e.target.value) })} className="min-w-0 flex-1 accent-blue-500" />
              <ColorSwatch value={state.centerColor} onChange={(v) => onChange({ centerColor: v })} title="Center color" />
            </div>
          </label>
        </div>
      </section>
    </div>
  );

  const groupTeams = (state.groupTeams?.length ? state.groupTeams : defaultState.groupTeams).slice(0, 4);
  const activeGroupTeam = groupTeams[activeGroupSlot] ?? groupTeams[0] ?? defaultState.left;
  const renderGroupSlotPicker = (compact = false) => (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div>
        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/35">Group lineup</div>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {groupTeams.map((team, index) => (
            <button
              key={`${team.name}-${index}`}
              type="button"
              onClick={() => setActiveGroupSlot(index)}
              className={`rounded-xl border px-2.5 py-2 text-left transition ${
                activeGroupSlot === index
                  ? 'border-blue-400 bg-blue-600/25 text-white'
                  : 'border-white/10 bg-white/[0.055] text-white/55 hover:bg-white/[0.09] hover:text-white'
              }`}
            >
              <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Slot {index + 1}</span>
              <span className="mt-1 block truncate text-xs font-bold">{team.name}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <label className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Team name</label>
        <input
          value={activeGroupTeam.name}
          onChange={(e) => updateGroupTeamName(activeGroupSlot, e.target.value)}
          className="mt-2 h-9 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm font-bold text-white outline-none transition focus:border-blue-400"
        />
      </div>
      <FlagSlider
        label={`Choose slot ${activeGroupSlot + 1}`}
        entity={activeGroupTeam}
        onSelect={(team) => updateGroupTeam(activeGroupSlot, team)}
        compact={compact}
      />
    </div>
  );

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] flex flex-col bg-[#070910] text-white"
    >
      {clerkUiEnabled ? <ClerkExportAccountSync onChange={syncClerkExportAccount} /> : null}
      <input
        ref={backgroundInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleBackgroundImport(file);
            e.target.value = '';
          }
        }}
      />
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#0b0e14]/95 px-3 shadow-[0_8px_30px_-24px_rgba(59,130,246,0.7)] backdrop-blur md:px-5" style={{ height: 54 }}>
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.055] text-white/70 transition hover:bg-white/[0.1] hover:text-white"
            aria-label="Back to home"
            title="Back to home"
          >
            <Home size={18} aria-hidden />
          </button>
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
      <div className="relative z-20 hidden shrink-0 overflow-x-auto border-b border-white/10 bg-[#10131b]/95 px-4 py-2 shadow-[0_8px_30px_-28px_rgba(0,0,0,0.9)] [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.18)_transparent] md:block">
        {renderControlRows()}
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      {/*
        Single flex-row: sidebars hidden on mobile via hidden md:flex.
        Canvas lives ONCE inside the center column — no duplication.
        On mobile the center column is full-width (sidebars not rendered).
      */}
      <div className="relative z-0 flex min-h-0 flex-1 bg-[#070910]">

        {/* Left sidebar — desktop only */}
        <div className="relative z-10 hidden w-[17rem] shrink-0 flex-col border-r border-white/10 bg-[#0b0e14] p-4 shadow-[18px_0_40px_-34px_rgba(0,0,0,0.9)] xl:flex 2xl:w-[20rem]">
          {state.template === 'group' ? renderGroupSlotPicker() : (
            <FlagSlider label="Left Side" entity={state.left} onSelect={(e) => onChange({ left: e })} />
          )}
        </div>

        {/* Center column — canvas always here, tabs below on mobile */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">

          {/* Canvas — always at top of center column */}
          <div className="relative z-0 shrink-0 bg-[#070910] p-2 md:flex md:min-h-0 md:flex-1 md:items-center md:justify-center md:bg-[radial-gradient(circle_at_center,#111827_0%,#070910_72%)] md:p-5 lg:p-6">
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
          <div className="flex min-h-0 flex-1 flex-col xl:hidden">
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
                  {state.template === 'group'
                    ? renderGroupSlotPicker(true)
                    : <FlagSlider label="Left Side" entity={state.left} onSelect={(e) => onChange({ left: e })} compact />}
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
        <div className="relative z-10 hidden w-[17rem] shrink-0 flex-col border-l border-white/10 bg-[#0b0e14] p-4 shadow-[-18px_0_40px_-34px_rgba(0,0,0,0.9)] xl:flex 2xl:w-[20rem]">
          {state.template === 'group' ? (
            <div className="flex h-full flex-col gap-3">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/35">Studio tools</div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-300/12 text-yellow-200">
                  <ImageIcon size={18} aria-hidden />
                </div>
                <h3 className="text-sm font-black text-white">Background</h3>
                <p className="mt-1 text-xs leading-5 text-white/45">
                  Use Gradient, Stadium, or Import to place a stadium/photo behind the banner.
                </p>
                <button
                  type="button"
                  onClick={() => backgroundInputRef.current?.click()}
                  className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-xs font-black text-white transition hover:bg-blue-500"
                >
                  <Upload size={14} aria-hidden />
                  Import background
                </button>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-xs leading-5 text-white/45">
                Group template is built for draw graphics, group-stage announcements, and club lineup posts.
              </div>
            </div>
          ) : (
            <FlagSlider label="Right Side" entity={state.right} onSelect={(e) => onChange({ right: e })} />
          )}
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
