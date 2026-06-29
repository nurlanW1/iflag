'use client';

import { forwardRef, useEffect, useRef } from 'react';
import type { VSEntity, VSDesignerState } from '@/lib/vs-designer-types';

const FONT_FAMILY = '"Arial Black", "Arial Bold", Arial, system-ui, sans-serif';
const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;
const SIDE_COLUMN_WIDTH = CANVAS_WIDTH * 0.38;
const CENTER_COLUMN_LEFT = SIDE_COLUMN_WIDTH;
const CENTER_COLUMN_WIDTH = CANVAS_WIDTH * 0.24;
const RIGHT_COLUMN_LEFT = SIDE_COLUMN_WIDTH + CENTER_COLUMN_WIDTH;
const FLAG_IMAGE_SIZE = { width: 510, height: 340 };
const CLUB_IMAGE_SIZE = { width: 300, height: 300 };
const SIDE_GAP = 44;

export const VS_EXPORT_WIDTH = CANVAS_WIDTH;
export const VS_EXPORT_HEIGHT = CANVAS_HEIGHT;

function getDateStr(s: VSDesignerState): string {
  if (s.dateMode === 'manual') return s.dateText;
  return new Date()
    .toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    .toUpperCase();
}

type Rect = { x: number; y: number; width: number; height: number };

type VSLayout = {
  dateStr: string;
  leftImage: Rect;
  rightImage: Rect;
  leftName: Rect;
  rightName: Rect;
  title: Rect;
  scoreLeft: Rect;
  scoreRight: Rect;
  scoreLine: Rect;
  centerText: Rect;
  date: Rect;
};

function imageSize(entity: VSEntity) {
  return entity.type === 'club' ? CLUB_IMAGE_SIZE : FLAG_IMAGE_SIZE;
}

function sideLayout(columnLeft: number, entity: VSEntity, nameSize: number) {
  const img = imageSize(entity);
  const nameHeight = Math.round(nameSize * 1.28);
  const groupHeight = img.height + SIDE_GAP + nameHeight;
  const imageX = Math.round(columnLeft + (SIDE_COLUMN_WIDTH - img.width) / 2);
  const imageY = Math.round((CANVAS_HEIGHT - groupHeight) / 2);
  const nameY = imageY + img.height + SIDE_GAP;
  return {
    image: { x: imageX, y: imageY, width: img.width, height: img.height },
    name: { x: Math.round(columnLeft + 70), y: nameY, width: Math.round(SIDE_COLUMN_WIDTH - 140), height: nameHeight },
  };
}

function getLayout(state: VSDesignerState): VSLayout {
  const dateStr = getDateStr(state);
  const left = sideLayout(0, state.left, state.nameSize);
  const right = sideLayout(RIGHT_COLUMN_LEFT, state.right, state.nameSize);

  const scoreCenterY = 485;
  const scoreHeight = Math.round(state.centerSize * 1.04);
  const scoreTop = Math.round(scoreCenterY - scoreHeight / 2);
  const scoreLineWidth = Math.round(state.centerSize * 0.32);
  const scoreLineHeight = Math.max(3, Math.round(state.centerSize * 0.035));
  const scoreNumberWidth = Math.round(state.centerSize * 1.08);
  const scoreGap = Math.round(state.centerSize * 0.06);
  const scoreGroupWidth = (scoreNumberWidth * 2) + scoreLineWidth + (scoreGap * 2);
  const scoreGroupLeft = Math.round(CENTER_COLUMN_LEFT + (CENTER_COLUMN_WIDTH - scoreGroupWidth) / 2);
  const scoreLineTop = Math.round(scoreCenterY - scoreLineHeight / 2);
  const dateHeight = 34;
  const dateCenterY = Math.round(scoreCenterY + state.centerSize * 0.6 + 61);
  const dateTop = Math.round(dateCenterY - dateHeight / 2);
  const titleHeight = Math.round(state.titleSize * 1.24);
  const titleTop = Math.round(scoreTop - titleHeight - 48);

  return {
    dateStr,
    leftImage: left.image,
    rightImage: right.image,
    leftName: left.name,
    rightName: right.name,
    title: { x: CENTER_COLUMN_LEFT, y: titleTop, width: CENTER_COLUMN_WIDTH, height: titleHeight },
    scoreLeft: { x: scoreGroupLeft, y: scoreTop, width: scoreNumberWidth, height: scoreHeight },
    scoreRight: {
      x: scoreGroupLeft + scoreNumberWidth + scoreGap + scoreLineWidth + scoreGap,
      y: scoreTop,
      width: scoreNumberWidth,
      height: scoreHeight,
    },
    scoreLine: { x: scoreGroupLeft + scoreNumberWidth + scoreGap, y: scoreLineTop, width: scoreLineWidth, height: scoreLineHeight },
    centerText: { x: CENTER_COLUMN_LEFT, y: scoreTop, width: CENTER_COLUMN_WIDTH, height: scoreHeight },
    date: { x: CENTER_COLUMN_LEFT, y: dateTop, width: CENTER_COLUMN_WIDTH, height: dateHeight },
  };
}

