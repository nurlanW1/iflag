'use client';

import { useRef, useState, useCallback, useEffect, useLayoutEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Undo2, Redo2, Download, Eye,
  Square, Circle, Triangle, Star, Minus, Type,
  Bold, Italic, Trash2, ChevronUp, ChevronDown,
  Flag, Layers, Palette, AlignLeft, Image,
  RotateCcw,
} from 'lucide-react';
import { countryCodeToName } from '@/lib/country-code-to-name';

// ── Constants ─────────────────────────────────────────────────────────────────
const CW = 900;
const CH = 600;
const ACCENT = '#5b73ff';

type EKind = 'rect' | 'circle' | 'triangle' | 'star' | 'diamond'
  | 'pentagon' | 'hexagon' | 'heart' | 'arrow' | 'line' | 'text';

interface CE {
  id: string;
  kind: EKind;
  x: number; y: number;   // center in logical coords
  w: number; h: number;
  rot: number;            // degrees
  fill: string;
  stroke: string;
  sw: number;
  opacity: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  bold?: boolean;
  italic?: boolean;
}

type Panel = 'flags' | 'shapes' | 'text' | 'colors' | 'layers' | null;

// ── Helpers ───────────────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2, 10); }
function deg(r: number) { return r * 180 / Math.PI; }
function rad(d: number) { return d * Math.PI / 180; }

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const spikes = 5, inner = r * 0.42;
  let x = cx, y = cy - r, toggle = false;
  ctx.beginPath(); ctx.moveTo(x, y);
  for (let i = 0; i < spikes * 2; i++) {
    const a = (Math.PI / spikes) * i - Math.PI / 2;
    const rr = toggle ? inner : r;
    ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    toggle = !toggle;
  }
  ctx.closePath();
}

function drawNgon(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, n: number) {
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const a = (2 * Math.PI / n) * i - Math.PI / 2;
    i === 0 ? ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a))
            : ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
  }
  ctx.closePath();
}

function drawHeart(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const s = r * 0.9;
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.9);
  ctx.bezierCurveTo(cx - s * 1.4, cy + s * 0.3, cx - s * 1.4, cy - s * 0.6, cx, cy - s * 0.1);
  ctx.bezierCurveTo(cx + s * 1.4, cy - s * 0.6, cx + s * 1.4, cy + s * 0.3, cx, cy + s * 0.9);
  ctx.closePath();
}

function drawArrow(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number) {
  const hw = w / 2, hh = h / 2, headW = hh * 0.6, bodyH = hh * 0.5;
  ctx.beginPath();
  ctx.moveTo(cx - hw, cy - bodyH / 2);
  ctx.lineTo(cx + hw - headW, cy - bodyH / 2);
  ctx.lineTo(cx + hw - headW, cy - hh);
  ctx.lineTo(cx + hw, cy);
  ctx.lineTo(cx + hw - headW, cy + hh);
  ctx.lineTo(cx + hw - headW, cy + bodyH / 2);
  ctx.lineTo(cx - hw, cy + bodyH / 2);
  ctx.closePath();
}

function renderElement(ctx: CanvasRenderingContext2D, el: CE) {
  ctx.save();
  ctx.globalAlpha = el.opacity;
  ctx.translate(el.x, el.y);
  ctx.rotate(rad(el.rot));
  ctx.fillStyle = el.fill;
  ctx.strokeStyle = el.stroke;
  ctx.lineWidth = el.sw;

  const hw = el.w / 2, hh = el.h / 2, r = Math.min(hw, hh);

  switch (el.kind) {
    case 'rect':
      ctx.beginPath(); ctx.rect(-hw, -hh, el.w, el.h);
      break;
    case 'circle':
      ctx.beginPath(); ctx.ellipse(0, 0, hw, hh, 0, 0, Math.PI * 2);
      break;
    case 'triangle':
      ctx.beginPath();
      ctx.moveTo(0, -hh); ctx.lineTo(hw, hh); ctx.lineTo(-hw, hh);
      ctx.closePath();
      break;
    case 'star':
      drawStar(ctx, 0, 0, r);
      break;
    case 'diamond':
      ctx.beginPath();
      ctx.moveTo(0, -hh); ctx.lineTo(hw, 0); ctx.lineTo(0, hh); ctx.lineTo(-hw, 0);
      ctx.closePath();
      break;
    case 'pentagon':
      drawNgon(ctx, 0, 0, r, 5);
      break;
    case 'hexagon':
      drawNgon(ctx, 0, 0, r, 6);
      break;
    case 'heart':
      drawHeart(ctx, 0, 0, r);
      break;
    case 'arrow':
      drawArrow(ctx, 0, 0, el.w, el.h);
      break;
    case 'line':
      ctx.beginPath(); ctx.moveTo(-hw, 0); ctx.lineTo(hw, 0);
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = el.opacity;
      ctx.translate(el.x, el.y);
      ctx.rotate(rad(el.rot));
      ctx.strokeStyle = el.fill;
      ctx.lineWidth = el.sw || 4;
      ctx.beginPath(); ctx.moveTo(-hw, 0); ctx.lineTo(hw, 0);
      ctx.stroke();
      ctx.restore();
      return;
    case 'text': {
      const fs = el.fontSize ?? 40;
      const ff = el.fontFamily ?? 'Arial';
      const style = `${el.italic ? 'italic ' : ''}${el.bold ? 'bold ' : ''}${fs}px ${ff}`;
      ctx.font = style;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(el.text ?? '', 0, 0);
      if (el.sw > 0) {
        ctx.strokeText(el.text ?? '', 0, 0);
      }
      ctx.restore();
      return;
    }
  }

  ctx.fill();
  if (el.sw > 0) ctx.stroke();
  ctx.restore();
}

