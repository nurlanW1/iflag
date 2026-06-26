'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { defaultState, type VSDesignerState } from '@/lib/vs-designer-types';
import VSCanvas from './components/VSCanvas';
import ControlPanel from './components/ControlPanel';

export default function VSDesignerClient() {
  const [state, setState] = useState<VSDesignerState>(defaultState);
  const canvasRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const onChange = useCallback((patch: Partial<VSDesignerState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  useEffect(() => {
    function updateScale() {
      if (!wrapperRef.current || !canvasRef.current) return;
      const scale = wrapperRef.current.clientWidth / 1920;
      canvasRef.current.style.transform = `scale(${scale})`;
      wrapperRef.current.style.height = `${Math.round(1080 * scale)}px`;
    }
    updateScale();
    const ro = new ResizeObserver(updateScale);
    if (wrapperRef.current) ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-[1800px] px-4 py-6">
        <div className="mb-4">
          <h1 className="text-2xl font-bold tracking-tight text-white">VS Designer</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Create 1920×1080 matchup graphics for sports, politics and events
          </p>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Canvas preview */}
          <div className="min-w-0 flex-1">
            <div
              ref={wrapperRef}
              className="overflow-hidden rounded-xl"
              style={{ width: '100%' }}
            >
              <VSCanvas ref={canvasRef} state={state} />
            </div>
            <p className="mt-2 text-center text-xs text-neutral-600">
              Preview — exports at full 1920×1080 resolution
            </p>
          </div>

          {/* Control panel */}
          <div className="w-full lg:w-80 xl:w-96">
            <ControlPanel state={state} onChange={onChange} canvasRef={canvasRef} />
          </div>
        </div>
      </div>
    </main>
  );
}
