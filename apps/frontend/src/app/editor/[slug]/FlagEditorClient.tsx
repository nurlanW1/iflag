'use client';

import { useRef, useState, useCallback, useEffect, useLayoutEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Undo2, Redo2, Download, Eye,
  Type, Bold, Italic, Trash2, ChevronUp, ChevronDown,
  Flag, Layers, Palette, Gamepad2,
} from 'lucide-react';
import { countryCodeToName } from '@/lib/country-code-to-name';

// ── Constants ─────────────────────────────────────────────────────────────────
const CW = 900;
const CH = 600;
const ACCENT = '#5b73ff';

// Light theme tokens
const T = {
  bg:         '#f0f2f8',      // canvas area bg
  topbar:     '#ffffff',      // top bar bg
  rail:       '#ffffff',      // icon rail bg
  panel:      '#ffffff',      // side panel bg
  border:     '#e2e8f0',      // borders
  text:       '#1a202c',      // primary text
  textSub:    '#64748b',      // secondary text
  textMuted:  '#94a3b8',      // muted text
  hover:      '#f1f5f9',      // hover bg
  selBg:      '#eff3ff',      // selected item bg
  inputBg:    '#f8fafc',      // input backgrounds
  statusBar:  '#f8f9fc',      // status bar bg
  shadow:     '0 1px 0 0 #e2e8f0',
};

type EKind = 'rect' | 'circle' | 'triangle' | 'star' | 'diamond'
  | 'pentagon' | 'hexagon' | 'heart' | 'arrow' | 'line' | 'text';

