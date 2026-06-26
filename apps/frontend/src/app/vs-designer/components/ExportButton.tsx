'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import type { VSDesignerState } from '@/lib/vs-designer-types';

interface ExportButtonProps {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  state: VSDesignerState;
}

export default function ExportButton({ canvasRef, state }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    const el = canvasRef.current;
    if (!el) return;
    setExporting(true);
    try {
      const savedTransform = el.style.transform;
      el.style.transform = 'none';

      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(el, {
        width: 1920,
        height: 1080,
        scale: 1,
        useCORS: true,
        allowTaint: false,
        backgroundColor: state.bgColor,
        logging: false,
      });

      el.style.transform = savedTransform;

      const link = document.createElement('a');
      link.download = `flagswing-vs-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    } catch {
      if (canvasRef.current) canvasRef.current.style.transform = '';
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={exporting}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-blue-500 disabled:opacity-60"
    >
      <Download size={16} aria-hidden />
      {exporting ? 'Exporting...' : 'Export PNG (1920×1080)'}
    </button>
  );
}
