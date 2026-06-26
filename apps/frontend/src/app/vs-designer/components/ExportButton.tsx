'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import type { VSDesignerState } from '@/lib/vs-designer-types';

interface ExportButtonProps {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  wrapperRef: React.RefObject<HTMLDivElement | null>;
  state: VSDesignerState;
}

export default function ExportButton({ canvasRef, wrapperRef, state }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    const el = canvasRef.current;
    if (!el) return;
    setExporting(true);

    const savedTransform = el.style.transform;
    const savedWidth = wrapperRef.current?.style.height;

    try {
      // Restore full size for capture
      el.style.transform = 'none';

      // Wait a frame for browser to repaint
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => requestAnimationFrame(r));

      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(el, {
        width: 1920,
        height: 1080,
        scale: 1,
        useCORS: true,
        allowTaint: false,
        backgroundColor: state.bgColor,
        logging: false,
        imageTimeout: 15000,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 1920,
        windowHeight: 1080,
      });

      const link = document.createElement('a');
      link.download = `flagswing-vs-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    } finally {
      el.style.transform = savedTransform;
      if (wrapperRef.current && savedWidth) {
        wrapperRef.current.style.height = savedWidth;
      }
      setExporting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={exporting}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-blue-500 active:scale-[0.98] disabled:opacity-50"
    >
      <Download size={16} aria-hidden />
      {exporting ? 'Tayyorlanmoqda...' : 'PNG Yuklab Olish  (1920×1080)'}
    </button>
  );
}