interface CE {
  id: string;
  kind: EKind;
  x: number; y: number;
  w: number; h: number;
  rot: number;
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
function rad(d: number) { return d * Math.PI / 180; }
function deg(r: number) { return r * 180 / Math.PI; }

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const spikes = 5, inner = r * 0.42;
  let toggle = false;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const a = (Math.PI / spikes) * i - Math.PI / 2;
    const rr = toggle ? inner : r;
    i === 0 ? ctx.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr)
            : ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
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
    case 'rect':     ctx.beginPath(); ctx.rect(-hw, -hh, el.w, el.h); break;
    case 'circle':   ctx.beginPath(); ctx.ellipse(0, 0, hw, hh, 0, 0, Math.PI * 2); break;
    case 'triangle': ctx.beginPath(); ctx.moveTo(0, -hh); ctx.lineTo(hw, hh); ctx.lineTo(-hw, hh); ctx.closePath(); break;
    case 'star':     drawStar(ctx, 0, 0, r); break;
    case 'diamond':  ctx.beginPath(); ctx.moveTo(0, -hh); ctx.lineTo(hw, 0); ctx.lineTo(0, hh); ctx.lineTo(-hw, 0); ctx.closePath(); break;
    case 'pentagon': drawNgon(ctx, 0, 0, r, 5); break;
    case 'hexagon':  drawNgon(ctx, 0, 0, r, 6); break;
    case 'heart':    drawHeart(ctx, 0, 0, r); break;
    case 'arrow':    drawArrow(ctx, 0, 0, el.w, el.h); break;
    case 'line':
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
      ctx.font = `${el.italic ? 'italic ' : ''}${el.bold ? 'bold ' : ''}${fs}px ${el.fontFamily ?? 'Arial'}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(el.text ?? '', 0, 0);
      if (el.sw > 0) ctx.strokeText(el.text ?? '', 0, 0);
      ctx.restore();
      return;
    }
  }
  ctx.fill();
  if (el.sw > 0) ctx.stroke();
  ctx.restore();
}

function hitTest(el: CE, px: number, py: number) {
  const cos = Math.cos(-rad(el.rot)), sin = Math.sin(-rad(el.rot));
  const dx = px - el.x, dy = py - el.y;
  const lx = dx * cos - dy * sin, ly = dx * sin + dy * cos;
  return Math.abs(lx) <= el.w / 2 + 4 && Math.abs(ly) <= el.h / 2 + 4;
}

const HANDLES = [
  { id: 'nw', lx: -1, ly: -1 }, { id: 'n', lx: 0, ly: -1 }, { id: 'ne', lx: 1, ly: -1 },
  { id: 'w',  lx: -1, ly: 0  },                               { id: 'e',  lx: 1, ly: 0  },
  { id: 'sw', lx: -1, ly: 1  }, { id: 's', lx: 0, ly: 1  }, { id: 'se', lx: 1, ly: 1  },
] as const;
type HandleId = typeof HANDLES[number]['id'];

function getHandlePos(el: CE, h: typeof HANDLES[number], scale: number) {
  const cos = Math.cos(rad(el.rot)), sin = Math.sin(rad(el.rot));
  const lx = h.lx * el.w / 2, ly = h.ly * el.h / 2;
  return { x: (el.x + lx * cos - ly * sin) * scale, y: (el.y + lx * sin + ly * cos) * scale };
}

function getRotHandlePos(el: CE, scale: number) {
  const cos = Math.cos(rad(el.rot)), sin = Math.sin(rad(el.rot));
  const ly = -el.h / 2 - 32;
  return { x: (el.x - ly * sin) * scale, y: (el.y + ly * cos) * scale };
}

// ── Data ──────────────────────────────────────────────────────────────────────
const ALL_COUNTRIES = Object.entries(countryCodeToName)
  .map(([code, name]) => ({ code: code.toLowerCase(), upper: code, name }))
  .sort((a, b) => a.name.localeCompare(b.name));

const SHAPE_CATALOG: { kind: EKind; label: string }[] = [
  { kind: 'rect',    label: 'Rectangle' }, { kind: 'circle',   label: 'Circle'   },
  { kind: 'triangle',label: 'Triangle'  }, { kind: 'star',     label: 'Star'     },
  { kind: 'diamond', label: 'Diamond'   }, { kind: 'pentagon', label: 'Pentagon' },
  { kind: 'hexagon', label: 'Hexagon'   }, { kind: 'heart',    label: 'Heart'    },
  { kind: 'arrow',   label: 'Arrow'     }, { kind: 'line',     label: 'Line'     },
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

// ── Main ──────────────────────────────────────────────────────────────────────
export default function FlagEditorClient({ slug }: { slug: string }) {
  const isBlank = slug === 'blank';
  const countryName = isBlank
    ? 'Blank Canvas'
    : (countryCodeToName[slug.toUpperCase()] ?? slug.toUpperCase());

  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const [elements, setElements] = useState<CE[]>([]);
  const elementsRef = useRef<CE[]>([]);
  useEffect(() => { elementsRef.current = elements; }, [elements]);

  const history  = useRef<CE[][]>([[]]);
  const histIdx  = useRef(0);

  const push = useCallback((els: CE[]) => {
    history.current = history.current.slice(0, histIdx.current + 1);
    history.current.push(els);
    histIdx.current = history.current.length - 1;
    setElements(els);
  }, []);

  const undo = useCallback(() => {
    if (histIdx.current > 0) { histIdx.current--; setElements(history.current[histIdx.current]); }
  }, []);
  const redo = useCallback(() => {
    if (histIdx.current < history.current.length - 1) { histIdx.current++; setElements(history.current[histIdx.current]); }
  }, []);

  const [selId, setSelId] = useState<string | null>(null);
  const selEl = elements.find(e => e.id === selId) ?? null;

  const [bgColor, setBgColor] = useState('#ffffff');
  const [flagBg, setFlagBg]   = useState<HTMLImageElement | null>(null);

  const [panel, setPanel]         = useState<Panel>('shapes');
  const [flagSearch, setFlagSearch] = useState('');

  const interRef = useRef<Inter | null>(null);

  const [defFill,     setDefFill]     = useState('#3b82f6');
  const [defStroke,   setDefStroke]   = useState('#1e40af');
  const [defSw,       setDefSw]       = useState(2);
  const [defText,     setDefText]     = useState('Text');
  const [defFontSize, setDefFontSize] = useState(60);
  const [defFont,     setDefFont]     = useState('Arial');
  const [defBold,     setDefBold]     = useState(false);
  const [defItalic,   setDefItalic]   = useState(false);

  // ── ResizeObserver ──────────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current; if (!el) return;
    const obs = new ResizeObserver(() => {
      const { width, height } = el.getBoundingClientRect();
      setScale(Math.min(width / CW, height / CH) * 0.92);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // ── Draw ────────────────────────────────────────────────────────────────────
  useLayoutEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctx.clearRect(0, 0, CW, CH);
    if (flagBg) { ctx.drawImage(flagBg, 0, 0, CW, CH); }
    else { ctx.fillStyle = bgColor; ctx.fillRect(0, 0, CW, CH); }
    for (const el of elements) renderElement(ctx, el);
  }, [elements, bgColor, flagBg]);

  // ── Keyboard ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && selId) {
        push(elementsRef.current.filter(x => x.id !== selId));
        setSelId(null);
      }
      if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); }
      if (e.ctrlKey && e.key === 'y') { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selId, undo, redo, push]);

  // ── Add helpers ─────────────────────────────────────────────────────────────
  const addShape = useCallback((kind: EKind) => {
    const el: CE = {
      id: uid(), kind,
      x: CW / 2, y: CH / 2,
      w: kind === 'line' ? 200 : 120, h: kind === 'line' ? 4 : 120,
      rot: 0, fill: defFill, stroke: defStroke, sw: defSw, opacity: 1,
    };
    push([...elementsRef.current, el]);
    setSelId(el.id); setPanel(null);
  }, [defFill, defStroke, defSw, push]);

  const addText = useCallback(() => {
    const el: CE = {
      id: uid(), kind: 'text',
      x: CW / 2, y: CH / 2,
      w: defFontSize * (defText.length || 4) * 0.6,
      h: defFontSize * 1.2,
      rot: 0, fill: defFill, stroke: 'transparent', sw: 0, opacity: 1,
      text: defText, fontSize: defFontSize, fontFamily: defFont, bold: defBold, italic: defItalic,
    };
    push([...elementsRef.current, el]);
    setSelId(el.id); setPanel(null);
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

  // ── Pointer (canvas) ────────────────────────────────────────────────────────
  const toLogical = useCallback((e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: (e.clientX - rect.left) / scale, y: (e.clientY - rect.top) / scale };
  }, [scale]);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const { x, y } = toLogical(e);
    const hit = [...elementsRef.current].reverse().find(el => hitTest(el, x, y));
    if (hit) {
      setSelId(hit.id);
      interRef.current = { kind: 'move', startX: x, startY: y, orig: { ...hit } };
    } else {
      setSelId(null); interRef.current = null;
    }
  }, [toLogical]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const inter = interRef.current; if (!inter) return;
    const { x, y } = toLogical(e);
    const dx = x - inter.startX, dy = y - inter.startY;
    if (inter.kind === 'move') {
      setElements(prev => prev.map(el =>
        el.id === inter.orig.id ? { ...el, x: inter.orig.x + dx, y: inter.orig.y + dy } : el
      ));
    }
  }, [toLogical]);

  const onPointerUp = useCallback(() => {
    if (interRef.current) push(elementsRef.current);
    interRef.current = null;
  }, [push]);

  // ── Pointer (handles) ───────────────────────────────────────────────────────
  const onHandlePointerDown = useCallback((
    e: React.PointerEvent<SVGCircleElement | SVGRectElement>,
    type: 'resize' | 'rotate', handleId?: HandleId,
  ) => {
    e.stopPropagation();
    if (!selEl) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = canvasRef.current!.getBoundingClientRect();
    const px = (e.clientX - rect.left) / scale, py = (e.clientY - rect.top) / scale;
    interRef.current = {
      kind: type, startX: px, startY: py, orig: { ...selEl }, handle: handleId,
      startAngle: type === 'rotate' ? deg(Math.atan2(py - selEl.y, px - selEl.x)) - selEl.rot : undefined,
    };
  }, [selEl, scale]);

  const onOverlayMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    const inter = interRef.current;
    if (!inter || inter.kind === 'move') return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const px = (e.clientX - rect.left) / scale, py = (e.clientY - rect.top) / scale;

    if (inter.kind === 'rotate') {
      const angle = deg(Math.atan2(py - inter.orig.y, px - inter.orig.x));
      setElements(prev => prev.map(el =>
        el.id === inter.orig.id ? { ...el, rot: angle - (inter.startAngle ?? 0) } : el
      ));
      return;
    }

    if (inter.kind === 'resize' && inter.handle) {
      const orig = inter.orig;
      const cosR = Math.cos(rad(orig.rot)), sinR = Math.sin(rad(orig.rot));
      const dx = px - inter.startX, dy = py - inter.startY;
      const ldx = dx * cosR + dy * sinR, ldy = -dx * sinR + dy * cosR;
      const h = inter.handle;
      let newW = orig.w, newH = orig.h, lcx = 0, lcy = 0;
      if (h.includes('e')) { newW = Math.max(20, orig.w + ldx); lcx = (newW - orig.w) / 2; }
      if (h.includes('w')) { newW = Math.max(20, orig.w - ldx); lcx = -(newW - orig.w) / 2; }
      if (h.includes('s')) { newH = Math.max(20, orig.h + ldy); lcy = (newH - orig.h) / 2; }
      if (h.includes('n')) { newH = Math.max(20, orig.h - ldy); lcy = -(newH - orig.h) / 2; }
      const gcx = lcx * cosR - lcy * sinR, gcy = lcx * sinR + lcy * cosR;
      setElements(prev => prev.map(el =>
        el.id === orig.id ? { ...el, w: newW, h: newH, x: orig.x + gcx, y: orig.y + gcy } : el
      ));
    }
  }, [scale]);

  const onOverlayUp = useCallback(() => {
    if (interRef.current && interRef.current.kind !== 'move') push(elementsRef.current);
    if (interRef.current?.kind !== 'move') interRef.current = null;
  }, [push]);

  // ── Update selected ─────────────────────────────────────────────────────────
  const updateSel = useCallback((patch: Partial<CE>) => {
    if (!selId) return;
    push(elementsRef.current.map(el => el.id === selId ? { ...el, ...patch } : el));
  }, [selId, push]);

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
  const exportCanvas = useCallback((hd = false) => {
    const sc = hd ? 4 : 1;
    const off = document.createElement('canvas');
    off.width = CW * sc; off.height = CH * sc;
    const ctx = off.getContext('2d')!;
    ctx.scale(sc, sc);
    if (flagBg) ctx.drawImage(flagBg, 0, 0, CW, CH);
    else { ctx.fillStyle = bgColor; ctx.fillRect(0, 0, CW, CH); }
    for (const el of elementsRef.current) renderElement(ctx, el);
    if (!hd) {
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
      ctx.fillText('flagswing.com', CW - 12, CH - 12);
    }
    const a = document.createElement('a');
    a.href = off.toDataURL('image/png');
    a.download = hd ? 'flag-hd.png' : 'flag-preview.png';
    a.click();
  }, [bgColor, flagBg]);

  // ── Filtered flags ──────────────────────────────────────────────────────────
  const filteredFlags = flagSearch.trim()
    ? ALL_COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(flagSearch.toLowerCase()) ||
        c.code.includes(flagSearch.toLowerCase())
      )
    : ALL_COUNTRIES;

  const canvasW = CW * scale;
  const canvasH = CH * scale;

  // ── Shared input style ──────────────────────────────────────────────────────
  const inputCls = `w-full rounded-lg border px-2 py-1.5 text-xs outline-none focus:border-[${ACCENT}] focus:ring-1 focus:ring-[${ACCENT}]/20`;
  const inputStyle = { background: T.inputBg, borderColor: T.border, color: T.text };

  // ── Rail button ─────────────────────────────────────────────────────────────
  function RailBtn({ id, icon, label }: { id: Panel; icon: React.ReactNode; label: string }) {
    const active = panel === id;
    return (
      <button
        onClick={() => setPanel(p => p === id ? null : id)}
        title={label ?? ''}
        className="flex flex-col items-center gap-1 rounded-xl py-2 px-1 w-full text-center transition-colors"
        style={{
          color:      active ? '#fff'     : T.textSub,
          background: active ? ACCENT     : 'transparent',
        }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.background = T.hover; }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
      >
        {icon}
        <span className="text-[9px] font-medium leading-none">{label}</span>
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: T.bg, fontFamily: 'system-ui, sans-serif', color: T.text }}
    >
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div
        className="flex h-12 items-center gap-3 px-4 shrink-0"
        style={{ background: T.topbar, boxShadow: T.shadow }}
      >
        <Link
          href="/editor"
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors"
          style={{ color: T.textSub }}
          onMouseEnter={e => (e.currentTarget.style.background = T.hover)}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <ArrowLeft size={14} /> Back
        </Link>

        <div className="h-5 w-px" style={{ background: T.border }} />
        <span className="text-sm font-semibold" style={{ color: T.text }}>
          {countryName} — Flag Editor
        </span>

        <div className="ml-auto flex items-center gap-2">
          <button onClick={undo} title="Undo (Ctrl+Z)"
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
            style={{ color: T.textSub }}
            onMouseEnter={e => (e.currentTarget.style.background = T.hover)}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <Undo2 size={15} />
          </button>
          <button onClick={redo} title="Redo (Ctrl+Y)"
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
            style={{ color: T.textSub }}
            onMouseEnter={e => (e.currentTarget.style.background = T.hover)}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <Redo2 size={15} />
          </button>

          <div className="h-5 w-px mx-1" style={{ background: T.border }} />

          <label className="flex items-center gap-1.5 text-xs" style={{ color: T.textSub }}>
            BG
            <input type="color" value={flagBg ? '#cccccc' : bgColor}
              disabled={!!flagBg}
              onChange={e => { setFlagBg(null); setBgColor(e.target.value); }}
              className="h-6 w-8 cursor-pointer rounded border-0 p-0"
            />
          </label>
          {flagBg && (
            <button onClick={() => setFlagBg(null)}
              className="rounded-lg px-2 py-1 text-xs transition-colors"
              style={{ color: T.textSub }}
              onMouseEnter={e => (e.currentTarget.style.background = T.hover)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              Clear flag
            </button>
          )}

          <div className="h-5 w-px mx-1" style={{ background: T.border }} />

          <button onClick={() => exportCanvas(false)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors"
            style={{ borderColor: T.border, color: T.textSub, background: 'transparent' }}
            onMouseEnter={e => (e.currentTarget.style.background = T.hover)}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <Eye size={13} /> Preview
          </button>

          <button onClick={() => exportCanvas(true)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-opacity"
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
        <div
          className="flex flex-col items-center gap-1 py-3 px-1.5 shrink-0"
          style={{ width: 56, background: T.rail, borderRight: `1px solid ${T.border}` }}
        >
          <RailBtn id="flags"  icon={<Flag size={18} />}     label="Flags"  />
          <RailBtn id="shapes" icon={<Gamepad2 size={18} />} label="Shapes" />
          <RailBtn id="text"   icon={<Type size={18} />}     label="Text"   />
          <RailBtn id="colors" icon={<Palette size={18} />}  label="Colors" />
          <RailBtn id="layers" icon={<Layers size={18} />}   label="Layers" />
        </div>

        {/* ── Side panel ──────────────────────────────────────────────────── */}
        {panel && (
          <div
            className="flex flex-col shrink-0 overflow-y-auto"
            style={{ width: 248, background: T.panel, borderRight: `1px solid ${T.border}` }}
          >
            {/* Flags */}
            {panel === 'flags' && (
              <div className="flex flex-col gap-3 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: T.textMuted }}>
                  Flag Background
                </p>
                <input type="search" placeholder="Search flags…" value={flagSearch}
                  onChange={e => setFlagSearch(e.target.value)}
                  className={inputCls} style={inputStyle} />
                <div className="grid grid-cols-3 gap-1.5">
                  {filteredFlags.slice(0, 60).map(c => (
                    <button key={c.code} onClick={() => loadFlag(c.upper)} title={c.name}
                      className="overflow-hidden rounded-lg transition"
                      style={{ aspectRatio: '3/2', border: '2px solid transparent', outline: 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = ACCENT)}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}>
                      <img src={`/flags/${c.upper}.svg`} alt={c.name}
                        className="h-full w-full object-cover" loading="lazy"
                        onError={ev => { (ev.target as HTMLImageElement).src = `https://flagcdn.com/w80/${c.code}.png`; }} />
                    </button>
                  ))}
                </div>
                {filteredFlags.length > 60 && (
                  <p className="text-center text-xs" style={{ color: T.textMuted }}>
                    Showing 60 of {filteredFlags.length} — refine search
                  </p>
                )}
              </div>
            )}

            {/* Shapes */}
            {panel === 'shapes' && (
              <div className="flex flex-col gap-3 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: T.textMuted }}>Shapes</p>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium" style={{ color: T.textSub }}>Fill color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={defFill} onChange={e => setDefFill(e.target.value)}
                      className="h-7 w-10 cursor-pointer rounded border-0 p-0" />
                    <div className="flex flex-wrap gap-1">
                      {PALETTE.slice(0, 6).map(c => (
                        <button key={c} onClick={() => setDefFill(c)}
                          className="h-5 w-5 rounded-md transition"
                          style={{ background: c, border: defFill === c ? `2px solid ${ACCENT}` : `1px solid ${T.border}` }} />
                      ))}
                    </div>
                  </div>
                  <label className="text-xs font-medium" style={{ color: T.textSub }}>Stroke</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={defStroke} onChange={e => setDefStroke(e.target.value)}
                      className="h-7 w-10 cursor-pointer rounded border-0 p-0" />
                    <input type="range" min={0} max={20} value={defSw}
                      onChange={e => setDefSw(Number(e.target.value))} className="flex-1" />
                    <span className="w-5 text-xs" style={{ color: T.textSub }}>{defSw}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {SHAPE_CATALOG.map(s => (
                    <button key={s.kind} onClick={() => addShape(s.kind)}
                      className="rounded-xl py-3 text-xs font-medium transition-colors"
                      style={{ background: T.inputBg, color: T.text, border: `1px solid ${T.border}` }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.text; }}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Text */}
            {panel === 'text' && (
              <div className="flex flex-col gap-3 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: T.textMuted }}>Add Text</p>
                <input type="text" value={defText} onChange={e => setDefText(e.target.value)}
                  placeholder="Your text…" className={inputCls} style={inputStyle} />
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium" style={{ color: T.textSub }}>Font</label>
                  <select value={defFont} onChange={e => setDefFont(e.target.value)}
                    className={inputCls} style={inputStyle}>
                    {FONTS.map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium" style={{ color: T.textSub }}>Size: {defFontSize}px</label>
                  <input type="range" min={12} max={200} value={defFontSize}
                    onChange={e => setDefFontSize(Number(e.target.value))} />
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setDefBold(b => !b)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border"
                    style={{ background: defBold ? ACCENT : T.inputBg, color: defBold ? '#fff' : T.textSub, borderColor: T.border }}>
                    <Bold size={14} />
                  </button>
                  <button onClick={() => setDefItalic(b => !b)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border"
                    style={{ background: defItalic ? ACCENT : T.inputBg, color: defItalic ? '#fff' : T.textSub, borderColor: T.border }}>
                    <Italic size={14} />
                  </button>
                  <div className="flex items-center gap-1.5 flex-1">
                    <input type="color" value={defFill} onChange={e => setDefFill(e.target.value)}
                      className="h-7 w-10 cursor-pointer rounded border-0" />
                    <span className="text-xs" style={{ color: T.textSub }}>Color</span>
                  </div>
                </div>
                <button onClick={addText}
                  className="w-full rounded-xl py-2.5 text-sm font-semibold transition-opacity"
                  style={{ background: ACCENT, color: '#fff' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                  Add Text
                </button>
              </div>
            )}

            {/* Colors */}
            {panel === 'colors' && (
              <div className="flex flex-col gap-3 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: T.textMuted }}>Color Palette</p>
                <div className="grid grid-cols-4 gap-2">
                  {PALETTE.map(c => (
                    <button key={c} onClick={() => { setDefFill(c); if (selEl) updateSel({ fill: c }); }}
                      className="h-10 w-full rounded-xl transition"
                      style={{ background: c, border: defFill === c ? `2px solid ${ACCENT}` : `2px solid ${T.border}` }} />
                  ))}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium" style={{ color: T.textSub }}>Custom color</label>
                  <input type="color" value={defFill}
                    onChange={e => { setDefFill(e.target.value); if (selEl) updateSel({ fill: e.target.value }); }}
                    className="h-10 w-full cursor-pointer rounded-xl border-0 p-0" />
                </div>
              </div>
            )}

            {/* Layers */}
            {panel === 'layers' && (
              <div className="flex flex-col gap-2 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: T.textMuted }}>
                  Layers ({elements.length})
                </p>
                {[...elements].reverse().map((el, i) => (
                  <button key={el.id} onClick={() => setSelId(el.id)}
                    className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs w-full transition-colors"
                    style={{
                      background: selId === el.id ? T.selBg : 'transparent',
                      color: T.text,
                      border: selId === el.id ? `1px solid ${ACCENT}` : `1px solid transparent`,
                    }}>
                    <span className="text-[10px] w-4 text-center" style={{ color: T.textMuted }}>
                      {elements.length - i}
                    </span>
                    <span className="flex-1 truncate capitalize">
                      {el.kind === 'text' ? `"${el.text?.slice(0, 12) ?? ''}"` : el.kind}
                    </span>
                    <span className="h-3 w-3 rounded" style={{ background: el.fill, border: `1px solid ${T.border}` }} />
                  </button>
                ))}
                {elements.length === 0 && (
                  <p className="text-xs text-center py-6" style={{ color: T.textMuted }}>No elements yet</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Canvas area ──────────────────────────────────────────────────── */}
        <div ref={containerRef}
          className="relative flex flex-1 items-center justify-center"
          style={{ background: T.bg }}
        >
          <div className="relative" style={{ width: canvasW, height: canvasH }}>
            <canvas
              ref={canvasRef}
              width={CW} height={CH}
              style={{
                display: 'block', width: canvasW, height: canvasH,
                cursor: selEl ? 'move' : 'default',
                borderRadius: 4,
                boxShadow: '0 4px 24px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)',
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            />

            {/* SVG transform overlay */}
            {selEl && (
              <svg
                style={{ position: 'absolute', inset: 0, width: canvasW, height: canvasH, overflow: 'visible', pointerEvents: 'none' }}
                onPointerMove={onOverlayMove}
                onPointerUp={onOverlayUp}
              >
                {/* Bounding box */}
                {(() => {
                  const el = selEl;
                  const cos = Math.cos(rad(el.rot)), sin = Math.sin(rad(el.rot));
                  const corners = [
                    { lx: -el.w/2, ly: -el.h/2 }, { lx: el.w/2, ly: -el.h/2 },
                    { lx: el.w/2,  ly: el.h/2  }, { lx: -el.w/2, ly: el.h/2 },
                  ].map(({ lx, ly }) => ({
                    x: (el.x + lx * cos - ly * sin) * scale,
                    y: (el.y + lx * sin + ly * cos) * scale,
                  }));
                  return <polygon points={corners.map(c => `${c.x},${c.y}`).join(' ')}
                    fill="none" stroke={ACCENT} strokeWidth={1.5} strokeDasharray="5 3" />;
                })()}

                {/* Rotate connector line */}
                {(() => {
                  const rp = getRotHandlePos(selEl, scale);
                  const tp = getHandlePos(selEl, HANDLES[1], scale);
                  return <line x1={tp.x} y1={tp.y} x2={rp.x} y2={rp.y} stroke={ACCENT} strokeWidth={1.5} />;
                })()}

                {/* Rotate circle */}
                {(() => {
                  const rp = getRotHandlePos(selEl, scale);
                  return (
                    <circle cx={rp.x} cy={rp.y} r={7} fill="#fff" stroke={ACCENT} strokeWidth={2}
                      style={{ cursor: 'grab', pointerEvents: 'all' }}
                      onPointerDown={e => onHandlePointerDown(e as unknown as React.PointerEvent<SVGCircleElement>, 'rotate')} />
                  );
                })()}

                {/* Resize handles */}
                {HANDLES.map(h => {
                  const pos = getHandlePos(selEl, h, scale);
                  const cursors: Record<HandleId, string> = {
                    nw: 'nw-resize', n: 'n-resize', ne: 'ne-resize',
                    w: 'w-resize',                   e: 'e-resize',
                    sw: 'sw-resize', s: 's-resize', se: 'se-resize',
                  };
                  return (
                    <rect key={h.id} x={pos.x - 5} y={pos.y - 5} width={10} height={10}
                      fill="#fff" stroke={ACCENT} strokeWidth={2} rx={2}
                      style={{ cursor: cursors[h.id], pointerEvents: 'all' }}
                      onPointerDown={e => onHandlePointerDown(e as unknown as React.PointerEvent<SVGRectElement>, 'resize', h.id)} />
                  );
                })}
              </svg>
            )}
          </div>
        </div>

        {/* ── Right properties panel ──────────────────────────────────────── */}
        {selEl && (
          <div className="flex shrink-0 flex-col overflow-y-auto"
            style={{ width: 224, background: T.panel, borderLeft: `1px solid ${T.border}` }}>
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: T.border }}>
              <span className="text-xs font-semibold capitalize" style={{ color: T.text }}>{selEl.kind}</span>
              <button onClick={deleteSelected}
                className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                style={{ color: '#ef4444' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <Trash2 size={13} />
              </button>
            </div>

            {/* Transform */}
            <section className="px-3 py-3 border-b" style={{ borderColor: T.border }}>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: T.textMuted }}>Transform</p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { label: 'X', val: Math.round(selEl.x), key: 'x' },
                  { label: 'Y', val: Math.round(selEl.y), key: 'y' },
                  { label: 'W', val: Math.round(selEl.w), key: 'w' },
                  { label: 'H', val: Math.round(selEl.h), key: 'h' },
                ] as { label: string; val: number; key: keyof CE }[]).map(f => (
                  <label key={f.key} className="flex flex-col gap-1">
                    <span className="text-[10px]" style={{ color: T.textMuted }}>{f.label}</span>
                    <input type="number" value={f.val}
                      onChange={e => updateSel({ [f.key]: Number(e.target.value) } as Partial<CE>)}
                      className="w-full rounded-lg border px-2 py-1.5 text-xs outline-none"
                      style={inputStyle} />
                  </label>
                ))}
              </div>
              <label className="mt-2 flex flex-col gap-1">
                <span className="text-[10px]" style={{ color: T.textMuted }}>Rotation: {Math.round(selEl.rot)}°</span>
                <input type="range" min={-180} max={180} value={selEl.rot}
                  onChange={e => updateSel({ rot: Number(e.target.value) })} />
              </label>
              <label className="mt-2 flex flex-col gap-1">
                <span className="text-[10px]" style={{ color: T.textMuted }}>Opacity: {Math.round(selEl.opacity * 100)}%</span>
                <input type="range" min={0} max={1} step={0.01} value={selEl.opacity}
                  onChange={e => updateSel({ opacity: Number(e.target.value) })} />
              </label>
            </section>

            {/* Appearance */}
            <section className="px-3 py-3 border-b" style={{ borderColor: T.border }}>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: T.textMuted }}>Appearance</p>
              <label className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium" style={{ color: T.textSub }}>Fill</span>
                <input type="color" value={selEl.fill} onChange={e => updateSel({ fill: e.target.value })}
                  className="h-7 w-12 cursor-pointer rounded border-0 p-0" />
              </label>
              {selEl.kind !== 'text' && (
                <>
                  <label className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium" style={{ color: T.textSub }}>Stroke</span>
                    <input type="color" value={selEl.stroke} onChange={e => updateSel({ stroke: e.target.value })}
                      className="h-7 w-12 cursor-pointer rounded border-0 p-0" />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px]" style={{ color: T.textMuted }}>Stroke width: {selEl.sw}px</span>
                    <input type="range" min={0} max={30} value={selEl.sw}
                      onChange={e => updateSel({ sw: Number(e.target.value) })} />
                  </label>
                </>
              )}
            </section>

            {/* Text props */}
            {selEl.kind === 'text' && (
              <section className="px-3 py-3 border-b" style={{ borderColor: T.border }}>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: T.textMuted }}>Text</p>
                <input type="text" value={selEl.text ?? ''} onChange={e => updateSel({ text: e.target.value })}
                  className="mb-2 w-full rounded-lg border px-2 py-1.5 text-xs outline-none" style={inputStyle} />
                <select value={selEl.fontFamily ?? 'Arial'} onChange={e => updateSel({ fontFamily: e.target.value })}
                  className="mb-2 w-full rounded-lg border px-2 py-1.5 text-xs outline-none" style={inputStyle}>
                  {FONTS.map(f => <option key={f}>{f}</option>)}
                </select>
                <label className="flex flex-col gap-1 mb-2">
                  <span className="text-[10px]" style={{ color: T.textMuted }}>Size: {selEl.fontSize ?? 40}px</span>
                  <input type="range" min={8} max={300} value={selEl.fontSize ?? 40}
                    onChange={e => updateSel({ fontSize: Number(e.target.value) })} />
                </label>
                <div className="flex gap-2">
                  <button onClick={() => updateSel({ bold: !selEl.bold })}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border"
                    style={{ background: selEl.bold ? ACCENT : T.inputBg, color: selEl.bold ? '#fff' : T.textSub, borderColor: T.border }}>
                    <Bold size={13} />
                  </button>
                  <button onClick={() => updateSel({ italic: !selEl.italic })}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border"
                    style={{ background: selEl.italic ? ACCENT : T.inputBg, color: selEl.italic ? '#fff' : T.textSub, borderColor: T.border }}>
                    <Italic size={13} />
                  </button>
                </div>
              </section>
            )}

            {/* Layer */}
            <section className="px-3 py-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: T.textMuted }}>Layer</p>
              <div className="flex gap-2">
                <button onClick={bringForward}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-xs font-medium border transition-colors"
                  style={{ background: T.inputBg, color: T.text, borderColor: T.border }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = ACCENT)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}>
                  <ChevronUp size={13} /> Forward
                </button>
                <button onClick={sendBackward}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-xs font-medium border transition-colors"
                  style={{ background: T.inputBg, color: T.text, borderColor: T.border }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = ACCENT)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}>
                  <ChevronDown size={13} /> Back
                </button>
              </div>
            </section>
          </div>
        )}
      </div>

      {/* ── Status bar ──────────────────────────────────────────────────────── */}
      <div className="flex h-7 items-center gap-4 px-4 shrink-0 border-t text-[10px]"
        style={{ background: T.statusBar, borderColor: T.border, color: T.textMuted }}>
        <span>{elements.length} element{elements.length !== 1 ? 's' : ''}</span>
        {selEl && (
          <>
            <span style={{ color: T.border }}>|</span>
            <span style={{ color: ACCENT }}>Selected: {selEl.kind}</span>
          </>
        )}
        <span style={{ color: T.border }}>|</span>
        <span>{CW} × {CH}px</span>
        <span style={{ color: T.border }}>|</span>
        <span>{Math.round(scale * 100)}% zoom</span>
      </div>
    </div>
  );
}
