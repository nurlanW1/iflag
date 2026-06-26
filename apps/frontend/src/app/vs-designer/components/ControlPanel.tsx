'use client';

import type { VSDesignerState } from '@/lib/vs-designer-types';
import EntityControls from './EntityControls';
import BackgroundControls from './BackgroundControls';
import TextControls from './TextControls';
import ExportButton from './ExportButton';

interface ControlPanelProps {
  state: VSDesignerState;
  onChange: (patch: Partial<VSDesignerState>) => void;
  canvasRef: React.RefObject<HTMLDivElement | null>;
}

export default function ControlPanel({ state, onChange, canvasRef }: ControlPanelProps) {
  return (
    <div className="flex flex-col gap-6 overflow-y-auto rounded-xl border border-neutral-700/60 bg-neutral-900 p-4">
      <EntityControls label="Left Side" side="left" state={state} onChange={onChange} />
      <div className="border-t border-neutral-700/60" />
      <EntityControls label="Right Side" side="right" state={state} onChange={onChange} />
      <div className="border-t border-neutral-700/60" />
      <BackgroundControls state={state} onChange={onChange} />
      <div className="border-t border-neutral-700/60" />
      <TextControls state={state} onChange={onChange} />
      <div className="border-t border-neutral-700/60" />
      <ExportButton canvasRef={canvasRef} state={state} />
    </div>
  );
}
