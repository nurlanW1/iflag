'use client';

import { useRef, useState, useCallback, useEffect, useLayoutEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Undo2, Redo2, Download,
  Type, Shapes, Frame, Layers,
  Bold, Italic, Trash2,
} from 'lucide-react';

const CANVAS_W = 600;
const CANVAS_H = 400;
const WATERMARK = 'flagswing.com';
// Canvas background color (white)
const BG = '#ffffff';

type ElementKind = 'text' | 'rect' | 'circle' | 'star' | 'triangle' | 'diamond'
  | 'pentagon' | 'hexagon' | 'heart' | 'arrow' | 'line' | 'overlay';

interface CanvasElement {
  id: string;
  kind: ElementKind;
  x: number;
  y: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  fontStyle?: string;
  width?: number;
  height?: number;
  radius?: number;
  opacity?: number;
  blendMode?: GlobalCompositeOperation;
}

const FONTS = ['Arial', 'Georgia', 'Montserrat', 'Courier New', 'Impact'];
const BLEND_MODES: GlobalCompositeOperation[] = ['source-over', 'multiply', 'screen', 'overlay', 'difference'];
const BLEND_LABELS = ['Normal', 'Multiply', 'Screen', 'Overlay', 'Difference'];
const BORDER_STYLES = ['none', 'solid', 'dashed', 'double'] as const;

function uid() { return Math.random().toString(36).slice(2); }
type Tab = 'text' | 'shapes' | 'border' | 'overlay';

// ── Shape draw helpers ────────────────────────────────────────────────────────

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const spikes = 5, inner = r * 0.42;
  let rot = (Math.PI / 2) * 3, step = Math.PI / spikes;
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * r, cy + Math.sin(rot) * r); rot += step;
    ctx.lineTo(cx + Math.cos(rot) * inner, cy + Math.sin(rot) * inner); rot += step;
  }
  ctx.closePath();
}

function drawPolygon(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, sides: number, startAngle = -Math.PI / 2) {
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const a = startAngle + (i / sides) * Math.PI * 2;
    i === 0 ? ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
             : ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  ctx.closePath();
}

function drawTriangle(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  drawPolygon(ctx, cx, cy, r, 3, -Math.PI / 2);
}

function drawDiamond(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - h / 2);
  ctx.lineTo(cx + w / 2, cy);
  ctx.lineTo(cx, cy + h / 2);
  ctx.lineTo(cx - w / 2, cy);
  ctx.closePath();
}

function drawHeart(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const s = r * 0.05;
  ctx.beginPath();
  ctx.moveTo(cx, cy + r * 0.7);
  ctx.bezierCurveTo(cx - r * 1.2, cy, cx - r * 1.2, cy - r * 0.9, cx, cy - r * 0.3);
  ctx.bezierCurveTo(cx + r * 1.2, cy - r * 0.9, cx + r * 1.2, cy, cx, cy + r * 0.7);
  ctx.closePath();
  void s;
}

function drawArrow(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number) {
  const hw = w / 2, hh = h / 2;
  const headW = hw, bodyH = hh * 0.45, bodyW = hw * 0.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy - hh);
  ctx.lineTo(cx + headW, cy);
  ctx.lineTo(cx + bodyW, cy);
  ctx.lineTo(cx + bodyW, cy + hh);
  ctx.lineTo(cx - bodyW, cy + hh);
  ctx.lineTo(cx - bodyW, cy);
  ctx.lineTo(cx - headW, cy);
  ctx.closePath();
  void bodyH;
}

function drawLine(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number) {
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, cy);
  ctx.lineTo(cx + w / 2, cy);
}

// ── Render ────────────────────────────────────────────────────────────────────

