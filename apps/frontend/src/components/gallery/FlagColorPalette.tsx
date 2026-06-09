'use client';

import { useState, useCallback } from 'react';
import { Check } from 'lucide-react';

export type FlagColor = {
  name: string;
  hex: string;
  rgb: string;
  pantone: string;
};

type CopyMode = 'hex' | 'rgb' | 'pms';

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
    setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1600);
  }, []);
  return { copiedKey, copy };
}

function isLightColor(hex: string) {
  const h = hex.replace('#', '');
  if (h.length !== 6) return true;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 155;
}

function ColorSwatch({
  color,
  index,
  mode,
}: {
  color: FlagColor;
  index: number;
  mode: CopyMode;
}) {
  const { copiedKey, copy } = useCopy();
  const value =
    mode === 'hex'
      ? color.hex
      : mode === 'rgb'
      ? color.rgb
      : (color.pantone ?? color.hex);
  const key = `${index}-${mode}`;
  const copied = copiedKey === key;
  const light = isLightColor(color.hex);

  return (
    <button
      type="button"
      onClick={() => copy(value, key)}
      title={`Copy ${value}`}
      aria-label={`Copy ${color.name}: ${value}`}
      className="group flex flex-col gap-1.5 text-left outline-none"
    >
      {/* Swatch */}
      <div
        className="relative w-full overflow-hidden rounded-lg ring-1 ring-black/10 transition-all group-hover:ring-2 group-hover:ring-black/20"
        style={{ backgroundColor: color.hex, aspectRatio: '1 / 1' }}
      >
        {copied && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Check
              size={16}
              strokeWidth={2.5}
              className={light ? 'text-black/50' : 'text-white/70'}
            />
          </div>
        )}
      </div>

      {/* Name */}
      <p className="truncate text-[10px] font-semibold leading-tight text-neutral-700">
        {color.name}
      </p>

      {/* Code */}
      <p className="truncate font-mono text-[9px] leading-tight text-neutral-400">
        {value}
      </p>
    </button>
  );
}

export function FlagColorPalette({ colors }: { colors: FlagColor[] }) {
  const [mode, setMode] = useState<CopyMode>('hex');

  if (!colors || colors.length === 0) return null;

  const cols = Math.min(colors.length, 5);

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-3.5 shadow-sm">
      {/* Mode toggle */}
      <div className="mb-3 flex gap-1">
        {(['hex', 'rgb', 'pms'] as CopyMode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest transition ${
              mode === m
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-400 hover:text-neutral-600'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Swatches */}
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {colors.map((color, i) => (
          <ColorSwatch key={color.hex + i} color={color} index={i} mode={mode} />
        ))}
      </div>
    </section>
  );
}
