'use client';

import { useState } from 'react';
import SearchDropdown from './SearchDropdown';
import type { VSEntity, VSDesignerState } from '@/lib/vs-designer-types';

interface EntityControlsProps {
  label: 'Left Side' | 'Right Side';
  side: 'left' | 'right';
  state: VSDesignerState;
  onChange: (patch: Partial<VSDesignerState>) => void;
}

export default function EntityControls({ label, side, state, onChange }: EntityControlsProps) {
  const [mode, setMode] = useState<'flag' | 'club'>('flag');
  const entity = state[side];

  function updateEntity(patch: Partial<VSEntity>) {
    onChange({ [side]: { ...entity, ...patch, type: mode } });
  }

  return (
    <div className="space-y-3">
      <div className="text-xs font-bold uppercase tracking-wider text-neutral-400">{label}</div>

      {/* Mode toggle */}
      <div className="flex rounded-lg overflow-hidden border border-neutral-700">
        <button
          type="button"
          onClick={() => { setMode('flag'); updateEntity({ type: 'flag' }); }}
          className={`flex-1 py-1.5 text-xs font-semibold transition-colors ${mode === 'flag' ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}
        >
          🏳 Country Flag
        </button>
        <button
          type="button"
          onClick={() => { setMode('club'); updateEntity({ type: 'club' }); }}
          className={`flex-1 py-1.5 text-xs font-semibold transition-colors ${mode === 'club' ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}
        >
          ⚽ Football Club
        </button>
      </div>

      <SearchDropdown
        mode={mode}
        onSelect={(e) => updateEntity({ name: e.name, imageUrl: e.imageUrl })}
      />

      {/* Name override */}
      <div>
        <label className="mb-1 block text-xs text-neutral-500">Display name</label>
        <input
          type="text"
          value={entity.name}
          onChange={(e) => updateEntity({ name: e.target.value })}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
        />
      </div>

      {/* Name color + size */}
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="mb-1 block text-xs text-neutral-500">Name color</label>
          <input
            type="color"
            value={state.nameColor}
            onChange={(e) => onChange({ nameColor: e.target.value })}
            className="h-9 w-full cursor-pointer rounded-lg border border-neutral-700 bg-neutral-800 p-1"
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs text-neutral-500">Size ({state.nameSize}px)</label>
          <input
            type="range"
            min={14}
            max={32}
            value={state.nameSize}
            onChange={(e) => onChange({ nameSize: Number(e.target.value) })}
            className="mt-2 w-full accent-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
