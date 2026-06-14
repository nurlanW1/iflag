'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
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
// Konva — client only
const Stage = dynamic(() => import('react-konva').then((m) => m.Stage), { ssr: false });
const Layer = dynamic(() => import('react-konva').then((m) => m.Layer), { ssr: false });
const KImage = dynamic(() => import('react-konva').then((m) => m.Image), { ssr: false });
const Text = dynamic(() => import('react-konva').then((m) => m.Text), { ssr: false });
const Rect = dynamic(() => import('react-konva').then((m) => m.Rect), { ssr: false });
const Circle = dynamic(() => import('react-konva').then((m) => m.Circle), { ssr: false });
const RegularPolygon = dynamic(() => import('react-konva').then((m) => m.RegularPolygon), { ssr: false });
const Transformer = dynamic(() => import('react-konva').then((m) => m.Transformer), { ssr: false });

const CANVAS_W = 600;
const CANVAS_H = 400;
const WATERMARK = 'flagswing.com';

type ElementType = 'text' | 'rect' | 'circle' | 'star' | 'overlay';

interface CanvasElement {
  id: string;
  type: ElementType;
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
  blendMode?: string;
}

const FONTS = ['Arial', 'Georgia', 'Montserrat'];
const BLEND_MODES = ['normal', 'multiply', 'screen'] as const;
const BORDER_STYLES = ['none', 'solid', 'dashed', 'double'] as const;

function uid() {
  return Math.random().toString(36).slice(2);
}

type Tab = 'text' | 'shapes' | 'border' | 'overlay';

