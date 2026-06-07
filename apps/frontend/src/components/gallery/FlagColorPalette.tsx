'use client';

import { useState, useCallback } from 'react';
import { Check, Copy } from 'lucide-react';

export type FlagColor = {
  name: string;
  hex: string;
  rgb: string;
  pantone: string;
};

type CopyMode = 'hex' | 'rgb' | 'pantone';

function useCopy() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copy = useCallback((text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    });
    setCopiedKey(key);
    setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1800);
  }, []);

  return { copiedKey, copy };
}

function ColorSwatch({ color, index }: { color: FlagColor; index: number }) {
  const { copiedKey, copy } = useCopy();
  const [mode, setMode] = useState<CopyMode>('hex');

  const displayValue = mode === 'hex' ? color.hex : mode === 'rgb' ? `rgb(${color.rgb})` : color.pantone;
  const copyKey = `${index}-${mode}`;
  const copied = copiedKey === copyKey;

  function cycleMode() {
    setMode((m) => (m === 'hex' ? 'rgb' : m === 'rgb' ? 'pantone' : 'hex'));
  }

  // Determine if swatch is light (to choose text color)
  const isLight = (() => {
    const hex = color.hex.replace('#', '');
    if (hex.length !== 6) return true;
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 155;
  })();

  return (
    <div className="group flex flex-col gap-2">
      {/* Swatch */}
      <div
        className="relative h-14 w-full cursor-pointer overflow-hidden rounded-xl shadow-sm ring-1 ring-black/8 transition-all duration-200 group-hover:shadow-md group-hover:ring-black/15 sm:h-16"
        style={{ backgroundColor: color.hex }}
        onClick={() => copy(displayValue, copyKey)}
        title={`Click to copy ${displayValue}`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && copy(displayValue, copyKey)}
        aria-label={`Copy ${color.name} ${displayValue}`}
      >
        {/* Copied feedback */}
        {copied && (
          <div
            className="absolute inset-0 flex items-center justify-center rounded-xl"
            style={{ backgroundColor: color.hex }}
          >
            <Check
              size={20}
              className={isLight ? 'text-black/60' : 'text-white/80'}
              strokeWidth={2.5}
            />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="space-y-1">
        <p className="truncate text-[11px] font-semibold text-slate-700">{color.name}</p>

        {/* Code row — click to copy */}
        <button
          type="button"
          onClick={() => copy(displayValue, copyKey)}
          className="group/code flex w-full items-center gap-1 rounded-md bg-slate-50 px-2 py-1 text-left ring-1 ring-slate-200/80 transition hover:bg-slate-100 hover:ring-slate-300"
          title={`Copy ${displayValue}`}
        >
          <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-slate-700">
            {displayValue}
          </span>
          {copied ? (
            <Check size={11} className="shrink-0 text-emerald-600" strokeWidth={2.5} />
          ) : (
            <Copy size={11} className="shrink-0 text-slate-400 opacity-0 group-hover/code:opacity-100" strokeWidth={1.8} />
          )}
        </button>

        {/* Mode switcher */}
        <div className="flex gap-1">
          {(['hex', 'rgb', 'pantone'] as CopyMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={cycleMode}
              className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide transition ${
                mode === m
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'
              }`}
            >
              {m === 'pantone' ? 'PMS' : m.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function FlagColorPalette({ colors }: { colors: FlagColor[] }) {
  if (!colors || colors.length === 0) return null;

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white px-5 py-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Official Colors</p>
          <h2 className="mt-0.5 text-sm font-semibold text-slate-800">Flag Color Palette</h2>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
          {colors.length} color{colors.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(${Math.min(colors.length, 6)}, minmax(0, 1fr))` }}
      >
        {colors.map((color, i) => (
          <ColorSwatch key={color.hex + i} color={color} index={i} />
        ))}
      </div>
      <p className="mt-3 text-[10px] text-slate-400">
        Click code to copy · Toggle HEX / RGB / PMS
      </p>
    </section>
  );
}
