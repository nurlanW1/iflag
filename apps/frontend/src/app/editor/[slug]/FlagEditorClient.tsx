'use client';

import { useRef, useState, useCallback, useEffect, useLayoutEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Undo2, Redo2, Download, X, Copy,
  Type, Bold, Italic, Trash2, ChevronUp, ChevronDown,
  Layers, Palette, Gamepad2, FileText, Upload,
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
  | 'pentagon' | 'hexagon' | 'polygon' | 'heart' | 'arrow' | 'line' | 'text' | 'image' | 'moon';

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
  src?: string;  // data URL for imported images
  points?: number;   // star spikes count (3-20)
  sides?: number;    // polygon sides count (3-20)
  crescent?: number; // moon thinness (0=fat, 100=thin hilal)
}

type Panel = 'shapes' | 'import' | 'text' | 'colors' | 'layers';

// ── Helpers ───────────────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2, 10); }
function rad(d: number) { return d * Math.PI / 180; }
function deg(r: number) { return r * 180 / Math.PI; }

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, spikes = 5) {
  const inner = r * 0.42;
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

function drawMoon(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, crescent = 50) {
  const t = crescent / 100;
  const innerR = r * (0.45 + t * 0.50); // 0.45 (fat) → 0.95 (thin hilal)
  const offset = r * (0.55 - t * 0.50); // 0.55 (fat) → 0.05 (thin hilal)
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2, false);
  ctx.arc(cx + offset, cy, innerR, 0, Math.PI * 2, true);
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

function renderElement(
  ctx: CanvasRenderingContext2D,
  el: CE,
  imgCache?: Map<string, HTMLImageElement>,
) {
  ctx.save();
  ctx.globalAlpha = el.opacity;
  ctx.translate(el.x, el.y);
  ctx.rotate(rad(el.rot));
  ctx.fillStyle = el.fill;
  ctx.strokeStyle = el.stroke;
  ctx.lineWidth = el.sw;
  const hw = el.w / 2, hh = el.h / 2, r = Math.min(hw, hh);

  switch (el.kind) {
    case 'image': {
      const img = imgCache?.get(el.id);
      if (img) ctx.drawImage(img, -hw, -hh, el.w, el.h);
      ctx.restore();
      return;
    }
    case 'rect':     ctx.beginPath(); ctx.rect(-hw, -hh, el.w, el.h); break;
    case 'circle':   ctx.beginPath(); ctx.ellipse(0, 0, hw, hh, 0, 0, Math.PI * 2); break;
    case 'triangle': ctx.beginPath(); ctx.moveTo(0, -hh); ctx.lineTo(hw, hh); ctx.lineTo(-hw, hh); ctx.closePath(); break;
    case 'star':     drawStar(ctx, 0, 0, r, el.points ?? 5); break;
    case 'diamond':  ctx.beginPath(); ctx.moveTo(0, -hh); ctx.lineTo(hw, 0); ctx.lineTo(0, hh); ctx.lineTo(-hw, 0); ctx.closePath(); break;
    case 'pentagon': drawNgon(ctx, 0, 0, r, 5); break;
    case 'hexagon':  drawNgon(ctx, 0, 0, r, 6); break;
    case 'polygon':  drawNgon(ctx, 0, 0, r, el.sides ?? 6); break;
    case 'heart':    drawHeart(ctx, 0, 0, r); break;
    case 'arrow':    drawArrow(ctx, 0, 0, el.w, el.h); break;
    case 'moon':
      drawMoon(ctx, 0, 0, r, el.crescent ?? 50);
      ctx.fill('evenodd');
      if (el.sw > 0) ctx.stroke();
      ctx.restore();
      return;
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

function ShapeIcon({ kind, color, size = 32 }: { kind: EKind; color: string; size?: number }) {
  const v = `0 0 ${size} ${size}`;
  const c = size / 2;
  const r = size * 0.42;
  const stroke = 'none';
  const props = { fill: color, stroke };

  if (kind === 'rect') return (
    <svg viewBox={v} width={size} height={size}><rect x={size*0.12} y={size*0.22} width={size*0.76} height={size*0.56} rx={2} {...props} /></svg>
  );
  if (kind === 'circle') return (
    <svg viewBox={v} width={size} height={size}><ellipse cx={c} cy={c} rx={r} ry={r} {...props} /></svg>
  );
  if (kind === 'triangle') return (
    <svg viewBox={v} width={size} height={size}><polygon points={`${c},${size*0.1} ${size*0.9},${size*0.88} ${size*0.1},${size*0.88}`} {...props} /></svg>
  );
  if (kind === 'star') {
    const spikes = 5, outerR = r, innerR = r * 0.42;
    const pts = Array.from({ length: spikes * 2 }, (_, i) => {
      const a = (Math.PI / spikes) * i - Math.PI / 2;
      const rr = i % 2 === 0 ? outerR : innerR;
      return `${c + Math.cos(a) * rr},${c + Math.sin(a) * rr}`;
    }).join(' ');
    return <svg viewBox={v} width={size} height={size}><polygon points={pts} {...props} /></svg>;
  }
  if (kind === 'diamond') return (
    <svg viewBox={v} width={size} height={size}><polygon points={`${c},${size*0.08} ${size*0.9},${c} ${c},${size*0.92} ${size*0.1},${c}`} {...props} /></svg>
  );
  if (kind === 'polygon') {
    const n = 6;
    const pts = Array.from({ length: n }, (_, i) => {
      const a = (2 * Math.PI / n) * i - Math.PI / 2;
      return `${c + r * Math.cos(a)},${c + r * Math.sin(a)}`;
    }).join(' ');
    return <svg viewBox={v} width={size} height={size}><polygon points={pts} {...props} /></svg>;
  }
  if (kind === 'heart') {
    const s = r * 0.9;
    return (
      <svg viewBox={v} width={size} height={size}>
        <path d={`M${c} ${c+s*0.9} C${c-s*1.4} ${c+s*0.3} ${c-s*1.4} ${c-s*0.6} ${c} ${c-s*0.1} C${c+s*1.4} ${c-s*0.6} ${c+s*1.4} ${c+s*0.3} ${c} ${c+s*0.9}Z`} {...props} />
      </svg>
    );
  }
  if (kind === 'moon') {
    return (
      <svg viewBox={v} width={size} height={size}>
        <path fillRule="evenodd" fill={color} stroke={stroke}
          d={`M${c} ${c-r} A${r} ${r} 0 1 1 ${c} ${c+r} A${r} ${r} 0 1 1 ${c} ${c-r}Z M${c+r*0.32} ${c-r*0.72} A${r*0.72} ${r*0.72} 0 1 0 ${c+r*0.32} ${c+r*0.72} A${r*0.72} ${r*0.72} 0 1 0 ${c+r*0.32} ${c-r*0.72}Z`} />
      </svg>
    );
  }
  if (kind === 'arrow') {
    const hw = size*0.44, hh = size*0.5, headW = hh*0.55, bodyH = hh*0.45;
    const x0 = c - hw;
    return (
      <svg viewBox={v} width={size} height={size}>
        <polygon points={[
          `${x0},${c-bodyH/2}`,`${c+hw-headW},${c-bodyH/2}`,`${c+hw-headW},${c-hh}`,
          `${c+hw},${c}`,`${c+hw-headW},${c+hh}`,`${c+hw-headW},${c+bodyH/2}`,`${x0},${c+bodyH/2}`,
        ].join(' ')} {...props} />
      </svg>
    );
  }
  if (kind === 'line') return (
    <svg viewBox={v} width={size} height={size}><rect x={size*0.06} y={c-2} width={size*0.88} height={4} rx={2} fill={color} /></svg>
  );
  return null;
}

const SHAPE_CATALOG: { kind: EKind; label: string }[] = [
  { kind: 'rect',    label: 'Rectangle' }, { kind: 'circle',  label: 'Circle'  },
  { kind: 'triangle',label: 'Triangle'  }, { kind: 'star',    label: 'Star'    },
  { kind: 'diamond', label: 'Diamond'   }, { kind: 'polygon', label: 'Polygon' },
  { kind: 'heart',   label: 'Heart'     }, { kind: 'moon',    label: 'Moon'    },
  { kind: 'arrow',   label: 'Arrow'     }, { kind: 'line',    label: 'Line'    },
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
  const [exportOpen, setExportOpen] = useState(false);
  const [navH, setNavH] = useState(64);
  const [dragOver, setDragOver] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const imgCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const [flagSearch, setFlagSearch] = useState('');

  const interRef = useRef<Inter | null>(null);

  const [defFill,     setDefFill]     = useState('#3b82f6');
  const [defStroke,   setDefStroke]   = useState('#1e40af');
  const [defSw,       setDefSw]       = useState(2);
  const [defPoints,    setDefPoints]    = useState(5);
  const [defSides,     setDefSides]     = useState(6);
  const [defCrescent,  setDefCrescent]  = useState(50);
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
    for (const el of elements) renderElement(ctx, el, imgCacheRef.current);
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
      if (e.ctrlKey && e.key === 'd') { e.preventDefault(); dupRef.current?.(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selId, undo, redo, push]);

  // Measure navbar height so editor starts below it
  useEffect(() => {
    const nav = document.querySelector('nav[aria-label="Primary"]');
    if (!nav) return;
    const obs = new ResizeObserver(() => setNavH(nav.getBoundingClientRect().height));
    obs.observe(nav);
    setNavH(nav.getBoundingClientRect().height);
    return () => obs.disconnect();
  }, []);

  // ── Add helpers ─────────────────────────────────────────────────────────────
  const addShape = useCallback((kind: EKind) => {
    const el: CE = {
      id: uid(), kind,
      x: CW / 2, y: CH / 2,
      w: kind === 'line' ? 200 : 120, h: kind === 'line' ? 4 : 120,
      rot: 0, fill: defFill, stroke: defStroke, sw: defSw, opacity: 1,
      points:   kind === 'star'    ? defPoints   : undefined,
      sides:    kind === 'polygon' ? defSides    : undefined,
      crescent: kind === 'moon'    ? defCrescent : undefined,
    };
    push([...elementsRef.current, el]);
    setSelId(el.id);
  }, [defFill, defStroke, defSw, defPoints, defSides, defCrescent, push]);

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
    setSelId(el.id);
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

  const importFiles = useCallback((files: FileList | File[]) => {
    const allowed = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
    Array.from(files).forEach(file => {
      if (!allowed.includes(file.type)) return;
      const reader = new FileReader();
      reader.onload = ev => {
        const src = ev.target?.result as string;
        const img = new window.Image();
        img.onload = () => {
          const maxW = CW * 0.6;
          const aspect = img.naturalWidth / img.naturalHeight;
          const w = Math.min(maxW, img.naturalWidth);
          const h = w / aspect;
          const id = uid();
          imgCacheRef.current.set(id, img);
          const el: CE = {
            id, kind: 'image',
            x: CW / 2, y: CH / 2,
            w, h, rot: 0,
            fill: 'transparent', stroke: 'transparent', sw: 0, opacity: 1,
            src,
          };
          push([...elementsRef.current, el]);
          setSelId(id);
        };
        img.src = src;
      };
      reader.readAsDataURL(file);
    });
  }, [push]);

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

  const duplicateSelected = useCallback(() => {
    if (!selId) return;
    const orig = elementsRef.current.find(e => e.id === selId);
    if (!orig) return;
    const copy: CE = { ...orig, id: uid(), x: orig.x + 16, y: orig.y + 16 };
    if (orig.src) {
      const img = imgCacheRef.current.get(orig.id);
      if (img) imgCacheRef.current.set(copy.id, img);
    }
    push([...elementsRef.current, copy]);
    setSelId(copy.id);
  }, [selId, push]);
  const dupRef = useRef(duplicateSelected);
  useEffect(() => { dupRef.current = duplicateSelected; }, [duplicateSelected]);

  // ── Export ──────────────────────────────────────────────────────────────────
  const buildOffscreenCanvas = useCallback((hd = false) => {
    const sc = hd ? 4 : 1;
    const off = document.createElement('canvas');
    off.width = CW * sc; off.height = CH * sc;
    const ctx = off.getContext('2d')!;
    ctx.scale(sc, sc);
    if (flagBg) ctx.drawImage(flagBg, 0, 0, CW, CH);
    else { ctx.fillStyle = bgColor; ctx.fillRect(0, 0, CW, CH); }
    for (const el of elementsRef.current) renderElement(ctx, el, imgCacheRef.current);
    if (!hd) {
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
      ctx.fillText('flagswing.com', CW - 12, CH - 12);
    }
    return off;
  }, [bgColor, flagBg]);

  const exportCanvas = useCallback((hd = false) => {
    const off = buildOffscreenCanvas(hd);
    const a = document.createElement('a');
    a.href = off.toDataURL('image/png');
    a.download = hd ? 'flag-hd.png' : 'flag-preview.png';
    a.click();
  }, [buildOffscreenCanvas]);

  const exportPDF = useCallback(() => {
    const off = buildOffscreenCanvas(true); // HD quality
    const jpegDataUrl = off.toDataURL('image/jpeg', 0.92);
    const b64 = jpegDataUrl.split(',')[1];
    const raw = atob(b64);
    const jpegBytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) jpegBytes[i] = raw.charCodeAt(i);

    const imgW = off.width, imgH = off.height;
    // A4 landscape in points (1pt = 1/72 inch): 841.89 × 595.28
    const pdfW = 841.89;
    const pdfH = Math.round((pdfW * imgH) / imgW * 100) / 100;

    const enc = new TextEncoder();
    const parts: Uint8Array[] = [];
    const xref: number[] = [];
    let pos = 0;

    const write = (s: string) => {
      const b = enc.encode(s); parts.push(b); pos += b.length;
    };
    const writeBin = (b: Uint8Array) => { parts.push(b); pos += b.length; };
    const beginObj = (n: number) => { xref[n] = pos; write(`${n} 0 obj\n`); };
    const endObj   = () => write('endobj\n');

    write('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');

    beginObj(1); write('<< /Type /Catalog /Pages 2 0 R >>\n'); endObj();
    beginObj(2); write('<< /Type /Pages /Kids [3 0 R] /Count 1 >>\n'); endObj();
    beginObj(3);
    write(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pdfW} ${pdfH}]\n`);
    write('   /Contents 4 0 R /Resources << /XObject << /Im1 5 0 R >> >> >>\n');
    endObj();

    const stream = enc.encode(`q ${pdfW} 0 0 ${pdfH} 0 0 cm /Im1 Do Q\n`);
    beginObj(4);
    write(`<< /Length ${stream.length} >>\nstream\n`);
    writeBin(stream);
    write('\nendstream\n'); endObj();

    beginObj(5);
    write(`<< /Type /XObject /Subtype /Image\n`);
    write(`   /Width ${imgW} /Height ${imgH}\n`);
    write(`   /ColorSpace /DeviceRGB /BitsPerComponent 8\n`);
    write(`   /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`);
    writeBin(jpegBytes);
    write('\nendstream\n'); endObj();

    const xrefPos = pos;
    write('xref\n');
    write(`0 6\n`);
    write('0000000000 65535 f \n');
    for (let i = 1; i <= 5; i++) {
      write(String(xref[i]).padStart(10, '0') + ' 00000 n \n');
    }
    write(`trailer\n<< /Size 6 /Root 1 0 R >>\n`);
    write(`startxref\n${xrefPos}\n%%EOF\n`);

    const total = parts.reduce((s, p) => s + p.length, 0);
    const out = new Uint8Array(total);
    let off2 = 0;
    for (const p of parts) { out.set(p, off2); off2 += p.length; }

    const blob = new Blob([out], { type: 'application/pdf' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'flag.pdf';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }, [buildOffscreenCanvas]);

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
        onClick={() => setPanel(id)}
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

  const PANEL_LABELS: Record<Panel, string> = {
    shapes: 'Shapes', import: 'Import Image',
    text: 'Add Text', colors: 'Colors', layers: 'Layers',
  };

  return (
    <div
      className="fixed left-0 right-0 bottom-0 z-40 flex flex-col overflow-hidden"
      style={{ top: navH, background: T.bg, fontFamily: 'system-ui, sans-serif', color: T.text }}
    >
      {/* ── Top bar ── */}
      <div className="flex h-10 shrink-0 items-center gap-2 px-3 border-b"
        style={{ background: T.topbar, borderColor: T.border }}>
        <Link href="/" className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition-colors hover:bg-slate-100"
          style={{ color: T.textSub }}>
          <ArrowLeft size={13} /><span className="hidden sm:inline ml-0.5">Back</span>
        </Link>
        <span className="h-4 w-px shrink-0" style={{ background: T.border }} />
        <span className="truncate text-xs font-semibold max-w-[110px] sm:max-w-xs" style={{ color: T.text }}>
          {countryName}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <button onClick={undo} title="Undo (Ctrl+Z)" className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-slate-100 transition-colors" style={{ color: T.textSub }}><Undo2 size={13} /></button>
          <button onClick={redo} title="Redo (Ctrl+Y)" className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-slate-100 transition-colors" style={{ color: T.textSub }}><Redo2 size={13} /></button>
          <span className="h-4 w-px mx-1 shrink-0 hidden sm:block" style={{ background: T.border }} />
          <label className="hidden sm:flex items-center gap-1 text-[11px] cursor-pointer" style={{ color: T.textSub }}>
            BG<input type="color" value={flagBg ? '#cccccc' : bgColor} disabled={!!flagBg}
              onChange={e => { setFlagBg(null); setBgColor(e.target.value); }}
              className="h-6 w-7 cursor-pointer rounded border-0 p-0" />
          </label>
          {flagBg && <button onClick={() => setFlagBg(null)} className="hidden sm:block rounded-md px-2 py-1 text-[11px] hover:bg-slate-100 transition-colors" style={{ color: T.textSub }}>Clear</button>}
          <span className="h-4 w-px mx-1 shrink-0" style={{ background: T.border }} />
          <div className="relative">
            <button onClick={() => setExportOpen(o => !o)}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold hover:opacity-85 transition-opacity"
              style={{ background: ACCENT, color: '#fff' }}>
              <Download size={11} /><span className="hidden sm:inline">Export</span><ChevronDown size={9} />
            </button>
            {exportOpen && (<>
              <div className="fixed inset-0 z-10" onClick={() => setExportOpen(false)} />
              <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-xl border overflow-hidden shadow-lg"
                style={{ background: '#fff', borderColor: T.border }}>
                <button onClick={() => { exportCanvas(true); setExportOpen(false); }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-xs font-medium hover:bg-slate-50 transition-colors" style={{ color: T.text }}>
                  <Download size={13} style={{ color: ACCENT }} />
                  <div><div className="font-semibold">PNG (HD)</div><div className="text-[10px]" style={{ color: T.textMuted }}>3600 × 2400px</div></div>
                </button>
                <div style={{ height: 1, background: T.border }} />
                <button onClick={() => { exportPDF(); setExportOpen(false); }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-xs font-medium hover:bg-slate-50 transition-colors" style={{ color: T.text }}>
                  <FileText size={13} style={{ color: '#ef4444' }} />
                  <div><div className="font-semibold">PDF (A4)</div><div className="text-[10px]" style={{ color: T.textMuted }}>Print ready</div></div>
                </button>
              </div>
            </>)}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="relative flex flex-1 min-h-0 overflow-hidden">

        {/* ── Left rail (sm+) ── */}
        <nav className="hidden sm:flex flex-col items-center gap-0.5 py-2 px-1 shrink-0"
          style={{ width: 52, background: T.rail, borderRight: `1px solid ${T.border}` }}>
          <RailBtn id="shapes" icon={<Gamepad2 size={16} />} label="Shapes" />
          <RailBtn id="import" icon={<Upload size={16} />}   label="Import" />
          <RailBtn id="text"   icon={<Type size={16} />}     label="Text"   />
          <RailBtn id="colors" icon={<Palette size={16} />}  label="Colors" />
          <RailBtn id="layers" icon={<Layers size={16} />}   label="Layers" />
        </nav>

        {/* ── Mobile backdrop ── */}
        {mobileOpen && (
          <div className="absolute inset-0 z-20 sm:hidden" style={{ background: 'rgba(0,0,0,0.38)' }}
            onClick={() => setMobileOpen(false)} />
        )}

        {/* ── Left panel (absolute on mobile, static on sm+) ── */}
        <aside
          className={[
            'flex flex-col shrink-0 overflow-hidden',
            'absolute sm:relative z-30 sm:z-auto top-0 bottom-0 left-0',
            'transition-transform duration-200 ease-in-out',
            mobileOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0',
          ].join(' ')}
          style={{ width: 244, background: T.panel, borderRight: `1px solid ${T.border}` }}
        >
          {/* Panel header */}
          <div className="flex items-center justify-between px-3 py-2 border-b shrink-0" style={{ borderColor: T.border }}>
            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: T.textMuted }}>
              {PANEL_LABELS[panel]}
            </span>
            <button onClick={() => setMobileOpen(false)}
              className="sm:hidden flex h-6 w-6 items-center justify-center rounded-md hover:bg-slate-100 transition-colors"
              style={{ color: T.textMuted }}>
              <X size={12} />
            </button>
          </div>
          {/* Scrollable panel body */}
          <div className="flex-1 overflow-y-auto">

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
                  <label className="text-xs font-medium" style={{ color: T.textSub }}>Star points: {defPoints}</label>
                  <input type="range" min={3} max={20} value={defPoints}
                    onChange={e => setDefPoints(Number(e.target.value))} />
                  <label className="text-xs font-medium" style={{ color: T.textSub }}>Polygon sides: {defSides}</label>
                  <input type="range" min={3} max={20} value={defSides}
                    onChange={e => setDefSides(Number(e.target.value))} />
                  <label className="text-xs font-medium" style={{ color: T.textSub }}>Moon crescent: {defCrescent}%</label>
                  <input type="range" min={1} max={99} value={defCrescent}
                    onChange={e => setDefCrescent(Number(e.target.value))} />
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {SHAPE_CATALOG.map(s => (
                    <button key={s.kind} onClick={() => addShape(s.kind)} title={s.label}
                      className="flex flex-col items-center justify-center gap-1 rounded-xl py-2.5 transition-all"
                      style={{ background: T.inputBg, border: `1px solid ${T.border}`, aspectRatio: '1' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.background = T.selBg; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.inputBg; }}>
                      <ShapeIcon kind={s.kind} color={defFill} size={28} />
                      <span className="text-[9px] font-medium leading-none" style={{ color: T.textMuted }}>{s.label}</span>
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

            {/* Import */}
            {panel === 'import' && (
              <div className="flex flex-col gap-3 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: T.textMuted }}>
                  Import Image
                </p>
                {/* Drop zone */}
                <label
                  className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed cursor-pointer transition-colors"
                  style={{
                    minHeight: 160,
                    borderColor: dragOver ? ACCENT : T.border,
                    background: dragOver ? '#eff3ff' : T.inputBg,
                  }}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => {
                    e.preventDefault();
                    setDragOver(false);
                    importFiles(e.dataTransfer.files);
                  }}
                >
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    multiple
                    className="sr-only"
                    onChange={e => e.target.files && importFiles(e.target.files)}
                  />
                  <Upload size={28} style={{ color: dragOver ? ACCENT : T.textMuted }} />
                  <div className="text-center px-2">
                    <p className="text-xs font-semibold" style={{ color: dragOver ? ACCENT : T.text }}>
                      Drop file here
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: T.textMuted }}>
                      or click to browse
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {['PNG', 'JPG', 'SVG'].map(f => (
                      <span key={f} className="rounded-md px-2 py-0.5 text-[10px] font-semibold"
                        style={{ background: T.hover, color: T.textSub }}>
                        {f}
                      </span>
                    ))}
                  </div>
                </label>
                <p className="text-center text-[10px]" style={{ color: T.textMuted }}>
                  Imported images appear as movable & resizable elements on the canvas
                </p>
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
        </aside>

        {/* ── Canvas area ── */}
        <main ref={containerRef}
          className="relative flex flex-1 min-w-0 items-center justify-center p-3 sm:p-4"
          style={{ background: T.bg }}
        >
          <div className="relative" style={{ width: canvasW, height: canvasH }}>
            <canvas
              ref={canvasRef}
              width={CW} height={CH}
              style={{
                display: 'block', width: canvasW, height: canvasH,
                cursor: selEl ? 'move' : 'crosshair',
                borderRadius: 6,
                boxShadow: '0 0 0 1px rgba(0,0,0,0.07), 0 4px 20px rgba(0,0,0,0.10)',
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
        </main>

        {/* ── Right properties panel (lg+) ── */}
        <aside className="hidden lg:flex shrink-0 flex-col overflow-y-auto"
          style={{ width: 216, background: T.panel, borderLeft: `1px solid ${T.border}` }}>
          <div className="flex items-center justify-between px-3 py-2 border-b shrink-0" style={{ borderColor: T.border }}>
            <span className="text-[10px] font-semibold uppercase tracking-widest capitalize" style={{ color: T.textMuted }}>
              {selEl ? selEl.kind : 'Properties'}
            </span>
            {selEl && (
              <div className="flex items-center gap-1">
                <button onClick={duplicateSelected} title="Duplicate (Ctrl+D)"
                  className="flex h-6 w-6 items-center justify-center rounded-md transition-colors hover:bg-slate-100"
                  style={{ color: T.textSub }}>
                  <Copy size={12} />
                </button>
                <button onClick={deleteSelected} title="Delete"
                  className="flex h-6 w-6 items-center justify-center rounded-md transition-colors hover:bg-red-50"
                  style={{ color: '#ef4444' }}>
                  <Trash2 size={12} />
                </button>
              </div>
            )}
          </div>
          {!selEl && (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-10"
              style={{ color: T.textMuted }}>
              <Layers size={28} style={{ opacity: 0.3 }} />
              <p className="text-center text-xs leading-relaxed">
                Select an element on the canvas to edit its properties
              </p>
            </div>
          )}
          {selEl && (<>

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
              {selEl.kind === 'star' && (
                <label className="mt-2 flex flex-col gap-1">
                  <span className="text-[10px]" style={{ color: T.textMuted }}>Points: {selEl.points ?? 5}</span>
                  <input type="range" min={3} max={20} value={selEl.points ?? 5}
                    onChange={e => updateSel({ points: Number(e.target.value) })} />
                </label>
              )}
              {selEl.kind === 'polygon' && (
                <label className="mt-2 flex flex-col gap-1">
                  <span className="text-[10px]" style={{ color: T.textMuted }}>Sides: {selEl.sides ?? 6}</span>
                  <input type="range" min={3} max={20} value={selEl.sides ?? 6}
                    onChange={e => updateSel({ sides: Number(e.target.value) })} />
                </label>
              )}
              {selEl.kind === 'moon' && (
                <label className="mt-2 flex flex-col gap-1">
                  <span className="text-[10px]" style={{ color: T.textMuted }}>
                    Crescent: {selEl.crescent ?? 50}% ({(selEl.crescent ?? 50) < 30 ? 'Fat' : (selEl.crescent ?? 50) > 70 ? 'Thin hilal' : 'Normal'})
                  </span>
                  <input type="range" min={1} max={99} value={selEl.crescent ?? 50}
                    onChange={e => updateSel({ crescent: Number(e.target.value) })} />
                </label>
              )}
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
          </>)}
        </aside>
      </div>

      {/* ── Mobile bottom rail (sm hidden) ── */}
      <nav className="flex sm:hidden shrink-0 border-t" style={{ background: T.rail, borderColor: T.border }}>
        {([
          { id: 'shapes' as Panel, icon: <Gamepad2 size={17} />, label: 'Shapes' },
          { id: 'import' as Panel, icon: <Upload size={17} />,   label: 'Import' },
          { id: 'text'   as Panel, icon: <Type size={17} />,     label: 'Text'   },
          { id: 'colors' as Panel, icon: <Palette size={17} />,  label: 'Colors' },
          { id: 'layers' as Panel, icon: <Layers size={17} />,   label: 'Layers' },
        ]).map(({ id, icon, label }) => {
          const active = panel === id && mobileOpen;
          return (
            <button key={id}
              onClick={() => { setPanel(id); setMobileOpen(prev => !(prev && panel === id)); }}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-colors"
              style={{ color: active ? ACCENT : T.textSub, background: active ? T.selBg : 'transparent' }}>
              {icon}
              <span className="text-[9px] font-medium">{label}</span>
            </button>
          );
        })}
      </nav>

      {/* ── Status bar ── */}
      <div className="hidden sm:flex h-6 items-center gap-4 px-4 shrink-0 border-t text-[10px]"
        style={{ background: T.statusBar, borderColor: T.border, color: T.textMuted }}>
        <span>{elements.length} element{elements.length !== 1 ? 's' : ''}</span>
        {selEl && (<><span style={{ color: T.border }}>|</span><span style={{ color: ACCENT }}>Selected: {selEl.kind}</span></>)}
        <span style={{ color: T.border }}>|</span>
        <span>{CW} × {CH}px</span>
        <span style={{ color: T.border }}>|</span>
        <span>{Math.round(scale * 100)}% zoom</span>
      </div>
    </div>
  );
}