function hitTest(el: CE, px: number, py: number): boolean {
  const cos = Math.cos(-rad(el.rot));
  const sin = Math.sin(-rad(el.rot));
  const dx = px - el.x, dy = py - el.y;
  const lx = dx * cos - dy * sin;
  const ly = dx * sin + dy * cos;
  return Math.abs(lx) <= el.w / 2 + 4 && Math.abs(ly) <= el.h / 2 + 4;
}

// 8 resize handles + 1 rotate — positions in element-local coords
const HANDLES = [
  { id: 'nw', lx: -1, ly: -1 }, { id: 'n', lx: 0, ly: -1 }, { id: 'ne', lx: 1, ly: -1 },
  { id: 'w', lx: -1, ly: 0  },                                 { id: 'e', lx: 1, ly: 0  },
  { id: 'sw', lx: -1, ly: 1 }, { id: 's', lx: 0, ly: 1  }, { id: 'se', lx: 1, ly: 1 },
] as const;

type HandleId = typeof HANDLES[number]['id'];

function getHandlePos(el: CE, h: typeof HANDLES[number], scale: number) {
  const cos = Math.cos(rad(el.rot));
  const sin = Math.sin(rad(el.rot));
  const lx = h.lx * el.w / 2;
  const ly = h.ly * el.h / 2;
  return {
    x: (el.x + lx * cos - ly * sin) * scale,
    y: (el.y + lx * sin + ly * cos) * scale,
  };
}

function getRotHandlePos(el: CE, scale: number) {
  const cos = Math.cos(rad(el.rot));
  const sin = Math.sin(rad(el.rot));
  const lx = 0, ly = -el.h / 2 - 32;
  return {
    x: (el.x + lx * cos - ly * sin) * scale,
    y: (el.y + lx * sin + ly * cos) * scale,
  };
}

// ── Countries list ────────────────────────────────────────────────────────────
const ALL_COUNTRIES = Object.entries(countryCodeToName)
  .map(([code, name]) => ({ code: code.toLowerCase(), upper: code, name }))
  .sort((a, b) => a.name.localeCompare(b.name));

// ── Shapes catalog ────────────────────────────────────────────────────────────
const SHAPE_CATALOG: { kind: EKind; label: string }[] = [
  { kind: 'rect',    label: 'Rectangle' },
  { kind: 'circle',  label: 'Circle'    },
  { kind: 'triangle',label: 'Triangle'  },
  { kind: 'star',    label: 'Star'      },
  { kind: 'diamond', label: 'Diamond'   },
  { kind: 'pentagon',label: 'Pentagon'  },
  { kind: 'hexagon', label: 'Hexagon'   },
  { kind: 'heart',   label: 'Heart'     },
  { kind: 'arrow',   label: 'Arrow'     },
  { kind: 'line',    label: 'Line'      },
];

const PALETTE = [
  '#ffffff','#000000','#ef4444','#f97316','#eab308','#22c55e',
  '#3b82f6','#8b5cf6','#ec4899','#06b6d4','#14b8a6','#f59e0b',
];

const FONTS = ['Arial','Georgia','Impact','Courier New','Trebuchet MS'];

// ── Interaction state ─────────────────────────────────────────────────────────
type DragKind = 'move' | 'resize' | 'rotate';
interface Inter {
  kind: DragKind;
  startX: number; startY: number;
  orig: CE;
  handle?: HandleId;
  startAngle?: number;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function FlagEditorClient({ slug }: { slug: string }) {
  const countryName = countryCodeToName[slug.toUpperCase()] ?? slug.toUpperCase();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Elements
  const [elements, setElements] = useState<CE[]>([]);
  const elementsRef = useRef<CE[]>([]);
  useEffect(() => { elementsRef.current = elements; }, [elements]);

  // History
  const history = useRef<CE[][]>([[]]);
  const histIdx = useRef(0);

  const push = useCallback((els: CE[]) => {
    history.current = history.current.slice(0, histIdx.current + 1);
    history.current.push(els);
    histIdx.current = history.current.length - 1;
    setElements(els);
  }, []);

  const undo = useCallback(() => {
    if (histIdx.current > 0) {
      histIdx.current--;
      setElements(history.current[histIdx.current]);
    }
  }, []);

  const redo = useCallback(() => {
    if (histIdx.current < history.current.length - 1) {
      histIdx.current++;
      setElements(history.current[histIdx.current]);
    }
  }, []);

  // Selected element
  const [selId, setSelId] = useState<string | null>(null);
  const selEl = elements.find(e => e.id === selId) ?? null;

  // Canvas background
  const [bgColor, setBgColor] = useState('#ffffff');
  const [flagBg, setFlagBg] = useState<HTMLImageElement | null>(null);

  // Panel state
  const [panel, setPanel] = useState<Panel>('shapes');
  const [flagSearch, setFlagSearch] = useState('');

  // Interaction ref
  const interRef = useRef<Inter | null>(null);

  // Defaults for new shapes
  const [defFill, setDefFill] = useState('#3b82f6');
  const [defStroke, setDefStroke] = useState('#1e40af');
  const [defSw, setDefSw] = useState(2);
  const [defText, setDefText] = useState('Text');
  const [defFontSize, setDefFontSize] = useState(60);
  const [defFont, setDefFont] = useState('Arial');
  const [defBold, setDefBold] = useState(false);
  const [defItalic, setDefItalic] = useState(false);

  // ── ResizeObserver ──────────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => {
      const { width, height } = el.getBoundingClientRect();
      setScale(Math.min(width / CW, height / CH) * 0.92);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // ── Draw ────────────────────────────────────────────────────────────────────
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CW, CH);

