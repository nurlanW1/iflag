'use client';

import { useRef, useState, useCallback, useEffect, useLayoutEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Undo2,
  Redo2,
  Download,
  Type,
  Shapes,
  Frame,
  Layers,
  Bold,
  Italic,
  Trash2,
} from 'lucide-react';

const CANVAS_W = 600;
const CANVAS_H = 400;
const WATERMARK = 'flagswing.com';

type ElementKind = 'text' | 'rect' | 'circle' | 'star' | 'overlay';

interface CanvasElement {
  id: string;
  kind: ElementKind;
  x: number;
  y: number;
  // text
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  fontStyle?: string;
  // shape
  width?: number;
  height?: number;
  radius?: number;
  // overlay
  opacity?: number;
  blendMode?: GlobalCompositeOperation;
}

const FONTS = ['Arial', 'Georgia', 'Montserrat'];
const BLEND_MODES: GlobalCompositeOperation[] = ['source-over', 'multiply', 'screen'];
const BLEND_LABELS = ['Normal', 'Multiply', 'Screen'];
const BORDER_STYLES = ['none', 'solid', 'dashed', 'double'] as const;

function uid() {
  return Math.random().toString(36).slice(2);
}

type Tab = 'text' | 'shapes' | 'border' | 'overlay';

// ── Canvas renderer (imperative, vanilla Konva-free) ──────────────────────────

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const spikes = 5;
  const inner = r * 0.45;
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / spikes;
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * r, cy + Math.sin(rot) * r);
    rot += step;
    ctx.lineTo(cx + Math.cos(rot) * inner, cy + Math.sin(rot) * inner);
    rot += step;
  }
  ctx.lineTo(cx, cy - r);
  ctx.closePath();
}