function fitContain(srcWidth: number, srcHeight: number, box: Rect): Rect {
  if (srcWidth <= 0 || srcHeight <= 0) return box;
  const scale = Math.min(box.width / srcWidth, box.height / srcHeight);
  const width = Math.round(srcWidth * scale);
  const height = Math.round(srcHeight * scale);
  return {
    x: Math.round(box.x + (box.width - width) / 2),
    y: Math.round(box.y + (box.height - height) / 2),
    width,
    height,
  };
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  if (!src.trim()) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    const done = (value: HTMLImageElement | null) => {
      window.clearTimeout(timeout);
      resolve(value);
    };
    const timeout = window.setTimeout(() => done(null), 12_000);
    if (!src.startsWith('blob:') && !src.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => done(img);
    img.onerror = () => done(null);
    img.src = src;
  });
}

function setFont(ctx: CanvasRenderingContext2D, weight: number, size: number) {
  ctx.font = `${weight} ${size}px ${FONT_FAMILY}`;
}

function measureSpacedText(ctx: CanvasRenderingContext2D, text: string, letterSpacing: number) {
  if (!text) return 0;
  let width = 0;
  for (let i = 0; i < text.length; i++) {
    width += ctx.measureText(text[i]!).width;
    if (i < text.length - 1) width += letterSpacing;
  }
  return width;
}

function drawSpacedText(
  ctx: CanvasRenderingContext2D,
  textRaw: string,
  x: number,
  y: number,
  opts: { align: 'left' | 'center' | 'right'; letterSpacing: number },
) {
  const text = textRaw || '';
  const width = measureSpacedText(ctx, text, opts.letterSpacing);
  let cursor = opts.align === 'center' ? x - width / 2 : opts.align === 'right' ? x - width : x;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    ctx.fillText(ch, cursor, y);
    cursor += ctx.measureText(ch).width + opts.letterSpacing;
  }
}

function drawTextInRect(
  ctx: CanvasRenderingContext2D,
  text: string,
  rect: Rect,
  opts: { weight: number; size: number; color: string; letterSpacing: number; align?: 'left' | 'center' | 'right' },
) {
  ctx.save();
  setFont(ctx, opts.weight, opts.size);
  ctx.fillStyle = opts.color;
  ctx.textBaseline = 'middle';
  const align = opts.align ?? 'center';
  const x = align === 'left' ? rect.x : align === 'right' ? rect.x + rect.width : rect.x + rect.width / 2;
  drawSpacedText(ctx, text.toUpperCase(), x, rect.y + rect.height / 2, { align, letterSpacing: opts.letterSpacing });
  ctx.restore();
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, rect: Rect, radius: number) {
  const r = Math.min(radius, rect.width / 2, rect.height / 2);
  ctx.beginPath();
  ctx.moveTo(rect.x + r, rect.y);
  ctx.lineTo(rect.x + rect.width - r, rect.y);
  ctx.quadraticCurveTo(rect.x + rect.width, rect.y, rect.x + rect.width, rect.y + r);
  ctx.lineTo(rect.x + rect.width, rect.y + rect.height - r);
  ctx.quadraticCurveTo(rect.x + rect.width, rect.y + rect.height, rect.x + rect.width - r, rect.y + rect.height);
  ctx.lineTo(rect.x + r, rect.y + rect.height);
  ctx.quadraticCurveTo(rect.x, rect.y + rect.height, rect.x, rect.y + rect.height - r);
  ctx.lineTo(rect.x, rect.y + r);
  ctx.quadraticCurveTo(rect.x, rect.y, rect.x + r, rect.y);
  ctx.closePath();
}