function renderCanvas(
  canvas: HTMLCanvasElement,
  elements: CanvasElement[],
  selectedId: string | null,
  borderStyle: string,
  borderColor: string,
  borderWidth: number,
  scale = 1,
) {
  const w = CANVAS_W * scale, h = CANVAS_H * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, w, h);
  // White background
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, w, h);

  for (const el of elements) {
    ctx.save();
    const fill = el.fill ?? '#333333';
    const stroke = el.stroke;
    const sw = (el.strokeWidth ?? 0) * scale;

    if (el.kind === 'overlay') {
      ctx.globalAlpha = el.opacity ?? 0;
      ctx.globalCompositeOperation = el.blendMode ?? 'source-over';
      ctx.fillStyle = fill;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
      continue;
    }

    function applyFillStroke() {
      ctx.fillStyle = fill;
      ctx.fill();
      if (stroke && sw > 0) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = sw;
        ctx.stroke();
      }
      // selection dashes
      if (el.id === selectedId && scale === 1) {
        ctx.strokeStyle = '#7c3aed';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    const sx = el.x * scale, sy = el.y * scale;
    const r = (el.radius ?? 40) * scale;
    const ew = (el.width ?? 80) * scale, eh = (el.height ?? 80) * scale;

    if (el.kind === 'text') {
      const fs = (el.fontSize ?? 32) * scale;
      ctx.font = `${el.fontStyle ?? 'normal'} ${fs}px ${el.fontFamily ?? 'Arial'}`;
      ctx.fillStyle = fill;
      ctx.fillText(el.text ?? '', sx, sy + fs);
      if (el.id === selectedId && scale === 1) {
        const mw = ctx.measureText(el.text ?? '').width;
        ctx.strokeStyle = '#7c3aed';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(sx - 2, sy - 2, mw + 4, fs + 8);
        ctx.setLineDash([]);
      }
    } else if (el.kind === 'rect') {
      ctx.beginPath();
      ctx.rect(sx - ew / 2, sy - eh / 2, ew, eh);
      applyFillStroke();
    } else if (el.kind === 'circle') {
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      applyFillStroke();
    } else if (el.kind === 'star') {
      drawStar(ctx, sx, sy, r);
      applyFillStroke();
    } else if (el.kind === 'triangle') {
      drawTriangle(ctx, sx, sy, r);
      applyFillStroke();
    } else if (el.kind === 'diamond') {
      drawDiamond(ctx, sx, sy, ew, eh);
      applyFillStroke();
    } else if (el.kind === 'pentagon') {
      drawPolygon(ctx, sx, sy, r, 5);
      applyFillStroke();
    } else if (el.kind === 'hexagon') {
      drawPolygon(ctx, sx, sy, r, 6, 0);
      applyFillStroke();
    } else if (el.kind === 'heart') {
      drawHeart(ctx, sx, sy, r);
      applyFillStroke();
    } else if (el.kind === 'arrow') {
      drawArrow(ctx, sx, sy, ew, eh);
      applyFillStroke();
    } else if (el.kind === 'line') {
      drawLine(ctx, sx, sy, ew);
      ctx.strokeStyle = fill;
      ctx.lineWidth = sw > 0 ? sw : 4 * scale;
      ctx.stroke();
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

  // Canvas border
  if (borderStyle !== 'none' && scale === 1) {
    ctx.save();
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;
    if (borderStyle === 'dashed') ctx.setLineDash([12, 8]);
    if (borderStyle === 'double') {
      ctx.strokeRect(borderWidth, borderWidth, w - borderWidth * 2, h - borderWidth * 2);
      ctx.strokeRect(borderWidth * 2.5, borderWidth * 2.5, w - borderWidth * 5, h - borderWidth * 5);
    } else {
      ctx.strokeRect(borderWidth / 2, borderWidth / 2, w - borderWidth, h - borderWidth);
    }
    ctx.restore();
  }
}

// ── Hit testing ───────────────────────────────────────────────────────────────

function hitTest(el: CanvasElement, mx: number, my: number, ctx: CanvasRenderingContext2D): boolean {
  if (el.kind === 'overlay') return false;
  if (el.kind === 'text') {
    const fs = el.fontSize ?? 32;
    ctx.font = `${el.fontStyle ?? 'normal'} ${fs}px ${el.fontFamily ?? 'Arial'}`;
    const tw = ctx.measureText(el.text ?? '').width;
    return mx >= el.x && mx <= el.x + tw && my >= el.y && my <= el.y + fs + 4;
  }
  if (el.kind === 'rect' || el.kind === 'diamond' || el.kind === 'arrow') {
    const hw = (el.width ?? 80) / 2, hh = (el.height ?? 80) / 2;
    return mx >= el.x - hw && mx <= el.x + hw && my >= el.y - hh && my <= el.y + hh;
  }
  if (el.kind === 'line') {
    return Math.abs(my - el.y) < 12 && mx >= el.x - (el.width ?? 80) / 2 && mx <= el.x + (el.width ?? 80) / 2;
  }
  // circle-like hit
  return Math.hypot(mx - el.x, my - el.y) <= (el.radius ?? 40);
}

// ── Shape button list ─────────────────────────────────────────────────────────

const SHAPE_BUTTONS: { label: string; kind: ElementKind; emoji: string }[] = [
  { label: 'Rectangle', kind: 'rect',     emoji: '▬' },
  { label: 'Circle',    kind: 'circle',   emoji: '●' },
  { label: 'Triangle',  kind: 'triangle', emoji: '▲' },
  { label: 'Star',      kind: 'star',     emoji: '★' },
  { label: 'Diamond',   kind: 'diamond',  emoji: '◆' },
  { label: 'Pentagon',  kind: 'pentagon', emoji: '⬠' },
  { label: 'Hexagon',   kind: 'hexagon',  emoji: '⬡' },
  { label: 'Heart',     kind: 'heart',    emoji: '♥' },
  { label: 'Arrow',     kind: 'arrow',    emoji: '↑' },
  { label: 'Line',      kind: 'line',     emoji: '—' },
];

// ── Main component ────────────────────────────────────────────────────────────

export default function FlagEditorClient({
  slug,
  countryName,
}: {
  slug: string;
  countryName: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [history, setHistory] = useState<CanvasElement[][]>([[]]);
  const [histIdx, setHistIdx] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('shapes');
  const dragging = useRef<{ id: string; ox: number; oy: number } | null>(null);

  // Text
  const [textInput, setTextInput] = useState('Text');
  const [textFont, setTextFont] = useState('Arial');
  const [textColor, setTextColor] = useState('#111111');
  const [textSize, setTextSize] = useState(32);
  const [textBold, setTextBold] = useState(false);
  const [textItalic, setTextItalic] = useState(false);

  // Shape
  const [shapeColor, setShapeColor] = useState('#e63946');
  const [shapeStroke, setShapeStroke] = useState('#000000');
  const [shapeStrokeW, setShapeStrokeW] = useState(0);

  // Border
  const [borderStyle, setBorderStyle] = useState<(typeof BORDER_STYLES)[number]>('none');
  const [borderColor, setBorderColor] = useState('#000000');
  const [borderWidth, setBorderWidth] = useState(4);

  // Overlay
  const [overlayColor, setOverlayColor] = useState('#000000');
  const [overlayOpacity, setOverlayOpacity] = useState(0);
  const [overlayBlend, setOverlayBlend] = useState<GlobalCompositeOperation>('source-over');

  // Redraw
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderCanvas(canvas, elements, selectedId, borderStyle, borderColor, borderWidth);
  }, [elements, selectedId, borderStyle, borderColor, borderWidth]);

  function pushHistory(next: CanvasElement[]) {
    const newHist = history.slice(0, histIdx + 1).concat([next]);
    setHistory(newHist);
    setHistIdx(newHist.length - 1);
    setElements(next);
  }

  const undo = useCallback(() => {
    if (histIdx <= 0) return;
    const i = histIdx - 1;
    setHistIdx(i); setElements(history[i]); setSelectedId(null);
  }, [histIdx, history]);

  const redo = useCallback(() => {
    if (histIdx >= history.length - 1) return;
    const i = histIdx + 1;
    setHistIdx(i); setElements(history[i]);
  }, [histIdx, history]);

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

  function getXY(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (CANVAS_W / rect.width),
      y: (e.clientY - rect.top) * (CANVAS_H / rect.height),
    };
  }

  function onMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    const { x, y } = getXY(e);
    const ctx = canvasRef.current!.getContext('2d')!;
    for (let i = elements.length - 1; i >= 0; i--) {
      if (hitTest(elements[i], x, y, ctx)) {
        setSelectedId(elements[i].id);
        dragging.current = { id: elements[i].id, ox: x - elements[i].x, oy: y - elements[i].y };
        return;
      }
    }
    setSelectedId(null); dragging.current = null;
  }

  function onMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!dragging.current) return;
    const { x, y } = getXY(e);
    setElements((prev) => prev.map((el) =>
      el.id === dragging.current!.id
        ? { ...el, x: x - dragging.current!.ox, y: y - dragging.current!.oy }
        : el,
    ));
  }

  function onMouseUp() {
    if (dragging.current) {
      setElements((prev) => {
        setHistory((h) => {
          const n = h.slice(0, histIdx + 1).concat([prev]);
          setHistIdx(n.length - 1);
          return n;
        });
        return prev;
      });
      dragging.current = null;
    }
  }

  function addText() {
    const el: CanvasElement = {
      id: uid(), kind: 'text',
      x: CANVAS_W / 2 - 60, y: CANVAS_H / 2 - textSize / 2,
      text: textInput || 'Text', fontSize: textSize,
      fontFamily: textFont, fill: textColor,
      fontStyle: [textBold ? 'bold' : '', textItalic ? 'italic' : ''].filter(Boolean).join(' ') || 'normal',
    };
    pushHistory([...elements, el]);
    setSelectedId(el.id);
  }

  function addShape(kind: ElementKind) {
    const el: CanvasElement = {
      id: uid(), kind,
      x: CANVAS_W / 2, y: CANVAS_H / 2,
      fill: shapeColor,
      stroke: shapeStrokeW > 0 ? shapeStroke : undefined,
      strokeWidth: shapeStrokeW,
      radius: 50, width: 100, height: 100,
    };
    pushHistory([...elements, el]);
    setSelectedId(el.id);
  }

  function deleteSelected() {
    if (!selectedId) return;
    pushHistory(elements.filter((e) => e.id !== selectedId));
    setSelectedId(null);
  }

  // Overlay sync
  useEffect(() => {
    setElements((prev) => {
      const rest = prev.filter((e) => e.kind !== 'overlay');
      if (overlayOpacity === 0) return rest;
      const el: CanvasElement = {
        id: 'overlay', kind: 'overlay', x: 0, y: 0,
        fill: overlayColor, opacity: overlayOpacity / 100, blendMode: overlayBlend,
      };
      return [...rest, el];
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overlayColor, overlayOpacity, overlayBlend]);

  // Export — free preview (watermarked)
  function downloadPreview() {
    const off = document.createElement('canvas');
    const scale = 800 / CANVAS_W;
    off.width = 800; off.height = Math.round(CANVAS_H * scale);
    renderCanvas(off, elements, null, borderStyle, borderColor, borderWidth, scale);
    const ctx = off.getContext('2d')!;
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.textAlign = 'center';
    ctx.fillText(WATERMARK, off.width / 2, off.height - 14);
    const a = document.createElement('a');
    a.download = `${slug}-design-preview.png`; a.href = off.toDataURL(); a.click();
  }

  // Export HD 4×
  function downloadHD() {
    const scale = 4;
    const off = document.createElement('canvas');
    off.width = CANVAS_W * scale; off.height = CANVAS_H * scale;
    renderCanvas(off, elements, null, borderStyle, borderColor, borderWidth, scale);
    const a = document.createElement('a');
    a.download = `${slug}-design-hd.png`; a.href = off.toDataURL(); a.click();
  }

  const tabs: { id: Tab; label: string; Icon: React.ElementType }[] = [
    { id: 'shapes',  label: 'Shapes',  Icon: Shapes },
    { id: 'text',    label: 'Text',    Icon: Type   },
    { id: 'border',  label: 'Border',  Icon: Frame  },
    { id: 'overlay', label: 'Overlay', Icon: Layers },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Breadcrumb */}
      <div className="border-b border-neutral-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center gap-2 text-sm text-neutral-500">
          <Link href="/editor" className="flex items-center gap-1 hover:text-neutral-800">
            <ArrowLeft size={14} aria-hidden /> Editor
          </Link>
          <span>/</span>
          <span className="font-medium text-neutral-800">{countryName}</span>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row lg:items-start lg:gap-8">

        {/* LEFT PANEL */}
        <aside className="w-full shrink-0 rounded-2xl border border-neutral-200 bg-white shadow-sm lg:w-64">

          {/* Undo / Redo / Delete */}
          <div className="flex items-center gap-2 border-b border-neutral-100 px-4 py-3">
            <button onClick={undo} disabled={histIdx <= 0} title="Undo"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 disabled:opacity-30 hover:bg-neutral-50">
              <Undo2 size={16} aria-hidden />
            </button>
            <button onClick={redo} disabled={histIdx >= history.length - 1} title="Redo"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 disabled:opacity-30 hover:bg-neutral-50">
              <Redo2 size={16} aria-hidden />
            </button>
            {selectedId && (
              <button onClick={deleteSelected} title="Delete selected"
                className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50">
                <Trash2 size={16} aria-hidden />
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="grid grid-cols-4 border-b border-neutral-100">
            {tabs.map(({ id, label, Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`flex flex-col items-center gap-1 py-3 text-[11px] font-semibold transition
                  ${activeTab === id ? 'border-b-2 border-purple-500 text-purple-700' : 'text-neutral-400 hover:text-neutral-600'}`}>
                <Icon size={16} aria-hidden />{label}
              </button>
            ))}
          </div>

          <div className="p-4">

            {/* SHAPES */}
            {activeTab === 'shapes' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {SHAPE_BUTTONS.map(({ label, kind, emoji }) => (
                    <button key={kind} onClick={() => addShape(kind)}
                      className="flex items-center gap-2 rounded-xl border border-neutral-200 px-2.5 py-2 text-xs font-semibold text-neutral-700
                        hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 transition">
                      <span className="text-base leading-none">{emoji}</span>{label}
                    </button>
                  ))}
                </div>

                <div className="border-t border-neutral-100 pt-3 space-y-3">
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-neutral-500">Fill color</span>
                    <input type="color" value={shapeColor} onChange={(e) => setShapeColor(e.target.value)}
                      className="h-9 w-full cursor-pointer rounded-lg border border-neutral-200" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-neutral-500">Stroke color</span>
                    <input type="color" value={shapeStroke} onChange={(e) => setShapeStroke(e.target.value)}
                      className="h-9 w-full cursor-pointer rounded-lg border border-neutral-200" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-neutral-500">Stroke width — {shapeStrokeW}px</span>
                    <input type="range" min={0} max={12} value={shapeStrokeW}
                      onChange={(e) => setShapeStrokeW(Number(e.target.value))} className="w-full accent-purple-600" />
                  </label>
                </div>
              </div>
            )}

            {/* TEXT */}
            {activeTab === 'text' && (
              <div className="space-y-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-neutral-500">Content</span>
                  <input type="text" value={textInput} onChange={(e) => setTextInput(e.target.value)}
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-neutral-500">Font</span>
                  <select value={textFont} onChange={(e) => setTextFont(e.target.value)}
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-purple-400">
                    {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-neutral-500">Color</span>
                  <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)}
                    className="h-9 w-full cursor-pointer rounded-lg border border-neutral-200" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-neutral-500">Size — {textSize}px</span>
                  <input type="range" min={10} max={96} value={textSize}
                    onChange={(e) => setTextSize(Number(e.target.value))} className="w-full accent-purple-600" />
                </label>
                <div className="flex gap-2">
                  <button onClick={() => setTextBold((b) => !b)}
                    className={`flex h-9 flex-1 items-center justify-center gap-1 rounded-lg border text-sm font-bold transition
                      ${textBold ? 'border-purple-400 bg-purple-50 text-purple-700' : 'border-neutral-200 text-neutral-500'}`}>
                    <Bold size={14} aria-hidden /> Bold
                  </button>
                  <button onClick={() => setTextItalic((i) => !i)}
                    className={`flex h-9 flex-1 items-center justify-center gap-1 rounded-lg border text-sm italic transition
                      ${textItalic ? 'border-purple-400 bg-purple-50 text-purple-700' : 'border-neutral-200 text-neutral-500'}`}>
                    <Italic size={14} aria-hidden /> Italic
                  </button>
                </div>
                <button onClick={addText}
                  className="w-full rounded-xl bg-purple-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-700">
                  + Add Text
                </button>
              </div>
            )}

            {/* BORDER */}
            {activeTab === 'border' && (
              <div className="space-y-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-neutral-500">Style</span>
                  <select value={borderStyle} onChange={(e) => setBorderStyle(e.target.value as any)}
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-purple-400">
                    {BORDER_STYLES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-neutral-500">Color</span>
                  <input type="color" value={borderColor} onChange={(e) => setBorderColor(e.target.value)}
                    className="h-9 w-full cursor-pointer rounded-lg border border-neutral-200" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-neutral-500">Thickness — {borderWidth}px</span>
                  <input type="range" min={1} max={20} value={borderWidth}
                    onChange={(e) => setBorderWidth(Number(e.target.value))} className="w-full accent-purple-600" />
                </label>
              </div>
            )}

            {/* OVERLAY */}
            {activeTab === 'overlay' && (
              <div className="space-y-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-neutral-500">Color</span>
                  <input type="color" value={overlayColor} onChange={(e) => setOverlayColor(e.target.value)}
                    className="h-9 w-full cursor-pointer rounded-lg border border-neutral-200" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-neutral-500">Opacity — {overlayOpacity}%</span>
                  <input type="range" min={0} max={80} value={overlayOpacity}
                    onChange={(e) => setOverlayOpacity(Number(e.target.value))} className="w-full accent-purple-600" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-neutral-500">Blend mode</span>
                  <select value={overlayBlend} onChange={(e) => setOverlayBlend(e.target.value as GlobalCompositeOperation)}
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-purple-400">
                    {BLEND_MODES.map((m, i) => <option key={m} value={m}>{BLEND_LABELS[i]}</option>)}
                  </select>
                </label>
              </div>
            )}
          </div>
        </aside>

        {/* CENTER — CANVAS */}
        <div className="flex min-w-0 flex-1 flex-col items-center gap-4">
          <h1 className="text-xl font-bold text-neutral-800">{countryName} — Flag Designer</h1>
          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-md" style={{ maxWidth: '100%' }}>
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              style={{ display: 'block', maxWidth: '100%', cursor: 'crosshair' }}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
            />
          </div>
          <p className="text-xs text-neutral-400">
            Click to select · Drag to move · Delete / Backspace to remove
          </p>
        </div>

        {/* RIGHT PANEL — EXPORT */}
        <aside className="w-full shrink-0 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm lg:w-52">
          <h2 className="mb-4 text-sm font-bold text-neutral-700">Export</h2>
          <div className="space-y-3">
            <button onClick={downloadPreview}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 py-3 text-sm font-semibold text-neutral-700 shadow-sm hover:bg-neutral-100 transition">
              <Download size={16} aria-hidden /> Free Preview
            </button>
            <p className="text-center text-xs text-neutral-400">800px · watermarked</p>
            <div className="my-3 border-t border-neutral-100" />
            <button onClick={downloadHD}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 transition">
              <Download size={16} aria-hidden /> HD — $5
            </button>
            <p className="text-center text-xs text-neutral-400">2400px · no watermark</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