function renderCanvas(
  canvas: HTMLCanvasElement,
  flagImg: HTMLImageElement | null,
  elements: CanvasElement[],
  selectedId: string | null,
  borderStyle: string,
  borderColor: string,
  borderWidth: number,
  scale = 1,
) {
  const w = CANVAS_W * scale;
  const h = CANVAS_H * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, w, h);

  // Background flag
  if (flagImg) {
    ctx.drawImage(flagImg, 0, 0, w, h);
  } else {
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(0, 0, w, h);
  }

  // Elements
  for (const el of elements) {
    ctx.save();
    if (el.kind === 'overlay') {
      ctx.globalAlpha = el.opacity ?? 0;
      ctx.globalCompositeOperation = el.blendMode ?? 'source-over';
      ctx.fillStyle = el.fill ?? '#000000';
      ctx.fillRect(0, 0, w, h);
    } else if (el.kind === 'text') {
      const fs = (el.fontSize ?? 32) * scale;
      ctx.font = `${el.fontStyle ?? 'normal'} ${fs}px ${el.fontFamily ?? 'Arial'}`;
      ctx.fillStyle = el.fill ?? '#ffffff';
      ctx.fillText(el.text ?? '', el.x * scale, (el.y + (el.fontSize ?? 32)) * scale);
      // selection outline
      if (el.id === selectedId && scale === 1) {
        const metrics = ctx.measureText(el.text ?? '');
        const th = (el.fontSize ?? 32);
        ctx.strokeStyle = '#7c3aed';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(el.x * scale - 2, el.y * scale - 2, metrics.width + 4, th * scale + 8);
        ctx.setLineDash([]);
      }
    } else if (el.kind === 'rect') {
      const bw = (el.width ?? 80) * scale;
      const bh = (el.height ?? 80) * scale;
      ctx.fillStyle = el.fill ?? '#ffffff';
      ctx.fillRect((el.x - (el.width ?? 80) / 2) * scale, (el.y - (el.height ?? 80) / 2) * scale, bw, bh);
      if (el.id === selectedId && scale === 1) {
        ctx.strokeStyle = '#7c3aed';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect((el.x - (el.width ?? 80) / 2) * scale - 2, (el.y - (el.height ?? 80) / 2) * scale - 2, bw + 4, bh + 4);
        ctx.setLineDash([]);
      }
    } else if (el.kind === 'circle') {
      const r = (el.radius ?? 40) * scale;
      ctx.beginPath();
      ctx.arc(el.x * scale, el.y * scale, r, 0, Math.PI * 2);
      ctx.fillStyle = el.fill ?? '#ffffff';
      ctx.fill();
      if (el.id === selectedId && scale === 1) {
        ctx.strokeStyle = '#7c3aed';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    } else if (el.kind === 'star') {
      const r = (el.radius ?? 40) * scale;
      drawStar(ctx, el.x * scale, el.y * scale, r);
      ctx.fillStyle = el.fill ?? '#ffffff';
      ctx.fill();
      if (el.id === selectedId && scale === 1) {
        ctx.strokeStyle = '#7c3aed';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    ctx.restore();
  }

  // Border overlay
  if (borderStyle !== 'none' && scale === 1) {
    ctx.save();
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;
    if (borderStyle === 'dashed') ctx.setLineDash([12, 8]);
    if (borderStyle === 'double') {
      ctx.strokeRect(borderWidth, borderWidth, w - borderWidth * 2, h - borderWidth * 2);
      ctx.lineWidth = borderWidth;
      ctx.strokeRect(borderWidth * 2.5, borderWidth * 2.5, w - borderWidth * 5, h - borderWidth * 5);
    } else {
      ctx.strokeRect(borderWidth / 2, borderWidth / 2, w - borderWidth, h - borderWidth);
    }
    ctx.restore();
  }
}

// ── Hit testing ───────────────────────────────────────────────────────────────

function hitTest(
  el: CanvasElement,
  mx: number,
  my: number,
  ctx: CanvasRenderingContext2D,
): boolean {
  if (el.kind === 'overlay') return false;
  if (el.kind === 'text') {
    const fs = el.fontSize ?? 32;
    ctx.font = `${el.fontStyle ?? 'normal'} ${fs}px ${el.fontFamily ?? 'Arial'}`;
    const w = ctx.measureText(el.text ?? '').width;
    return mx >= el.x && mx <= el.x + w && my >= el.y && my <= el.y + fs + 4;
  }
  if (el.kind === 'rect') {
    const hw = (el.width ?? 80) / 2, hh = (el.height ?? 80) / 2;
    return mx >= el.x - hw && mx <= el.x + hw && my >= el.y - hh && my <= el.y + hh;
  }
  if (el.kind === 'circle' || el.kind === 'star') {
    const r = el.radius ?? 40;
    return Math.hypot(mx - el.x, my - el.y) <= r;
  }
  return false;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function FlagEditorClient({
  slug,
  countryName,
}: {
  slug: string;
  countryName: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [flagImg, setFlagImg] = useState<HTMLImageElement | null>(null);
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [history, setHistory] = useState<CanvasElement[][]>([[]]);
  const [histIdx, setHistIdx] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('text');

  // Drag state
  const dragging = useRef<{ id: string; ox: number; oy: number } | null>(null);

  // Text tool
  const [textInput, setTextInput] = useState('Your text');
  const [textFont, setTextFont] = useState('Arial');
  const [textColor, setTextColor] = useState('#ffffff');
  const [textSize, setTextSize] = useState(32);
  const [textBold, setTextBold] = useState(false);
  const [textItalic, setTextItalic] = useState(false);

  // Shape tool
  const [shapeColor, setShapeColor] = useState('#ffffff');

  // Border
  const [borderStyle, setBorderStyle] = useState<(typeof BORDER_STYLES)[number]>('none');
  const [borderColor, setBorderColor] = useState('#000000');
  const [borderWidth, setBorderWidth] = useState(4);

  // Overlay
  const [overlayColor, setOverlayColor] = useState('#000000');
  const [overlayOpacity, setOverlayOpacity] = useState(0);
  const [overlayBlend, setOverlayBlend] = useState<GlobalCompositeOperation>('source-over');

  // Load flag image
  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = `/icons/flags/circle-flags/${slug}.svg`;
    img.onload = () => setFlagImg(img);
    img.onerror = () => {
      const fb = new window.Image();
      fb.crossOrigin = 'anonymous';
      fb.src = `https://flagcdn.com/w640/${slug}.png`;
      fb.onload = () => setFlagImg(fb);
    };
  }, [slug]);

  // Redraw whenever anything changes
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderCanvas(canvas, flagImg, elements, selectedId, borderStyle, borderColor, borderWidth);
  }, [flagImg, elements, selectedId, borderStyle, borderColor, borderWidth]);

  // ── History helpers ──
  function pushHistory(next: CanvasElement[]) {
    const newHist = history.slice(0, histIdx + 1).concat([next]);
    setHistory(newHist);
    setHistIdx(newHist.length - 1);
    setElements(next);
  }

  const undo = useCallback(() => {
    if (histIdx <= 0) return;
    const idx = histIdx - 1;
    setHistIdx(idx);
    setElements(history[idx]);
    setSelectedId(null);
  }, [histIdx, history]);

  const redo = useCallback(() => {
    if (histIdx >= history.length - 1) return;
    const idx = histIdx + 1;
    setHistIdx(idx);
    setElements(history[idx]);
  }, [histIdx, history]);

  // ── Keyboard delete ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        pushHistory(elements.filter((el) => el.id !== selectedId));
        setSelectedId(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, elements]);

  // ── Canvas mouse events ──
  function getCanvasXY(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }

  function onCanvasMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    const { x, y } = getCanvasXY(e);
    const ctx = canvasRef.current!.getContext('2d')!;
    // hit test in reverse (top element first)
    for (let i = elements.length - 1; i >= 0; i--) {
      if (hitTest(elements[i], x, y, ctx)) {
        setSelectedId(elements[i].id);
        dragging.current = { id: elements[i].id, ox: x - elements[i].x, oy: y - elements[i].y };
        return;
      }
    }
    setSelectedId(null);
    dragging.current = null;
  }

  function onCanvasMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!dragging.current) return;
    const { x, y } = getCanvasXY(e);
    setElements((prev) =>
      prev.map((el) =>
        el.id === dragging.current!.id
          ? { ...el, x: x - dragging.current!.ox, y: y - dragging.current!.oy }
          : el,
      ),
    );
  }

  function onCanvasMouseUp() {
    if (dragging.current) {
      // persist position to history
      setElements((prev) => {
        setHistory((h) => {
          const newH = h.slice(0, histIdx + 1).concat([prev]);
          setHistIdx(newH.length - 1);
          return newH;
        });
        return prev;
      });
      dragging.current = null;
    }
  }

  // ── Add elements ──
  function addText() {
    const el: CanvasElement = {
      id: uid(),
      kind: 'text',
      x: CANVAS_W / 2 - 80,
      y: CANVAS_H / 2 - textSize / 2,
      text: textInput || 'Text',
      fontSize: textSize,
      fontFamily: textFont,
      fill: textColor,
      fontStyle: [textBold ? 'bold' : '', textItalic ? 'italic' : ''].filter(Boolean).join(' ') || 'normal',
    };
    pushHistory([...elements, el]);
    setSelectedId(el.id);
  }

  function addShape(kind: 'rect' | 'circle' | 'star') {
    const el: CanvasElement = {
      id: uid(),
      kind,
      x: CANVAS_W / 2,
      y: CANVAS_H / 2,
      fill: shapeColor,
      width: 80,
      height: 80,
      radius: 40,
    };
    pushHistory([...elements, el]);
    setSelectedId(el.id);
  }

  function deleteSelected() {
    if (!selectedId) return;
    pushHistory(elements.filter((e) => e.id !== selectedId));
    setSelectedId(null);
  }

  // ── Overlay sync ──
  useEffect(() => {
    setElements((prev) => {
      const withoutOverlay = prev.filter((e) => e.kind !== 'overlay');
      if (overlayOpacity === 0) return withoutOverlay;
      const el: CanvasElement = {
        id: 'overlay',
        kind: 'overlay',
        x: 0,
        y: 0,
        fill: overlayColor,
        opacity: overlayOpacity / 100,
        blendMode: overlayBlend,
      };
      return [...withoutOverlay, el];
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overlayColor, overlayOpacity, overlayBlend]);

  // ── Export ──
  function downloadPreview() {
    const offscreen = document.createElement('canvas');
    offscreen.width = 800;
    offscreen.height = Math.round((800 / CANVAS_W) * CANVAS_H);
    const scale = 800 / CANVAS_W;
    renderCanvas(offscreen, flagImg, elements, null, borderStyle, borderColor, borderWidth, scale);
    // watermark
    const ctx = offscreen.getContext('2d')!;
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.textAlign = 'center';
    ctx.fillText(WATERMARK, offscreen.width / 2, offscreen.height - 14);
    const a = document.createElement('a');
    a.download = `${slug}-flag-preview.png`;
    a.href = offscreen.toDataURL('image/png');
    a.click();
  }

  function downloadHD() {
    const scale = 4;
    const offscreen = document.createElement('canvas');
    offscreen.width = CANVAS_W * scale;
    offscreen.height = CANVAS_H * scale;
    renderCanvas(offscreen, flagImg, elements, null, borderStyle, borderColor, borderWidth, scale);
    const a = document.createElement('a');
    a.download = `${slug}-flag-hd.png`;
    a.href = offscreen.toDataURL('image/png');
    a.click();
  }

  const tabs: { id: Tab; label: string; Icon: React.ElementType }[] = [
    { id: 'text', label: 'Text', Icon: Type },
    { id: 'shapes', label: 'Shapes', Icon: Shapes },
    { id: 'border', label: 'Border', Icon: Frame },
    { id: 'overlay', label: 'Overlay', Icon: Layers },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Breadcrumb */}
      <div className="border-b border-neutral-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center gap-2 text-sm text-neutral-500">
          <Link href="/editor" className="flex items-center gap-1 hover:text-neutral-800">
            <ArrowLeft size={14} aria-hidden />
            Editor
          </Link>
          <span>/</span>
          <span className="font-medium text-neutral-800">{countryName}</span>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row lg:items-start lg:gap-8">
        {/* LEFT PANEL */}
        <aside className="w-full shrink-0 rounded-2xl border border-neutral-200 bg-white shadow-sm lg:w-60">
          {/* Undo / Redo */}
          <div className="flex items-center gap-2 border-b border-neutral-100 px-4 py-3">
            <button onClick={undo} disabled={histIdx <= 0} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 disabled:opacity-30 hover:bg-neutral-50" title="Undo">
              <Undo2 size={16} aria-hidden />
            </button>
            <button onClick={redo} disabled={histIdx >= history.length - 1} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 disabled:opacity-30 hover:bg-neutral-50" title="Redo">
              <Redo2 size={16} aria-hidden />
            </button>
            {selectedId && (
              <button onClick={deleteSelected} className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50" title="Delete selected">
                <Trash2 size={16} aria-hidden />
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="grid grid-cols-4 border-b border-neutral-100">
            {tabs.map(({ id, label, Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)} className={`flex flex-col items-center gap-1 py-3 text-[11px] font-semibold transition ${activeTab === id ? 'border-b-2 border-purple-500 text-purple-700' : 'text-neutral-400 hover:text-neutral-600'}`}>
                <Icon size={16} aria-hidden />
                {label}
              </button>
            ))}
          </div>

          <div className="p-4">
            {/* TEXT */}
            {activeTab === 'text' && (
              <div className="space-y-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-neutral-500">Text content</span>
                  <input type="text" value={textInput} onChange={(e) => setTextInput(e.target.value)} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100" placeholder="Your text" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-neutral-500">Font</span>
                  <select value={textFont} onChange={(e) => setTextFont(e.target.value)} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-purple-400">
                    {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-neutral-500">Color</span>
                  <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="h-9 w-full cursor-pointer rounded-lg border border-neutral-200" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-neutral-500">Size — {textSize}px</span>
                  <input type="range" min={12} max={72} value={textSize} onChange={(e) => setTextSize(Number(e.target.value))} className="w-full accent-purple-600" />
                </label>
                <div className="flex gap-2">
                  <button onClick={() => setTextBold((b) => !b)} className={`flex h-9 flex-1 items-center justify-center gap-1 rounded-lg border text-sm font-bold transition ${textBold ? 'border-purple-400 bg-purple-50 text-purple-700' : 'border-neutral-200 text-neutral-500'}`}>
                    <Bold size={14} aria-hidden /> Bold
                  </button>
                  <button onClick={() => setTextItalic((i) => !i)} className={`flex h-9 flex-1 items-center justify-center gap-1 rounded-lg border text-sm italic transition ${textItalic ? 'border-purple-400 bg-purple-50 text-purple-700' : 'border-neutral-200 text-neutral-500'}`}>
                    <Italic size={14} aria-hidden /> Italic
                  </button>
                </div>
                <button onClick={addText} className="mt-1 w-full rounded-xl bg-purple-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-700">
                  + Add Text
                </button>
              </div>
            )}

            {/* SHAPES */}
            {activeTab === 'shapes' && (
              <div className="space-y-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-neutral-500">Shape color</span>
                  <input type="color" value={shapeColor} onChange={(e) => setShapeColor(e.target.value)} className="h-9 w-full cursor-pointer rounded-lg border border-neutral-200" />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {([['★ Star', 'star'], ['● Circle', 'circle'], ['▬ Rect', 'rect']] as const).map(([label, kind]) => (
                    <button key={kind} onClick={() => addShape(kind)} className="col-span-1 rounded-xl border border-neutral-200 py-2.5 text-sm font-semibold text-neutral-700 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 transition">
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* BORDER */}
            {activeTab === 'border' && (
              <div className="space-y-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-neutral-500">Border style</span>
                  <select value={borderStyle} onChange={(e) => setBorderStyle(e.target.value as any)} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-purple-400">
                    {BORDER_STYLES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-neutral-500">Border color</span>
                  <input type="color" value={borderColor} onChange={(e) => setBorderColor(e.target.value)} className="h-9 w-full cursor-pointer rounded-lg border border-neutral-200" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-neutral-500">Thickness — {borderWidth}px</span>
                  <input type="range" min={1} max={10} value={borderWidth} onChange={(e) => setBorderWidth(Number(e.target.value))} className="w-full accent-purple-600" />
                </label>
              </div>
            )}

            {/* OVERLAY */}
            {activeTab === 'overlay' && (
              <div className="space-y-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-neutral-500">Overlay color</span>
                  <input type="color" value={overlayColor} onChange={(e) => setOverlayColor(e.target.value)} className="h-9 w-full cursor-pointer rounded-lg border border-neutral-200" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-neutral-500">Opacity — {overlayOpacity}%</span>
                  <input type="range" min={0} max={50} value={overlayOpacity} onChange={(e) => setOverlayOpacity(Number(e.target.value))} className="w-full accent-purple-600" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-neutral-500">Blend mode</span>
                  <select value={overlayBlend} onChange={(e) => setOverlayBlend(e.target.value as GlobalCompositeOperation)} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-purple-400">
                    {BLEND_MODES.map((m, i) => <option key={m} value={m}>{BLEND_LABELS[i]}</option>)}
                  </select>
                </label>
              </div>
            )}
          </div>
        </aside>

        {/* CENTER — CANVAS */}
        <div className="flex min-w-0 flex-1 flex-col items-center gap-4">
          <h1 className="text-xl font-bold text-neutral-800">{countryName} Flag Editor</h1>
          <div className="overflow-hidden rounded-2xl border border-neutral-200 shadow-md" style={{ maxWidth: '100%' }}>
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              style={{ display: 'block', maxWidth: '100%', cursor: 'crosshair' }}
              onMouseDown={onCanvasMouseDown}
              onMouseMove={onCanvasMouseMove}
              onMouseUp={onCanvasMouseUp}
              onMouseLeave={onCanvasMouseUp}
            />
          </div>
          <p className="text-xs text-neutral-400">Click elements to select · Drag to move · Delete key or trash icon to remove</p>
        </div>

        {/* RIGHT PANEL — EXPORT */}
        <aside className="w-full shrink-0 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm lg:w-56">
          <h2 className="mb-4 text-sm font-bold text-neutral-700">Export</h2>
          <div className="space-y-3">
            <button onClick={downloadPreview} className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 py-3 text-sm font-semibold text-neutral-700 shadow-sm hover:bg-neutral-100 transition">
              <Download size={16} aria-hidden />
              Free Preview
            </button>
            <p className="text-center text-xs text-neutral-400">800px · watermarked</p>

            <div className="my-3 border-t border-neutral-100" />

            <button onClick={downloadHD} className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 transition">
              <Download size={16} aria-hidden />
              HD Download — $5
            </button>
            <p className="text-center text-xs text-neutral-400">2400px · no watermark</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
