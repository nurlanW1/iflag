'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Download } from 'lucide-react';
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

function ColorSwatch({
  value, onChange, title,
}: { value: string; onChange: (v: string) => void; title?: string }) {
  return (
    <label className="relative block h-7 w-7 cursor-pointer overflow-hidden rounded border border-neutral-700" title={title}>
      <div className="h-full w-full" style={{ backgroundColor: value }} />
      <input
        type="color" value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
      />
    </label>
  );
}

export default function VSDesignerClient() {
  const [state, setState] = useState<VSDesignerState>(defaultState);
  const [exporting, setExporting] = useState(false);
  const canvasRef    = useRef<HTMLDivElement>(null);
  const wrapperRef   = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const onChange = useCallback((patch: Partial<VSDesignerState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  // Position fixed overlay just below the navbar; lock body scroll
  useEffect(() => {
    const nav = document.querySelector('nav[aria-label="Primary"]') as HTMLElement | null;
    const navH = nav?.offsetHeight ?? 64;
    if (containerRef.current) containerRef.current.style.top = `${navH}px`;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Scale canvas to fit wrapper.
  // Canvas is absolutely positioned so its 1920px layout box doesn't push siblings.
  useEffect(() => {
    function update() {
      if (!wrapperRef.current || !canvasRef.current) return;
      const scale = wrapperRef.current.clientWidth / 1920;
      const el = canvasRef.current;
      el.style.position = 'absolute';
      el.style.top = '0';
      el.style.left = '0';
      el.style.transform = `scale(${scale})`;
      wrapperRef.current.style.height = `${Math.round(1080 * scale)}px`;
    }
    update();
    const ro = new ResizeObserver(update);
    if (wrapperRef.current) ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, []);

  async function handleExport() {
    const el = canvasRef.current;
    if (!el) return;
    setExporting(true);

    // Clone the rendered canvas into document.body at full 1920×1080.
    // We never touch the original element so the ResizeObserver cannot
    // re-apply the scale transform between "set none" and "capture".
    let clone: HTMLDivElement | null = null;
    try {
      clone = el.cloneNode(true) as HTMLDivElement;
      clone.style.cssText =
        'position:fixed;top:0;left:0;width:1920px;height:1080px;' +
        'transform:none;transform-origin:top left;' +
        'z-index:-9999;pointer-events:none;overflow:hidden;';
      document.body.appendChild(clone);

      // Allow the browser to lay out the clone before capturing
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => requestAnimationFrame(r));

      const html2canvas = (await import('html2canvas')).default;
      const png = await html2canvas(clone, {
        width: 1920, height: 1080, scale: 1,
        useCORS: true, allowTaint: false,
        backgroundColor: state.bgColor, logging: false,
        imageTimeout: 15_000, scrollX: 0, scrollY: 0,
        windowWidth: 1920, windowHeight: 1080,
      });

      const link = document.createElement('a');
      link.download = `vs-${Date.now()}.png`;
      link.href = png.toDataURL('image/png', 1.0);
      link.click();
    } finally {
      clone?.parentNode?.removeChild(clone);
      setExporting(false);
    }
  }

  return (
    <div
      ref={containerRef}
      className="fixed left-0 right-0 bottom-0 z-40 flex flex-col bg-neutral-950"
      style={{ top: 64 }}
    >
      {/* ── Header ───────────────────────────────── */}
      <div
        className="flex shrink-0 items-center justify-between border-b border-neutral-800 bg-neutral-950 px-4"
        style={{ height: 48 }}
      >
        <div className="flex items-center gap-3">
          <span className="text-base font-bold tracking-tight text-white">VS Designer</span>
          <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] font-bold uppercase text-neutral-400">
            1920×1080
          </span>
        </div>

        <button
          type="button" onClick={handleExport} disabled={exporting}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-bold text-white transition hover:bg-blue-500 disabled:opacity-60"
        >
          <Download size={14} aria-hidden />
          {exporting ? 'Exporting…' : 'Export PNG'}
        </button>
      </div>

      {/* ── Text / controls panel (always visible) ── */}
      <div className="shrink-0 border-b border-neutral-800 bg-neutral-900/90 px-4 py-2.5">

        {/* Row 1: names, score, date */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">

          {/* Left name */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Left</span>
            <input
              value={state.left.name}
              onChange={(e) => onChange({ left: { ...state.left, name: e.target.value } })}
              className="w-28 rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-sm text-white outline-none focus:border-blue-500"
            />
          </div>

          {/* Event title */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Event</span>
            <input
              value={state.eventTitle}
              onChange={(e) => onChange({ eventTitle: e.target.value })}
              className="w-36 rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-sm text-white outline-none focus:border-blue-500"
            />
          </div>

          {/* Right name */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Right</span>
            <input
              value={state.right.name}
              onChange={(e) => onChange({ right: { ...state.right, name: e.target.value } })}
              className="w-28 rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-sm text-white outline-none focus:border-blue-500"
            />
          </div>

          {/* Divider */}
          <div className="h-5 w-px bg-neutral-700" />

          {/* Score / VS */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onChange({ scoreMode: !state.scoreMode })}
              className={`rounded-lg px-2 py-1 text-[11px] font-bold uppercase tracking-wide transition-colors ${
                state.scoreMode
                  ? 'bg-blue-600 text-white'
                  : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
              }`}
            >
              Score
            </button>
            {state.scoreMode ? (
              <div className="flex items-center gap-1">
                <input
                  type="text" value={state.leftScore} maxLength={3}
                  onChange={(e) => onChange({ leftScore: e.target.value })}
                  className="w-10 rounded border border-neutral-700 bg-neutral-800 py-1 text-center text-sm font-bold text-white outline-none focus:border-blue-500"
                />
                <span className="text-neutral-500">–</span>
                <input
                  type="text" value={state.rightScore} maxLength={3}
                  onChange={(e) => onChange({ rightScore: e.target.value })}
                  className="w-10 rounded border border-neutral-700 bg-neutral-800 py-1 text-center text-sm font-bold text-white outline-none focus:border-blue-500"
                />
              </div>
            ) : (
              <input
                type="text" value={state.vsText}
                onChange={(e) => onChange({ vsText: e.target.value })}
                className="w-16 rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-center text-sm font-bold text-white outline-none focus:border-blue-500"
              />
            )}
          </div>

          {/* Divider */}
          <div className="h-5 w-px bg-neutral-700" />

          {/* Date */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Date</span>
            <div className="flex overflow-hidden rounded border border-neutral-700">
              {(['auto', 'manual'] as const).map((m) => (
                <button
                  key={m} type="button"
                  onClick={() => onChange({ dateMode: m })}
                  className={`px-2 py-1 text-[10px] font-semibold transition-colors ${
                    state.dateMode === m ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-500 hover:bg-neutral-700'
                  }`}
                >
                  {m === 'auto' ? 'Auto' : 'Custom'}
                </button>
              ))}
            </div>
            {state.dateMode === 'manual' && (
              <input
                value={state.dateText} placeholder="JUNE 26, 2026"
                onChange={(e) => onChange({ dateText: e.target.value })}
                className="w-32 rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-sm text-white outline-none focus:border-blue-500"
              />
            )}
          </div>
        </div>

        {/* Row 2: background, sizes, colors */}
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2">

          {/* BG presets */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">BG</span>
            {BG_PRESETS.map((p) => (
              <button
                key={p.color} type="button" title={p.label}
                onClick={() => onChange({ bgColor: p.color })}
                style={{ backgroundColor: p.color }}
                className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${
                  state.bgColor === p.color ? 'border-blue-400' : 'border-neutral-600'
                }`}
              />
            ))}
            <label className="cursor-pointer" title="Custom BG color">
              <div
                className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-dashed border-neutral-600 text-[11px] text-neutral-400 hover:border-blue-400"
                style={{
                  backgroundColor: BG_PRESETS.some((p) => p.color === state.bgColor)
                    ? undefined
                    : state.bgColor,
                }}
              >
                +
              </div>
              <input
                type="color" value={state.bgColor}
                onChange={(e) => onChange({ bgColor: e.target.value })}
                className="sr-only"
              />
            </label>
          </div>

          {/* Divider */}
          <div className="h-5 w-px bg-neutral-700" />

          {/* Name size + color */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Name</span>
            <input
              type="range" min={14} max={40} value={state.nameSize}
              onChange={(e) => onChange({ nameSize: Number(e.target.value) })}
              className="w-20 accent-blue-500"
            />
            <span className="w-8 text-[10px] text-neutral-600">{state.nameSize}px</span>
            <ColorSwatch value={state.nameColor} onChange={(v) => onChange({ nameColor: v })} title="Name color" />
          </div>

          {/* Title size + color */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Title</span>
            <input
              type="range" min={14} max={56} value={state.titleSize}
              onChange={(e) => onChange({ titleSize: Number(e.target.value) })}
              className="w-20 accent-blue-500"
            />
            <span className="w-8 text-[10px] text-neutral-600">{state.titleSize}px</span>
            <ColorSwatch value={state.titleColor} onChange={(v) => onChange({ titleColor: v })} title="Title color" />
          </div>

          {/* Center size + color */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              {state.scoreMode ? 'Score' : 'VS'} size
            </span>
            <input
              type="range" min={60} max={160} value={state.centerSize}
              onChange={(e) => onChange({ centerSize: Number(e.target.value) })}
              className="w-20 accent-blue-500"
            />
            <span className="w-8 text-[10px] text-neutral-600">{state.centerSize}px</span>
            <ColorSwatch value={state.centerColor} onChange={(v) => onChange({ centerColor: v })} title="Score/VS color" />
          </div>

        </div>
      </div>

      {/* ── Body ─────────────────────────────────── */}
      <div className="flex min-h-0 flex-1">

        {/* Left picker */}
        <div className="flex w-72 shrink-0 flex-col border-r border-neutral-800 p-3">
          <FlagSlider
            label="Left Side"
            entity={state.left}
            onSelect={(e) => onChange({ left: e })}
          />
        </div>

        {/* Canvas */}
        <div className="flex min-w-0 flex-1 items-center justify-center bg-black/40 p-4">
          {/* relative + overflow-hidden so absolute canvas is properly clipped */}
          <div ref={wrapperRef} className="relative w-full overflow-hidden rounded-xl shadow-2xl">
            <VSCanvas ref={canvasRef} {...state} />
          </div>
        </div>

        {/* Right picker */}
        <div className="flex w-72 shrink-0 flex-col border-l border-neutral-800 p-3">
          <FlagSlider
            label="Right Side"
            entity={state.right}
            onSelect={(e) => onChange({ right: e })}
          />
        </div>
      </div>
    </div>
  );
}
