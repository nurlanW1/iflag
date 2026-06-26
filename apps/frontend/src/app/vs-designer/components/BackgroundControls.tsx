'use client';

import type { VSDesignerState } from '@/lib/vs-designer-types';

const PRESETS = [
  { label: 'Navy', color: '#0A1628' },
  { label: 'Dark Red', color: '#1a0a0a' },
  { label: 'Dark Green', color: '#0a1a0a' },
  { label: 'Black', color: '#000000' },
  { label: 'Purple', color: '#1a0a2a' },
];

interface BackgroundControlsProps {
  state: VSDesignerState;
  onChange: (patch: Partial<VSDesignerState>) => void;
}

export default function BackgroundControls({ state, onChange }: BackgroundControlsProps) {
  return (
    <div className="space-y-3">
      <div className="text-xs font-bold uppercase tracking-wider text-neutral-400">Background</div>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.color}
            type="button"
            title={p.label}
            onClick={() => onChange({ bgColor: p.color })}
            style={{ backgroundColor: p.color }}
            className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${state.bgColor === p.color ? 'border-blue-400 scale-110' : 'border-neutral-600'}`}
          />
        ))}
        <label className="cursor-pointer" title="Custom color">
          <div
            style={{ backgroundColor: state.bgColor }}
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed border-neutral-500 text-xs text-white hover:border-blue-400"
          >
            +
          </div>
          <input
            type="color"
            value={state.bgColor}
            onChange={(e) => onChange({ bgColor: e.target.value })}
            className="sr-only"
          />
        </label>
      </div>
    </div>
  );
}