async function drawEntityImage(ctx: CanvasRenderingContext2D, entity: VSEntity, box: Rect) {
  const img = await loadImage(entity.imageUrl);
  if (!img) {
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    drawRoundedRect(ctx, box, 8);
    ctx.fill();
    ctx.restore();
    return;
  }

  const fit = fitContain(img.naturalWidth || img.width, img.naturalHeight || img.height, box);
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 48;
  ctx.shadowOffsetY = 12;
  ctx.drawImage(img, fit.x, fit.y, fit.width, fit.height);
  ctx.restore();
}

export async function renderVSDesignToCanvas(state: VSDesignerState, scale = 1): Promise<HTMLCanvasElement> {
  const layout = getLayout(state);
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH * scale;
  canvas.height = CANVAS_HEIGHT * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.scale(scale, scale);
  ctx.fillStyle = state.bgColor;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const glow = ctx.createRadialGradient(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 0, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 650);
  glow.addColorStop(0, 'rgba(255,255,255,0.04)');
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(CANVAS_WIDTH / 2 - 0.5, CANVAS_HEIGHT * 0.1, 1, CANVAS_HEIGHT * 0.8);

  await Promise.all([
    drawEntityImage(ctx, state.left, layout.leftImage),
    drawEntityImage(ctx, state.right, layout.rightImage),
  ]);

  drawTextInRect(ctx, state.left.name, layout.leftName, {
    weight: 900,
    size: state.nameSize,
    color: state.nameColor,
    letterSpacing: 6,
  });
  drawTextInRect(ctx, state.right.name, layout.rightName, {
    weight: 900,
    size: state.nameSize,
    color: state.nameColor,
    letterSpacing: 6,
  });
  drawTextInRect(ctx, state.eventTitle, layout.title, {
    weight: 800,
    size: state.titleSize,
    color: state.titleColor,
    letterSpacing: 7,
  });

  ctx.save();
  ctx.shadowColor = state.centerColor;
  ctx.shadowBlur = 64;
  if (state.scoreMode) {
    drawTextInRect(ctx, state.leftScore || '0', layout.scoreLeft, {
      weight: 900,
      size: state.centerSize,
      color: state.centerColor,
      letterSpacing: -4,
      align: 'right',
    });
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = state.centerColor;
    drawRoundedRect(ctx, layout.scoreLine, 999);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 64;
    drawTextInRect(ctx, state.rightScore || '0', layout.scoreRight, {
      weight: 900,
      size: state.centerSize,
      color: state.centerColor,
      letterSpacing: -4,
      align: 'left',
    });
  } else {
    drawTextInRect(ctx, state.vsText, layout.centerText, {
      weight: 900,
      size: state.centerSize,
      color: state.centerColor,
      letterSpacing: 14,
    });
  }
  ctx.restore();

  if (layout.dateStr) {
    drawTextInRect(ctx, layout.dateStr, layout.date, {
      weight: 500,
      size: 20,
      color: state.dateColor,
      letterSpacing: 4,
    });
  }

  return canvas;
}

const VSCanvas = forwardRef<HTMLDivElement, VSDesignerState>((state, ref) => {
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const rendered = await renderVSDesignToCanvas(state, 1);
      if (cancelled || !previewCanvasRef.current) return;
      const canvas = previewCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = VS_EXPORT_WIDTH;
      canvas.height = VS_EXPORT_HEIGHT;
      ctx.clearRect(0, 0, VS_EXPORT_WIDTH, VS_EXPORT_HEIGHT);
      ctx.drawImage(rendered, 0, 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [state]);

  return (
    <div
      ref={ref}
      style={{
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        backgroundColor: state.bgColor,
        overflow: 'hidden',
        position: 'relative',
        transformOrigin: 'top left',
      }}
    >
      <canvas
        ref={previewCanvasRef}
        width={VS_EXPORT_WIDTH}
        height={VS_EXPORT_HEIGHT}
        aria-label="VS Designer preview"
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          display: 'block',
        }}
      />
    </div>
  );
});
VSCanvas.displayName = 'VSCanvas';
export default VSCanvas;