    // Background
    if (flagBg) {
      ctx.drawImage(flagBg, 0, 0, CW, CH);
    } else {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, CW, CH);
    }

    // Elements
    for (const el of elements) {
      renderElement(ctx, el);
    }
  }, [elements, bgColor, flagBg]);

  // ── Keyboard ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && selId) {
        const next = elementsRef.current.filter(x => x.id !== selId);
        push(next);
        setSelId(null);
      }
      if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); }
      if (e.ctrlKey && e.key === 'y') { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selId, undo, redo, push]);

  // ── Add element helpers ─────────────────────────────────────────────────────
  const addShape = useCallback((kind: EKind) => {
    const el: CE = {
      id: uid(), kind,
      x: CW / 2, y: CH / 2,
      w: kind === 'line' ? 200 : 120,
      h: kind === 'line' ? 4 : 120,
      rot: 0,
      fill: defFill, stroke: defStroke, sw: defSw,
      opacity: 1,
    };
    const next = [...elementsRef.current, el];
    push(next);
    setSelId(el.id);
    setPanel(null);
  }, [defFill, defStroke, defSw, push]);

  const addText = useCallback(() => {
    const el: CE = {
      id: uid(), kind: 'text',
      x: CW / 2, y: CH / 2,
      w: defFontSize * (defText.length || 4) * 0.6,
      h: defFontSize * 1.2,
      rot: 0,
      fill: defFill, stroke: 'transparent', sw: 0,
      opacity: 1,
      text: defText, fontSize: defFontSize,
      fontFamily: defFont, bold: defBold, italic: defItalic,
    };
    const next = [...elementsRef.current, el];
    push(next);
    setSelId(el.id);
    setPanel(null);
  }, [defFill, defText, defFontSize, defFont, defBold, defItalic, push]);

  const loadFlag = useCallback((upper: string) => {
    const img = new window.Image();
    img.src = `/flags/${upper}.svg`;
    img.onload = () => setFlagBg(img);
    img.onerror = () => {
      const img2 = new window.Image();
      img2.crossOrigin = 'anonymous';
      img2.src = `https://flagcdn.com/w640/${upper.toLowerCase()}.png`;
      img2.onload = () => setFlagBg(img2);
    };
  }, []);

  // ── Pointer ─────────────────────────────────────────────────────────────────
  const toLogical = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    };
  }, [scale]);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const { x, y } = toLogical(e);

    // Hit test from top
    const els = [...elementsRef.current].reverse();
    const hit = els.find(el => hitTest(el, x, y));

    if (hit) {
      setSelId(hit.id);
      interRef.current = {
        kind: 'move',
        startX: x, startY: y,
        orig: { ...hit },
      };
    } else {
      setSelId(null);
      interRef.current = null;
    }
  }, [toLogical]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const inter = interRef.current;
    if (!inter) return;
    const { x, y } = toLogical(e);
    const dx = x - inter.startX;
    const dy = y - inter.startY;

    setElements(prev => prev.map(el => {
      if (el.id !== inter.orig.id) return el;
      if (inter.kind === 'move') {
        return { ...el, x: inter.orig.x + dx, y: inter.orig.y + dy };
      }
      return el;
    }));
  }, [toLogical]);

  const onPointerUp = useCallback(() => {
    if (interRef.current) {
      const cur = elementsRef.current;
      push(cur);
    }
    interRef.current = null;
  }, [push]);

  // ── Handle pointer (resize/rotate) ──────────────────────────────────────────
  const onHandlePointerDown = useCallback((
    e: React.PointerEvent<SVGCircleElement | SVGRectElement>,
    type: 'resize' | 'rotate',
    handleId?: HandleId,
  ) => {
    e.stopPropagation();
    if (!selEl) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = canvasRef.current!.getBoundingClientRect();
    const px = (e.clientX - rect.left) / scale;
    const py = (e.clientY - rect.top) / scale;

    const startAngle = type === 'rotate'
      ? deg(Math.atan2(py - selEl.y, px - selEl.x)) - selEl.rot
      : undefined;

    interRef.current = {
      kind: type,
      startX: px, startY: py,
      orig: { ...selEl },
      handle: handleId,
      startAngle,
    };
  }, [selEl, scale]);

  const onOverlayPointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    const inter = interRef.current;
    if (!inter || inter.kind === 'move') return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const px = (e.clientX - rect.left) / scale;
    const py = (e.clientY - rect.top) / scale;

    if (inter.kind === 'rotate') {
      const angle = deg(Math.atan2(py - inter.orig.y, px - inter.orig.x));
      const newRot = angle - (inter.startAngle ?? 0);
      setElements(prev => prev.map(el =>
        el.id === inter.orig.id ? { ...el, rot: newRot } : el
      ));
      return;
    }

    if (inter.kind === 'resize' && inter.handle) {
      const orig = inter.orig;
      const cosR = Math.cos(rad(orig.rot));
      const sinR = Math.sin(rad(orig.rot));
      const dx = px - inter.startX;
      const dy = py - inter.startY;

      // Project delta into element local coords
      const ldx = dx * cosR + dy * sinR;
      const ldy = -dx * sinR + dy * cosR;

      const h = inter.handle;
      let newW = orig.w, newH = orig.h, lcx = 0, lcy = 0;

      if (h.includes('e')) { newW = Math.max(20, orig.w + ldx); lcx = (newW - orig.w) / 2; }
      if (h.includes('w')) { newW = Math.max(20, orig.w - ldx); lcx = -(newW - orig.w) / 2; }
      if (h.includes('s')) { newH = Math.max(20, orig.h + ldy); lcy = (newH - orig.h) / 2; }
      if (h.includes('n')) { newH = Math.max(20, orig.h - ldy); lcy = -(newH - orig.h) / 2; }

      // Convert local center offset to global
      const gcx = lcx * cosR - lcy * sinR;
      const gcy = lcx * sinR + lcy * cosR;

      setElements(prev => prev.map(el =>
        el.id === orig.id
          ? { ...el, w: newW, h: newH, x: orig.x + gcx, y: orig.y + gcy }
          : el
      ));
    }
  }, [scale]);

  const onOverlayPointerUp = useCallback(() => {
    if (interRef.current && interRef.current.kind !== 'move') {
      push(elementsRef.current);
    }
    if (interRef.current?.kind !== 'move') {
      interRef.current = null;
    }
  }, [push]);

  // ── Update selected element property ───────────────────────────────────────
  const updateSel = useCallback((patch: Partial<CE>) => {
    if (!selId) return;
    const next = elementsRef.current.map(el =>
      el.id === selId ? { ...el, ...patch } : el
    );
    push(next);
  }, [selId, push]);

  // ── Layer order ─────────────────────────────────────────────────────────────
  const bringForward = useCallback(() => {
    if (!selId) return;
    const next = [...elementsRef.current];
    const i = next.findIndex(e => e.id === selId);
    if (i < next.length - 1) { [next[i], next[i + 1]] = [next[i + 1], next[i]]; push(next); }
  }, [selId, push]);

  const sendBackward = useCallback(() => {
    if (!selId) return;
    const next = [...elementsRef.current];
    const i = next.findIndex(e => e.id === selId);
    if (i > 0) { [next[i], next[i - 1]] = [next[i - 1], next[i]]; push(next); }
  }, [selId, push]);

  const deleteSelected = useCallback(() => {
    if (!selId) return;
    push(elementsRef.current.filter(e => e.id !== selId));
    setSelId(null);
  }, [selId, push]);

  // ── Export ──────────────────────────────────────────────────────────────────
  const exportCanvas = useCallback((scale4x = false) => {
    const sc = scale4x ? 4 : 1;
    const off = document.createElement('canvas');
    off.width = CW * sc; off.height = CH * sc;
    const ctx = off.getContext('2d')!;
    ctx.scale(sc, sc);

    if (flagBg) ctx.drawImage(flagBg, 0, 0, CW, CH);
    else { ctx.fillStyle = bgColor; ctx.fillRect(0, 0, CW, CH); }

    for (const el of elementsRef.current) renderElement(ctx, el);

    if (!scale4x) {
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText('flagswing.com', CW - 12, CH - 12);
    }

    const a = document.createElement('a');
    a.href = off.toDataURL('image/png');
    a.download = scale4x ? 'flag-hd.png' : 'flag-preview.png';
    a.click();
  }, [bgColor, flagBg]);

  // ── Filtered flags ──────────────────────────────────────────────────────────
  const filteredFlags = flagSearch.trim()
    ? ALL_COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(flagSearch.toLowerCase()) ||
        c.code.includes(flagSearch.toLowerCase())
      )
    : ALL_COUNTRIES;

  // ── SVG overlay handles ─────────────────────────────────────────────────────
  const canvasW = CW * scale;
  const canvasH = CH * scale;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[100] flex flex-col" style={{ background: '#0d0e14', fontFamily: 'system-ui, sans-serif' }}>
      {/* ── Top Bar ─────────────────────────────────────────────────────────── */}
      <div className="flex h-12 items-center gap-3 border-b px-4 shrink-0"
           style={{ borderColor: '#2a2d3a', background: '#13141e' }}>
        <Link href="/editor"
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition"
          style={{ color: '#8891a8', background: 'transparent' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#1e2030')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <ArrowLeft size={14} />
          Back
        </Link>

        <div className="h-5 w-px" style={{ background: '#2a2d3a' }} />

        <span className="text-sm font-semibold" style={{ color: '#e2e6f0' }}>
          {countryName} — Flag Editor
        </span>

        <div className="ml-auto flex items-center gap-2">
          {/* Undo / Redo */}
          <button onClick={undo} title="Undo (Ctrl+Z)"
            className="flex h-8 w-8 items-center justify-center rounded-lg transition"
            style={{ color: '#8891a8', background: 'transparent' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#1e2030')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <Undo2 size={15} />
          </button>
          <button onClick={redo} title="Redo (Ctrl+Y)"
            className="flex h-8 w-8 items-center justify-center rounded-lg transition"
            style={{ color: '#8891a8', background: 'transparent' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#1e2030')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <Redo2 size={15} />
          </button>

          <div className="h-5 w-px mx-1" style={{ background: '#2a2d3a' }} />

          {/* BG color */}
          <label className="flex items-center gap-1.5 text-xs" style={{ color: '#8891a8' }}>
            BG
            <input type="color" value={flagBg ? '#000000' : bgColor}
              disabled={!!flagBg}
              onChange={e => { setFlagBg(null); setBgColor(e.target.value); }}
              className="h-6 w-8 cursor-pointer rounded border-0 p-0"
              style={{ background: 'none' }}
            />
          </label>
          {flagBg && (
            <button onClick={() => setFlagBg(null)}
              className="rounded px-2 py-1 text-xs" style={{ color: '#8891a8' }}>
              Clear flag
            </button>
          )}

          <div className="h-5 w-px mx-1" style={{ background: '#2a2d3a' }} />

          <button onClick={() => exportCanvas(false)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition"
            style={{ background: '#1e2030', color: '#a5b1c8' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#252840')}
            onMouseLeave={e => (e.currentTarget.style.background = '#1e2030')}>
            <Eye size={13} /> Preview
          </button>

          <button onClick={() => exportCanvas(true)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition"
            style={{ background: ACCENT, color: '#fff' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
            <Download size={13} /> Export HD
          </button>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">
        {/* ── Left icon rail ───────────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-1 py-3 px-1.5 shrink-0"
             style={{ width: 56, background: '#13141e', borderRight: '1px solid #2a2d3a' }}>
          {([
            { id: 'flags' as Panel,  icon: <Flag size={18} />,    label: 'Flags'  },
            { id: 'shapes' as Panel, icon: <Square size={18} />,  label: 'Shapes' },
            { id: 'text' as Panel,   icon: <Type size={18} />,    label: 'Text'   },
            { id: 'colors' as Panel, icon: <Palette size={18} />, label: 'Colors' },
            { id: 'layers' as Panel, icon: <Layers size={18} />,  label: 'Layers' },
          ] as { id: Panel; icon: React.ReactNode; label: string }[]).map(item => (
            <button key={item.id ?? 'null'}
              onClick={() => setPanel(p => p === item.id ? null : item.id)}
              title={item.label ?? ''}
              className="flex flex-col items-center gap-1 rounded-xl py-2 px-1 w-full text-center transition"
              style={{
                color: panel === item.id ? '#fff' : '#6b7280',
                background: panel === item.id ? ACCENT : 'transparent',
              }}
              onMouseEnter={e => { if (panel !== item.id) e.currentTarget.style.background = '#1e2030'; }}
              onMouseLeave={e => { if (panel !== item.id) e.currentTarget.style.background = 'transparent'; }}
            >
              {item.icon}
              <span className="text-[9px] font-medium leading-none">{item.label}</span>
            </button>
          ))}
        </div>

        {/* ── Side panel ──────────────────────────────────────────────────── */}
        {panel && (
          <div className="flex flex-col shrink-0 overflow-y-auto"
               style={{ width: 248, background: '#1a1c24', borderRight: '1px solid #2a2d3a' }}>
            {/* Flags panel */}
            {panel === 'flags' && (
              <div className="flex flex-col gap-3 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7280' }}>
                  Flag Background
                </p>
                <input
                  type="search"
                  placeholder="Search flags…"
                  value={flagSearch}
                  onChange={e => setFlagSearch(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-xs outline-none"
                  style={{ background: '#0d0e14', borderColor: '#2a2d3a', color: '#e2e6f0' }}
                />
                <div className="grid grid-cols-3 gap-1.5">
                  {filteredFlags.slice(0, 60).map(c => (
                    <button key={c.code}
                      onClick={() => loadFlag(c.upper)}
                      title={c.name}
                      className="overflow-hidden rounded-lg transition"
                      style={{ aspectRatio: '3/2', border: '2px solid transparent' }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = ACCENT)}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}
                    >
                      <img src={`/flags/${c.upper}.svg`} alt={c.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        onError={ev => { (ev.target as HTMLImageElement).src = `https://flagcdn.com/w80/${c.code}.png`; }}
                      />
                    </button>
                  ))}
                </div>
                {filteredFlags.length > 60 && (
                  <p className="text-center text-xs" style={{ color: '#6b7280' }}>
                    Showing 60 of {filteredFlags.length} — refine search
                  </p>
                )}
              </div>
            )}

            {/* Shapes panel */}
            {panel === 'shapes' && (
              <div className="flex flex-col gap-3 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7280' }}>
                  Shapes
                </p>
                {/* Defaults */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs" style={{ color: '#8891a8' }}>Fill</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={defFill} onChange={e => setDefFill(e.target.value)}
                      className="h-7 w-10 cursor-pointer rounded border-0 p-0" />
                    <div className="flex flex-wrap gap-1">
                      {PALETTE.slice(0, 6).map(c => (
                        <button key={c} onClick={() => setDefFill(c)}
                          className="h-5 w-5 rounded" style={{ background: c, border: defFill === c ? `2px solid ${ACCENT}` : '1px solid #3a3d4a' }} />
                      ))}
                    </div>
                  </div>
                  <label className="text-xs" style={{ color: '#8891a8' }}>Stroke</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={defStroke} onChange={e => setDefStroke(e.target.value)}
                      className="h-7 w-10 cursor-pointer rounded border-0 p-0" />
                    <input type="range" min={0} max={20} value={defSw}
                      onChange={e => setDefSw(Number(e.target.value))}
                      className="flex-1" />
                    <span className="text-xs w-5" style={{ color: '#8891a8' }}>{defSw}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {SHAPE_CATALOG.map(s => (
                    <button key={s.kind} onClick={() => addShape(s.kind)}
                      className="rounded-xl py-3 text-xs font-medium transition flex items-center justify-center gap-1.5"
                      style={{ background: '#252840', color: '#c5cce0', border: '1px solid #2a2d3a' }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = ACCENT)}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2d3a')}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Text panel */}
            {panel === 'text' && (
              <div className="flex flex-col gap-3 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7280' }}>
                  Add Text
                </p>
                <input
                  type="text" value={defText} onChange={e => setDefText(e.target.value)}
                  placeholder="Your text…"
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                  style={{ background: '#0d0e14', borderColor: '#2a2d3a', color: '#e2e6f0' }}
                />
                <div className="flex flex-col gap-1">
                  <label className="text-xs" style={{ color: '#8891a8' }}>Font</label>
                  <select value={defFont} onChange={e => setDefFont(e.target.value)}
                    className="rounded-lg border px-2 py-1.5 text-xs outline-none"
                    style={{ background: '#0d0e14', borderColor: '#2a2d3a', color: '#e2e6f0' }}>
                    {FONTS.map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs" style={{ color: '#8891a8' }}>Size: {defFontSize}px</label>
                  <input type="range" min={12} max={200} value={defFontSize}
                    onChange={e => setDefFontSize(Number(e.target.value))} />
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setDefBold(b => !b)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg transition"
                    style={{ background: defBold ? ACCENT : '#252840', color: defBold ? '#fff' : '#8891a8' }}>
                    <Bold size={14} />
                  </button>
                  <button onClick={() => setDefItalic(b => !b)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg transition"
                    style={{ background: defItalic ? ACCENT : '#252840', color: defItalic ? '#fff' : '#8891a8' }}>
                    <Italic size={14} />
                  </button>
                  <label className="flex items-center gap-2 flex-1">
                    <input type="color" value={defFill} onChange={e => setDefFill(e.target.value)}
                      className="h-7 w-10 cursor-pointer rounded" />
                    <span className="text-xs" style={{ color: '#8891a8' }}>Color</span>
                  </label>
                </div>
                <button onClick={addText}
                  className="w-full rounded-xl py-2.5 text-sm font-semibold transition"
                  style={{ background: ACCENT, color: '#fff' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                  Add Text
                </button>
              </div>
            )}

            {/* Colors panel */}
            {panel === 'colors' && (
              <div className="flex flex-col gap-3 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7280' }}>
                  Color Palette
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {PALETTE.map(c => (
                    <button key={c}
                      onClick={() => { setDefFill(c); if (selEl) updateSel({ fill: c }); }}
                      className="h-10 w-full rounded-xl transition"
                      style={{ background: c, border: defFill === c ? `2px solid ${ACCENT}` : '2px solid transparent' }}
                    />
                  ))}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs" style={{ color: '#8891a8' }}>Custom</label>
                  <input type="color" value={defFill}
                    onChange={e => { setDefFill(e.target.value); if (selEl) updateSel({ fill: e.target.value }); }}
                    className="h-10 w-full cursor-pointer rounded-xl border-0 p-0" />
                </div>
              </div>
            )}

            {/* Layers panel */}
            {panel === 'layers' && (
              <div className="flex flex-col gap-2 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7280' }}>
                  Layers ({elements.length})
                </p>
                {[...elements].reverse().map((el, i) => (
                  <button key={el.id}
                    onClick={() => setSelId(el.id)}
                    className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition w-full"
                    style={{
                      background: selId === el.id ? '#252840' : 'transparent',
                      color: '#c5cce0',
                      border: selId === el.id ? `1px solid ${ACCENT}` : '1px solid transparent',
                    }}>
                    <span className="text-[10px] w-4 text-center" style={{ color: '#6b7280' }}>
                      {elements.length - i}
                    </span>
                    <span className="flex-1 truncate capitalize">
                      {el.kind === 'text' ? `"${el.text?.slice(0, 12) ?? ''}"` : el.kind}
                    </span>
                    <span className="h-3 w-3 rounded" style={{ background: el.fill }} />
                  </button>
                ))}
                {elements.length === 0 && (
                  <p className="text-xs text-center py-6" style={{ color: '#4b5563' }}>
                    No elements yet
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Canvas area ──────────────────────────────────────────────────── */}
        <div ref={containerRef}
             className="relative flex flex-1 items-center justify-center"
             style={{ background: 'radial-gradient(ellipse at 50% 40%, #1a1d2e 0%, #0d0e14 70%)' }}>
          {/* Canvas + SVG overlay wrapper */}
          <div className="relative" style={{ width: canvasW, height: canvasH }}>
            <canvas
              ref={canvasRef}
              width={CW}
              height={CH}
              style={{
                display: 'block',
                width: canvasW,
                height: canvasH,
                cursor: selEl ? 'move' : 'default',
                borderRadius: 2,
                boxShadow: '0 8px 48px rgba(0,0,0,0.6)',
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            />

            {/* Transform handles overlay */}
            {selEl && (
              <svg
                style={{ position: 'absolute', inset: 0, width: canvasW, height: canvasH, overflow: 'visible', pointerEvents: 'none' }}
                onPointerMove={onOverlayPointerMove}
                onPointerUp={onOverlayPointerUp}
              >
                {/* Bounding box */}
                {(() => {
                  const el = selEl;
                  const cos = Math.cos(rad(el.rot));
                  const sin = Math.sin(rad(el.rot));
                  const corners = [
                    { lx: -el.w/2, ly: -el.h/2 }, { lx: el.w/2, ly: -el.h/2 },
                    { lx: el.w/2, ly: el.h/2 },   { lx: -el.w/2, ly: el.h/2 },
                  ].map(({ lx, ly }) => ({
                    x: (el.x + lx * cos - ly * sin) * scale,
                    y: (el.y + lx * sin + ly * cos) * scale,
                  }));
                  const pts = corners.map(c => `${c.x},${c.y}`).join(' ');
                  return <polygon points={pts} fill="none" stroke={ACCENT} strokeWidth={1.5} strokeDasharray="5 3" />;
                })()}

                {/* Rotate handle line */}
                {(() => {
                  const rp = getRotHandlePos(selEl, scale);
                  const tp = getHandlePos(selEl, HANDLES[1], scale); // north
                  return <line x1={tp.x} y1={tp.y} x2={rp.x} y2={rp.y} stroke={ACCENT} strokeWidth={1.5} />;
                })()}

                {/* Rotate handle circle */}
                {(() => {
                  const rp = getRotHandlePos(selEl, scale);
                  return (
                    <circle cx={rp.x} cy={rp.y} r={7} fill="#fff" stroke={ACCENT} strokeWidth={2}
                      style={{ cursor: 'grab', pointerEvents: 'all' }}
                      onPointerDown={e => onHandlePointerDown(e as unknown as React.PointerEvent<SVGCircleElement>, 'rotate')} />
                  );
                })()}

                {/* 8 resize handles */}
                {HANDLES.map(h => {
                  const pos = getHandlePos(selEl, h, scale);
                  const cursors: Record<HandleId, string> = {
                    nw: 'nw-resize', n: 'n-resize', ne: 'ne-resize',
                    w: 'w-resize',                   e: 'e-resize',
                    sw: 'sw-resize', s: 's-resize', se: 'se-resize',
                  };
                  return (
                    <rect key={h.id}
                      x={pos.x - 5} y={pos.y - 5} width={10} height={10}
                      fill="#fff" stroke={ACCENT} strokeWidth={2} rx={2}
                      style={{ cursor: cursors[h.id], pointerEvents: 'all' }}
                      onPointerDown={e => onHandlePointerDown(e as unknown as React.PointerEvent<SVGRectElement>, 'resize', h.id)}
                    />
                  );
                })}
              </svg>
            )}
          </div>
        </div>

        {/* ── Right properties panel ──────────────────────────────────────── */}
        {selEl && (
          <div className="flex shrink-0 flex-col gap-0 overflow-y-auto"
               style={{ width: 224, background: '#1a1c24', borderLeft: '1px solid #2a2d3a' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#2a2d3a' }}>
              <span className="text-xs font-semibold capitalize" style={{ color: '#e2e6f0' }}>
                {selEl.kind}
              </span>
              <button onClick={deleteSelected}
                className="flex h-7 w-7 items-center justify-center rounded-lg transition"
                style={{ color: '#ef4444', background: 'transparent' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#2a1a1a')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <Trash2 size={13} />
              </button>
            </div>

            {/* Position & size */}
            <section className="px-3 py-3 border-b" style={{ borderColor: '#2a2d3a' }}>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#6b7280' }}>Transform</p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { label: 'X', val: Math.round(selEl.x), key: 'x' },
                  { label: 'Y', val: Math.round(selEl.y), key: 'y' },
                  { label: 'W', val: Math.round(selEl.w), key: 'w' },
                  { label: 'H', val: Math.round(selEl.h), key: 'h' },
                ] as { label: string; val: number; key: keyof CE }[]).map(f => (
                  <label key={f.key} className="flex flex-col gap-1">
                    <span className="text-[10px]" style={{ color: '#6b7280' }}>{f.label}</span>
                    <input type="number" value={f.val}
                      onChange={e => updateSel({ [f.key]: Number(e.target.value) } as Partial<CE>)}
                      className="w-full rounded-lg border px-2 py-1.5 text-xs outline-none"
                      style={{ background: '#0d0e14', borderColor: '#2a2d3a', color: '#e2e6f0' }}
                    />
                  </label>
                ))}
              </div>
              <label className="mt-2 flex flex-col gap-1">
                <span className="text-[10px]" style={{ color: '#6b7280' }}>Rotation: {Math.round(selEl.rot)}°</span>
                <input type="range" min={-180} max={180} value={selEl.rot}
                  onChange={e => updateSel({ rot: Number(e.target.value) })} />
              </label>
              <label className="mt-2 flex flex-col gap-1">
                <span className="text-[10px]" style={{ color: '#6b7280' }}>Opacity: {Math.round(selEl.opacity * 100)}%</span>
                <input type="range" min={0} max={1} step={0.01} value={selEl.opacity}
                  onChange={e => updateSel({ opacity: Number(e.target.value) })} />
              </label>
            </section>

            {/* Fill & Stroke */}
            <section className="px-3 py-3 border-b" style={{ borderColor: '#2a2d3a' }}>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#6b7280' }}>Appearance</p>
              <label className="flex items-center justify-between mb-2">
                <span className="text-xs" style={{ color: '#8891a8' }}>Fill</span>
                <input type="color" value={selEl.fill}
                  onChange={e => updateSel({ fill: e.target.value })}
                  className="h-7 w-12 cursor-pointer rounded border-0 p-0" />
              </label>
              {selEl.kind !== 'text' && (
                <>
                  <label className="flex items-center justify-between mb-1">
                    <span className="text-xs" style={{ color: '#8891a8' }}>Stroke</span>
                    <input type="color" value={selEl.stroke}
                      onChange={e => updateSel({ stroke: e.target.value })}
                      className="h-7 w-12 cursor-pointer rounded border-0 p-0" />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px]" style={{ color: '#6b7280' }}>Stroke width: {selEl.sw}px</span>
                    <input type="range" min={0} max={30} value={selEl.sw}
                      onChange={e => updateSel({ sw: Number(e.target.value) })} />
                  </label>
                </>
              )}
            </section>

            {/* Text properties */}
            {selEl.kind === 'text' && (
              <section className="px-3 py-3 border-b" style={{ borderColor: '#2a2d3a' }}>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#6b7280' }}>Text</p>
                <input type="text" value={selEl.text ?? ''}
                  onChange={e => updateSel({ text: e.target.value })}
                  className="mb-2 w-full rounded-lg border px-2 py-1.5 text-xs outline-none"
                  style={{ background: '#0d0e14', borderColor: '#2a2d3a', color: '#e2e6f0' }}
                />
                <select value={selEl.fontFamily ?? 'Arial'}
                  onChange={e => updateSel({ fontFamily: e.target.value })}
                  className="mb-2 w-full rounded-lg border px-2 py-1.5 text-xs outline-none"
                  style={{ background: '#0d0e14', borderColor: '#2a2d3a', color: '#e2e6f0' }}>
                  {FONTS.map(f => <option key={f}>{f}</option>)}
                </select>
                <label className="flex flex-col gap-1 mb-2">
                  <span className="text-[10px]" style={{ color: '#6b7280' }}>Size: {selEl.fontSize ?? 40}px</span>
                  <input type="range" min={8} max={300} value={selEl.fontSize ?? 40}
                    onChange={e => updateSel({ fontSize: Number(e.target.value) })} />
                </label>
                <div className="flex gap-2">
                  <button onClick={() => updateSel({ bold: !selEl.bold })}
                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{ background: selEl.bold ? ACCENT : '#252840', color: selEl.bold ? '#fff' : '#8891a8' }}>
                    <Bold size={13} />
                  </button>
                  <button onClick={() => updateSel({ italic: !selEl.italic })}
                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{ background: selEl.italic ? ACCENT : '#252840', color: selEl.italic ? '#fff' : '#8891a8' }}>
                    <Italic size={13} />
                  </button>
                </div>
              </section>
            )}

            {/* Layer order */}
            <section className="px-3 py-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#6b7280' }}>Layer</p>
              <div className="flex gap-2">
                <button onClick={bringForward}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition"
                  style={{ background: '#252840', color: '#c5cce0' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = ACCENT)}
                  onMouseLeave={e => {}}>
                  <ChevronUp size={13} /> Forward
                </button>
                <button onClick={sendBackward}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition"
                  style={{ background: '#252840', color: '#c5cce0' }}>
                  <ChevronDown size={13} /> Back
                </button>
              </div>
            </section>
          </div>
        )}
      </div>

      {/* ── Status bar ──────────────────────────────────────────────────────── */}
      <div className="flex h-7 items-center gap-4 px-4 shrink-0 border-t text-[10px]"
           style={{ background: '#13141e', borderColor: '#2a2d3a', color: '#6b7280' }}>
        <span>{elements.length} element{elements.length !== 1 ? 's' : ''}</span>
        {selEl && <><span style={{ color: '#2a2d3a' }}>|</span><span style={{ color: ACCENT }}>Selected: {selEl.kind}</span></>}
        <span style={{ color: '#2a2d3a' }}>|</span>
        <span>{CW} × {CH}px</span>
        <span style={{ color: '#2a2d3a' }}>|</span>
        <span>{Math.round(scale * 100)}% zoom</span>
      </div>
    </div>
  );
}
