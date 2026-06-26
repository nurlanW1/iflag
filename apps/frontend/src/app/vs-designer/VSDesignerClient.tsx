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
    <main className="flex h-screen flex-col overflow-hidden bg-neutral-950 text-white">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-neutral-800 px-5 py-3">
        <div>
          <h1 className="text-lg font-bold leading-tight text-white">VS Designer</h1>
          <p className="text-xs text-neutral-500">1920 × 1080 · PNG eksport</p>
        </div>
      </div>

      {/* Body */}
      <div className="flex min-h-0 flex-1 gap-0">
        {/* Canvas area */}
        <div className="flex min-w-0 flex-1 flex-col items-center justify-center bg-neutral-925 p-6" style={{ background: '#0d0d0d' }}>
          <div
            ref={wrapperRef}
            className="overflow-hidden rounded-xl shadow-2xl"
            style={{ width: '100%', maxWidth: 1200 }}
          >
            <VSCanvas ref={canvasRef} state={state} />
          </div>
          <p className="mt-3 text-center text-xs text-neutral-700">
            Ko'rib chiqish — eksport to'liq 1920×1080 sifatida saqlanadi
          </p>
        </div>

        {/* Control panel */}
        <div
          className="flex shrink-0 flex-col border-l border-neutral-800"
          style={{ width: 300 }}
        >
          <ControlPanel
            state={state}
            onChange={onChange}
            canvasRef={canvasRef}
            wrapperRef={wrapperRef}
          />
        </div>
      </div>
    </main>
  );
}
