'use client';

import { useState, useCallback } from 'react';
import { Check } from 'lucide-react';

export type FlagColor = {
  name: string;
  hex: string;
  rgb: string;
  pantone: string;
};

function useCopy() {
  const [key, setKey] = useState<string | null>(null);
  const copy = useCallback((text: string, id: string) => {
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
    setKey(id);
    setTimeout(() => setKey((k) => (k === id ? null : k)), 1600);
  }, []);
  return { copiedKey: key, copy };
}

function isLight(hex: string) {
  const h = hex.replace('#', '');
  if (h.length !== 6) return true;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 155;
}

type Mode = 'hex' | 'rgb' | 'pms';

function Swatch({ color, index, mode }: { color: FlagColor; index: number; mode: Mode }) {
  const { copiedKey, copy } = useCopy();
  const value =
    mode === 'hex' ? color.hex : mode === 'rgb' ? color.rgb : (color.pantone ?? color.hex);
  const id = `${index}-${mode}`;
  const copied = copiedKey === id;
  const light = isLight(color.hex);

  return (
    <button
      type="button"
      onClick={() => copy(value, id)}
      title={`Copy ${value}`}
      aria-label={`Copy ${color.name}: ${value}`}
      className="group flex flex-col gap-1 text-left outline-none"
    >
      {/* Swatch rectangle */}
      <div
        className="relative overflow-hidden rounded-md ring-1 ring-black/10 transition-all duration-150 group-hover:ring-black/25 group-hover:shadow-sm"
        style={{ backgroundColor: color.hex, width: 44, height: 34 }}
      >
        {copied && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Check size={13} strokeWidth={2.5} className={light ? 'text-black/50' : 'text-white/80'} />
          </div>
        )}
      </div>

      {/* Color name */}
      <p className="max-w-[44px] truncate text-[9px] font-semibold leading-tight text-neutral-600">
        {color.name}
      </p>

      {/* Code */}
      <p className="max-w-[44px] truncate font-mono text-[8.5px] leading-tight text-neutral-400">
        {value}
      </p>
    </button>
  );
}

export function FlagColorPalette({ colors }: { colors: FlagColor[] }) {
  const [mode, setMode] = useState<Mode>('hex');

  if (!colors || colors.length === 0) return null;

  return (
    <div>
      {/* Label + mode */}
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-semibold text-neutral-600">Flag Color Palette</p>
        <div className="flex gap-0.5">
          {(['hex', 'rgb', 'pms'] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider transition ${
                mode === m
                  ? 'bg-neutral-800 text-white'
                  : 'text-neutral-400 hover:text-neutral-600'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Swatches */}
      <div className="flex flex-wrap gap-2.5">
        {colors.map((c, i) => (
          <Swatch key={c.hex + i} color={c} index={i} mode={mode} />
        ))}
      </div>
    </div>
  );
}
