'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';

export interface FlagColor {
  name: string;
  hex: string;
  rgb: string;
  cmyk: string;
  pantone?: string;
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`Copied: ${value}`);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Copy ${label}`}
      className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
    >
      {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
    </button>
  );
}

export function ColorPalette({ colors }: { colors: FlagColor[] }) {
  return (
    <div className="space-y-3">
      {colors.map((color) => (
        <div
          key={color.hex}
          className="flex items-start gap-3 rounded-xl border border-stone-200 bg-white p-3 sm:p-4"
        >
          {/* Color swatch */}
          <div
            className="h-12 w-12 shrink-0 rounded-lg border border-black/10 shadow-sm"
            style={{ backgroundColor: color.hex }}
            aria-label={`${color.name} color swatch`}
          />

          {/* Color values */}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-stone-900">{color.name}</p>
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
              <span className="flex items-center text-xs text-stone-600">
                <span className="font-mono font-medium">{color.hex}</span>
                <CopyButton value={color.hex} label="HEX" />
              </span>
              <span className="flex items-center text-xs text-stone-500">
                <span className="font-mono">RGB {color.rgb}</span>
                <CopyButton value={color.rgb} label="RGB" />
              </span>
              <span className="flex items-center text-xs text-stone-500">
                <span className="font-mono">CMYK {color.cmyk}</span>
                <CopyButton value={color.cmyk} label="CMYK" />
              </span>
              {color.pantone && (
                <span className="flex items-center text-xs text-stone-500">
                  <span className="font-mono">Pantone {color.pantone}</span>
                  <CopyButton value={color.pantone} label="Pantone" />
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
