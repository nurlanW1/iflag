'use client';

import type { VSDesignerState } from '@/lib/vs-designer-types';

interface TextControlsProps {
  state: VSDesignerState;
  onChange: (patch: Partial<VSDesignerState>) => void;
}

function Field({
  label,
  value,
  onChange,
  color,
  onColor,
  min,
  max,
  size,
  onSize,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  color: string;
  onColor: (v: string) => void;
  min: number;
  max: number;
  size: number;
  onSize: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-bold uppercase tracking-wider text-neutral-400">{label}</div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
      />
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="mb-1 block text-xs text-neutral-500">Color</label>
          <input
            type="color"
            value={color}
            onChange={(e) => onColor(e.target.value)}
            className="h-9 w-full cursor-pointer rounded-lg border border-neutral-700 bg-neutral-800 p-1"
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs text-neutral-500">Size ({size}px)</label>
          <input
            type="range"
            min={min}
            max={max}
            value={size}
            onChange={(e) => onSize(Number(e.target.value))}
            className="mt-2 w-full accent-blue-500"
          />
        </div>
      </div>
    </div>
  );
}

export default function TextControls({ state, onChange }: TextControlsProps) {
  return (
    <div className="space-y-4">
      <Field
        label="Event Title"
        value={state.eventTitle}
        onChange={(v) => onChange({ eventTitle: v })}
        color={state.titleColor}
        onColor={(v) => onChange({ titleColor: v })}
        min={18}
        max={48}
        size={state.titleSize}
        onSize={(v) => onChange({ titleSize: v })}
      />

      <Field
        label="VS Text"
        value={state.vsText}
        onChange={(v) => onChange({ vsText: v })}
        color={state.vsColor}
        onColor={(v) => onChange({ vsColor: v })}
        min={60}
        max={140}
        size={state.vsSize}
        onSize={(v) => onChange({ vsSize: v })}
      />

      <div className="space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-neutral-400">Date</div>
        <div className="flex rounded-lg overflow-hidden border border-neutral-700">
          <button
            type="button"
            onClick={() => onChange({ dateMode: 'auto' })}
            className={`flex-1 py-1.5 text-xs font-semibold transition-colors ${state.dateMode === 'auto' ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}
          >
            Auto
          </button>
          <button
            type="button"
            onClick={() => onChange({ dateMode: 'manual' })}
            className={`flex-1 py-1.5 text-xs font-semibold transition-colors ${state.dateMode === 'manual' ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}
          >
            Manual
          </button>
        </div>
        {state.dateMode === 'manual' && (
          <input
            type="text"
            value={state.dateText}
            onChange={(e) => onChange({ dateText: e.target.value })}
            placeholder="e.g. JUNE 26, 2026"
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
          />
        )}
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-neutral-500">Date color</label>
            <input
              type="color"
              value={state.dateColor}
              onChange={(e) => onChange({ dateColor: e.target.value })}
              className="h-9 w-full cursor-pointer rounded-lg border border-neutral-700 bg-neutral-800 p-1"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