export default function FlagEditorClient({
  slug,
  countryName,
}: {
  slug: string;
  countryName: string;
}) {
  const stageRef = useRef<any>(null);
  const trRef = useRef<any>(null);

  const [flagImg, setFlagImg] = useState<HTMLImageElement | null>(null);
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [history, setHistory] = useState<CanvasElement[][]>([[]]);
  const [histIdx, setHistIdx] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('text');

  // Text tool state
  const [textInput, setTextInput] = useState('Your text');
  const [textFont, setTextFont] = useState('Arial');
  const [textColor, setTextColor] = useState('#ffffff');
  const [textSize, setTextSize] = useState(32);
  const [textBold, setTextBold] = useState(false);
  const [textItalic, setTextItalic] = useState(false);

  // Shape tool state
  const [shapeColor, setShapeColor] = useState('#ffffff');

  // Border state
  const [borderStyle, setBorderStyle] = useState<(typeof BORDER_STYLES)[number]>('none');
  const [borderColor, setBorderColor] = useState('#000000');
  const [borderWidth, setBorderWidth] = useState(4);

  // Overlay state
  const [overlayColor, setOverlayColor] = useState('#000000');
  const [overlayOpacity, setOverlayOpacity] = useState(0);
  const [overlayBlend, setOverlayBlend] = useState<(typeof BLEND_MODES)[number]>('normal');

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

  // Sync transformer
  useEffect(() => {
    if (!trRef.current || !stageRef.current) return;
    const node = stageRef.current.findOne(`#${selectedId}`);
    if (node) {
      trRef.current.nodes([node]);
      trRef.current.getLayer()?.batchDraw();
    } else {
      trRef.current.nodes([]);
    }
  }, [selectedId, elements]);

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

  function addText() {
    const el: CanvasElement = {
      id: uid(),
      type: 'text',
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

  function addShape(type: 'rect' | 'circle' | 'star') {
    const el: CanvasElement = {
      id: uid(),
      type,
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

  function updateElement(id: string, patch: Partial<CanvasElement>) {
    const next = elements.map((e) => (e.id === id ? { ...e, ...patch } : e));
    pushHistory(next);
  }

  // Download preview (watermarked)
  function downloadPreview() {
    if (!stageRef.current) return;
    const uri = stageRef.current.toDataURL({ pixelRatio: 800 / CANVAS_W });
    // Add watermark via canvas
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = Math.round((800 / CANVAS_W) * CANVAS_H);
    const ctx = canvas.getContext('2d')!;
    const img = new window.Image();
    img.src = uri;
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctx.font = 'bold 22px Arial';
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.textAlign = 'center';
      ctx.fillText(WATERMARK, canvas.width / 2, canvas.height - 16);
      const a = document.createElement('a');
      a.download = `${slug}-flag-preview.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
  }

  // Download HD (4x, no watermark — after payment)
  function downloadHD() {
    if (!stageRef.current) return;
    const uri = stageRef.current.toDataURL({ pixelRatio: 4 });
    const a = document.createElement('a');
    a.download = `${slug}-flag-hd.png`;
    a.href = uri;
    a.click();
  }

  const overlayEl = elements.find((e) => e.type === 'overlay');

  // Sync overlay element with panel
  useEffect(() => {
    if (overlayOpacity === 0) {
      setElements((prev) => prev.filter((e) => e.type !== 'overlay'));
      return;
    }
    setElements((prev) => {
      const existing = prev.find((e) => e.type === 'overlay');
      const el: CanvasElement = {
        id: existing?.id ?? uid(),
        type: 'overlay',
        x: 0,
        y: 0,
        width: CANVAS_W,
        height: CANVAS_H,
        fill: overlayColor,
        opacity: overlayOpacity / 100,
        blendMode: overlayBlend,
      };
      if (existing) return prev.map((e) => (e.type === 'overlay' ? el : e));
      return [...prev, el];
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overlayColor, overlayOpacity, overlayBlend]);

  const tabs: { id: Tab; label: string; Icon: any }[] = [
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
            <button
              onClick={undo}
              disabled={histIdx <= 0}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 disabled:opacity-30 hover:bg-neutral-50"
              title="Undo"
            >
              <Undo2 size={16} aria-hidden />
            </button>
            <button
              onClick={redo}
              disabled={histIdx >= history.length - 1}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 disabled:opacity-30 hover:bg-neutral-50"
              title="Redo"
            >
              <Redo2 size={16} aria-hidden />
            </button>
            {selectedId && (
              <button
                onClick={deleteSelected}
                className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50"
                title="Delete selected"
              >
                <Trash2 size={16} aria-hidden />
              </button>
            )}
          </div>

          {/* Tab bar */}
          <div className="grid grid-cols-4 border-b border-neutral-100">
            {tabs.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex flex-col items-center gap-1 py-3 text-[11px] font-semibold transition ${activeTab === id ? 'border-b-2 border-purple-500 text-purple-700' : 'text-neutral-400 hover:text-neutral-600'}`}
              >
                <Icon size={16} aria-hidden />
                {label}
              </button>
            ))}
          </div>

          <div className="p-4">
            {/* TEXT TAB */}
            {activeTab === 'text' && (
              <div className="space-y-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-neutral-500">Text content</span>
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                    placeholder="Your text"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-neutral-500">Font</span>
                  <select
                    value={textFont}
                    onChange={(e) => setTextFont(e.target.value)}
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-purple-400"
                  >
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
                  <button
                    onClick={() => setTextBold((b) => !b)}
                    className={`flex h-9 flex-1 items-center justify-center gap-1 rounded-lg border text-sm font-bold transition ${textBold ? 'border-purple-400 bg-purple-50 text-purple-700' : 'border-neutral-200 text-neutral-500'}`}
                  >
                    <Bold size={14} aria-hidden /> Bold
                  </button>
                  <button
                    onClick={() => setTextItalic((i) => !i)}
                    className={`flex h-9 flex-1 items-center justify-center gap-1 rounded-lg border text-sm italic transition ${textItalic ? 'border-purple-400 bg-purple-50 text-purple-700' : 'border-neutral-200 text-neutral-500'}`}
                  >
                    <Italic size={14} aria-hidden /> Italic
                  </button>
                </div>
                <button
                  onClick={addText}
                  className="mt-1 w-full rounded-xl bg-purple-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-700"
                >
                  + Add Text
                </button>
              </div>
            )}

            {/* SHAPES TAB */}
            {activeTab === 'shapes' && (
              <div className="space-y-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-neutral-500">Shape color</span>
                  <input type="color" value={shapeColor} onChange={(e) => setShapeColor(e.target.value)} className="h-9 w-full cursor-pointer rounded-lg border border-neutral-200" />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: '★ Star', action: () => addShape('star') },
                    { label: '● Circle', action: () => addShape('circle') },
                    { label: '▬ Rect', action: () => addShape('rect') },
                  ].map(({ label, action }) => (
                    <button
                      key={label}
                      onClick={action}
                      className="col-span-1 rounded-xl border border-neutral-200 py-2.5 text-sm font-semibold text-neutral-700 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 transition"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* BORDER TAB */}
            {activeTab === 'border' && (
              <div className="space-y-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-neutral-500">Border style</span>
                  <select
                    value={borderStyle}
                    onChange={(e) => setBorderStyle(e.target.value as any)}
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-purple-400"
                  >
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

            {/* OVERLAY TAB */}
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
                  <select
                    value={overlayBlend}
                    onChange={(e) => setOverlayBlend(e.target.value as any)}
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-purple-400"
                  >
                    {BLEND_MODES.map((m) => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
                  </select>
                </label>
              </div>
            )}
          </div>
        </aside>

        {/* CENTER — CANVAS */}
        <div className="flex min-w-0 flex-1 flex-col items-center gap-4">
          <h1 className="text-xl font-bold text-neutral-800">{countryName} Flag Editor</h1>

          <div
            className="overflow-hidden rounded-2xl border border-neutral-200 shadow-md"
            style={{
              outline: borderStyle !== 'none' ? `${borderWidth}px ${borderStyle} ${borderColor}` : undefined,
            }}
          >
            <Stage
              ref={stageRef}
              width={CANVAS_W}
              height={CANVAS_H}
              style={{ display: 'block', maxWidth: '100%' }}
              onMouseDown={(e) => {
                if (e.target === e.target.getStage()) setSelectedId(null);
              }}
              onTap={(e) => {
                if (e.target === e.target.getStage()) setSelectedId(null);
              }}
            >
              <Layer>
                {/* Flag background */}
                {flagImg && (
                  <KImage
                    image={flagImg}
                    x={0}
                    y={0}
                    width={CANVAS_W}
                    height={CANVAS_H}
                    listening={false}
                  />
                )}

                {/* Elements */}
                {elements.map((el) => {
                  if (el.type === 'overlay') {
                    return (
                      <Rect
                        key={el.id}
                        id={el.id}
                        x={0}
                        y={0}
                        width={CANVAS_W}
                        height={CANVAS_H}
                        fill={el.fill}
                        opacity={el.opacity}
                        globalCompositeOperation={el.blendMode as any}
                        listening={false}
                      />
                    );
                  }
                  if (el.type === 'text') {
                    return (
                      <Text
                        key={el.id}
                        id={el.id}
                        x={el.x}
                        y={el.y}
                        text={el.text}
                        fontSize={el.fontSize}
                        fontFamily={el.fontFamily}
                        fill={el.fill}
                        fontStyle={el.fontStyle}
                        draggable
                        onClick={() => setSelectedId(el.id)}
                        onTap={() => setSelectedId(el.id)}
                        onDragEnd={(e) => updateElement(el.id, { x: e.target.x(), y: e.target.y() })}
                      />
                    );
                  }
                  if (el.type === 'rect') {
                    return (
                      <Rect
                        key={el.id}
                        id={el.id}
                        x={el.x - (el.width ?? 80) / 2}
                        y={el.y - (el.height ?? 80) / 2}
                        width={el.width}
                        height={el.height}
                        fill={el.fill}
                        draggable
                        onClick={() => setSelectedId(el.id)}
                        onTap={() => setSelectedId(el.id)}
                        onDragEnd={(e) => updateElement(el.id, { x: e.target.x() + (el.width ?? 80) / 2, y: e.target.y() + (el.height ?? 80) / 2 })}
                      />
                    );
                  }
                  if (el.type === 'circle') {
                    return (
                      <Circle
                        key={el.id}
                        id={el.id}
                        x={el.x}
                        y={el.y}
                        radius={el.radius ?? 40}
                        fill={el.fill}
                        draggable
                        onClick={() => setSelectedId(el.id)}
                        onTap={() => setSelectedId(el.id)}
                        onDragEnd={(e) => updateElement(el.id, { x: e.target.x(), y: e.target.y() })}
                      />
                    );
                  }
                  if (el.type === 'star') {
                    return (
                      <RegularPolygon
                        key={el.id}
                        id={el.id}
                        x={el.x}
                        y={el.y}
                        sides={5}
                        radius={el.radius ?? 40}
                        fill={el.fill}
                        draggable
                        onClick={() => setSelectedId(el.id)}
                        onTap={() => setSelectedId(el.id)}
                        onDragEnd={(e) => updateElement(el.id, { x: e.target.x(), y: e.target.y() })}
                      />
                    );
                  }
                  return null;
                })}

                {/* Transformer */}
                <Transformer
                  ref={trRef}
                  boundBoxFunc={(_, newBox) => newBox}
                />
              </Layer>
            </Stage>
          </div>

          <p className="text-xs text-neutral-400">Click elements to select • Drag to move • Delete key or trash icon to remove</p>
        </div>

        {/* RIGHT PANEL — EXPORT */}
        <aside className="w-full shrink-0 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm lg:w-56">
          <h2 className="mb-4 text-sm font-bold text-neutral-700">Export</h2>

          <div className="space-y-3">
            {/* Free preview */}
            <button
              onClick={downloadPreview}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 py-3 text-sm font-semibold text-neutral-700 shadow-sm hover:bg-neutral-100 transition"
            >
              <Download size={16} aria-hidden />
              Free Preview
            </button>
            <p className="text-center text-xs text-neutral-400">800px • watermarked</p>

            <div className="my-3 border-t border-neutral-100" />

            {/* HD download — Paddle */}
            <button
              onClick={downloadHD}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 transition"
            >
              <Download size={16} aria-hidden />
              HD Download — $5
            </button>
            <p className="text-center text-xs text-neutral-400">2400px • no watermark</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
