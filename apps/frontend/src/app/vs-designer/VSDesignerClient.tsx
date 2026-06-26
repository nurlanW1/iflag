'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Download } from 'lucide-react';
import { defaultState, type VSDesignerState } from '@/lib/vs-designer-types';
import VSCanvas from './components/VSCanvas';
import FlagSlider from './components/FlagSlider';

const BG_PRESETS = [
  { label: 'Navy',    color: '#0A1628' },
  { label: 'Black',   color: '#000000' },
  { label: 'Slate',   color: '#0f172a' },
  { label: 'Charcoal',color: '#111827' },
  { label: 'Forest',  color: '#0a1a0a' },
  { label: 'Wine',    color: '#1a0608' },
  { label: 'Indigo',  color: '#1e1b4b' },
  { label: 'Purple',  color: '#1a0a2a' },
];

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

  // Scale canvas to fit wrapper
  useEffect(() => {
    function update() {
      if (!wrapperRef.current || !canvasRef.current) return;
      const scale = wrapperRef.current.clientWidth / 1920;
      canvasRef.current.style.transform = `scale(${scale})`;
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
    const saved = el.style.transform;
    try {
      el.style.transform = 'none';
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => requestAnimationFrame(r));
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(el, {
        width: 1920, height: 1080, scale: 1,
        useCORS: true, allowTaint: false,
        backgroundColor: state.bgColor, logging: false,
        imageTimeout: 15000, scrollX: 0, scrollY: 0,
        windowWidth: 1920, windowHeight: 1080,
      });
      const link = document.createElement('a');
      link.download = `vs-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    } finally {
      el.style.transform = saved;
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
      <div className="flex shrink-0 items-center justify-between border-b border-neutral-800 bg-neutral-950 px-4" style={{ height: 48 }}>
        <div className="flex items-center gap-3">
          <span className="text-base font-bold text-white tracking-tight">VS Designer</span>
          <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] font-bold uppercase text-neutral-400">1920×1080</span>
        </div>

        {/* Quick controls */}
        <div className="flex items-center gap-3">
          {/* Background presets */}
          <div className="flex items-center gap-1.5">
            {BG_PRESETS.map((p) => (
              <button
                key={p.color} type="button" title={p.label}
                onClick={() => onChange({ bgColor: p.color })}
                style={{ backgroundColor: p.color }}
                className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${state.bgColor === p.color ? 'border-blue-400' : 'border-neutral-600'}`}
              />
            ))}
            <label className="cursor-pointer" title="Custom color">
              <div
                className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-dashed border-neutral-600 text-[11px] text-neutral-400 hover:border-blue-400"
                style={{ backgroundColor: BG_PRESETS.some(p => p.color === state.bgColor) ? undefined : state.bgColor }}
              >+</div>
              <input type="color" value={state.bgColor} onChange={(e) => onChange({ bgColor: e.target.value })} className="sr-only" />
            </label>
          </div>

          <div className="h-5 w-px bg-neutral-700" />

          {/* Export */}
          <button
            type="button" onClick={handleExport} disabled={exporting}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-bold text-white transition hover:bg-blue-500 disabled:opacity-60"
          >
            <Download size={14} aria-hidden />
            {exporting ? 'Exporting…' : 'Export PNG'}
          </button>
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

        {/* Center: canvas + settings */}
        <div className="flex min-w-0 flex-1 flex-col">

          {/* Canvas */}
          <div className="flex flex-1 items-center justify-center bg-black/40 p-4">
            <div ref={wrapperRef} className="w-full overflow-hidden rounded-xl shadow-2xl">
              <VSCanvas ref={canvasRef} {...state} />
            </div>
          </div>

          {/* Settings strip */}
          <div className="shrink-0 border-t border-neutral-800 bg-neutral-900">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">

              {/* Event title */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Event</span>
                <input
                  type="text" value={state.eventTitle}
                  onChange={(e) => onChange({ eventTitle: e.target.value })}
                  className="w-40 rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>

              {/* Score toggle + inputs */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onChange({ scoreMode: !state.scoreMode })}
                  className={`rounded-lg px-2 py-1 text-[11px] font-bold uppercase tracking-wide transition-colors ${
                    state.scoreMode ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
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

              {/* Date */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Date</span>
                <div className="flex overflow-hidden rounded border border-neutral-700">
                  {(['auto', 'manual'] as const).map((m) => (
                    <button key={m} type="button"
                      onClick={() => onChange({ dateMode: m })}
                      className={`px-2 py-1 text-[11px] font-semibold transition-colors ${state.dateMode === m ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-500 hover:bg-neutral-700'}`}
                    >
                      {m === 'auto' ? 'Auto' : 'Custom'}
                    </button>
                  ))}
                </div>
                {state.dateMode === 'manual' && (
                  <input
                    type="text" value={state.dateText} placeholder="JUNE 26, 2026"
                    onChange={(e) => onChange({ dateText: e.target.value })}
                    className="w-36 rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-sm text-white outline-none focus:border-blue-500"
                  />
                )}
              </div>

              {/* Center text size */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  {state.scoreMode ? 'Score size' : 'VS size'}
                </span>
                <input
                  type="range" min={60} max={140} value={state.centerSize}
                  onChange={(e) => onChange({ centerSize: Number(e.target.value) })}
                  className="w-20 accent-blue-500"
                />
                <span className="text-[11px] text-neutral-500">{state.centerSize}px</span>
              </div>

              {/* Center color */}
              <label className="flex cursor-pointer items-center gap-1.5">
                <div className="h-6 w-6 overflow-hidden rounded border border-neutral-700" style={{ backgroundColor: state.centerColor }}>
                  <input type="color" value={state.centerColor} onChange={(e) => onChange({ centerColor: e.target.value })} className="sr-only" />
                </div>
                <span className="text-[11px] text-neutral-500">Color</span>
              </label>

            </div>
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
