'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

type BgMode = 'light' | 'dark';

const STORAGE_KEY = 'flagswing-preview-bg';

export function usePreviewBackground() {
  const [mode, setMode] = useState<BgMode>('light');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as BgMode | null;
    if (saved === 'dark' || saved === 'light') setMode(saved);
  }, []);

  const toggle = (next: BgMode) => {
    setMode(next);
    localStorage.setItem(STORAGE_KEY, next);
  };

  return { mode, toggle };
}

export function BackgroundToggle({
  mode,
  onChange,
}: {
  mode: BgMode;
  onChange: (mode: BgMode) => void;
}) {
  return (
    <div className="flex items-center rounded-lg border border-stone-200 bg-white p-0.5 shadow-sm">
      <button
        type="button"
        onClick={() => onChange('light')}
        aria-label="Light background"
        aria-pressed={mode === 'light'}
        className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
          mode === 'light'
            ? 'bg-stone-100 text-stone-900'
            : 'text-stone-400 hover:text-stone-700'
        }`}
      >
        <Sun size={14} aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => onChange('dark')}
        aria-label="Dark background"
        aria-pressed={mode === 'dark'}
        className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
          mode === 'dark'
            ? 'bg-stone-800 text-white'
            : 'text-stone-400 hover:text-stone-700'
        }`}
      >
        <Moon size={14} aria-hidden />
      </button>
    </div>
  );
}
