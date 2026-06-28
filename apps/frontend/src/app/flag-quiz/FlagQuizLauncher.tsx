'use client';

import { useState } from 'react';
import { Play, Trophy } from 'lucide-react';
import { FlagGame } from '@/components/FlagGame';

export function FlagQuizLauncher() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-500"
      >
        <Play size={17} aria-hidden />
        Start flag quiz
      </button>
      <div className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600">
        <Trophy size={16} aria-hidden className="text-yellow-500" />
        Practice world flags with real uploaded previews.
      </div>
      {open ? <FlagGame onClose={() => setOpen(false)} /> : null}
    </div>
  );
}
