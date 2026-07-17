'use client';

import { forwardRef, useEffect, useRef } from 'react';
import type { VSEntity, VSDesignerState } from '@/lib/vs-designer-types';

const FONT_FAMILY = '"Impact", "Arial Black", "Arial Bold", Arial, system-ui, sans-serif';
const BODY_FONT = '"Arial Black", "Arial Bold", Arial, system-ui, sans-serif';
const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;
const WHITE = '#fffaf0';
const VS_FLAME_COLOR = '#f5b301';
const STADIUM_THEME_BACKGROUND = '/images/vs-designer/stadium-theme.jpg';

export const VS_EXPORT_WIDTH = CANVAS_WIDTH;
export const VS_EXPORT_HEIGHT = CANVAS_HEIGHT;

type Rect = { x: number; y: number; width: number; height: number };

type VSLayout = {
  dateStr: string;
  leftImage: Rect;
  rightImage: Rect;
  leftName: Rect;
  rightName: Rect;
  leftTagline: Rect;
  rightTagline: Rect;
  title: Rect;
  scoreLeft: Rect;
  scoreRight: Rect;
  scoreDash: Rect;
  centerText: Rect;
  status: Rect;
  date: Rect;
  venue: Rect;
  hashtag: Rect;
};

function upper(value: string | undefined, fallback = '') {
  return (value?.trim() || fallback).toUpperCase();
}

function getDateStr(s: VSDesignerState): string {
  if (s.dateMode === 'manual') return upper(s.dateText);
  return new Date()
    .toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    .toUpperCase();
}

function getLayout(state: VSDesignerState): VSLayout {
  const leftClub = state.left.type === 'club';
  const rightClub = state.right.type === 'club';
  const leftImage = leftClub
    ? { x: 160, y: 230, width: 400, height: 400 }
    : { x: 110, y: 300, width: 520, height: 330 };
  const rightImage = rightClub
    ? { x: 1360, y: 230, width: 400, height: 400 }
    : { x: 1290, y: 300, width: 520, height: 330 };

  return {
    dateStr: getDateStr(state),
    leftImage,
    rightImage,
    leftName: { x: 90, y: 695, width: 600, height: 74 },
    rightName: { x: 1230, y: 695, width: 600, height: 74 },
    leftTagline: { x: 90, y: 777, width: 600, height: 42 },
    rightTagline: { x: 1230, y: 777, width: 600, height: 42 },
    title: { x: 710, y: 252, width: 500, height: 68 },
    scoreLeft: { x: 640, y: 365, width: 300, height: 230 },
    scoreRight: { x: 980, y: 365, width: 300, height: 230 },
    scoreDash: { x: 930, y: 480, width: 60, height: 12 },
    centerText: { x: 660, y: 395, width: 600, height: 170 },
    status: { x: 630, y: 650, width: 660, height: 92 },
    date: { x: 650, y: 832, width: 360, height: 58 },
    venue: { x: 1110, y: 832, width: 430, height: 58 },
    hashtag: { x: 760, y: 970, width: 400, height: 40 },
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

function fitCover(srcWidth: number, srcHeight: number, box: Rect): Rect {
  if (srcWidth <= 0 || srcHeight <= 0) return box;
  const scale = Math.max(box.width / srcWidth, box.height / srcHeight);
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

function setFont(ctx: CanvasRenderingContext2D, weight: number, size: number, family = FONT_FAMILY) {
  ctx.font = `${weight} ${size}px ${family}`;
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
  opts: { align: 'left' | 'center' | 'right'; letterSpacing: number; stroke?: boolean },
) {
  const text = textRaw || '';
  const width = measureSpacedText(ctx, text, opts.letterSpacing);
  let cursor = opts.align === 'center' ? x - width / 2 : opts.align === 'right' ? x - width : x;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (opts.stroke) ctx.strokeText(ch, cursor, y);
    ctx.fillText(ch, cursor, y);
    cursor += ctx.measureText(ch).width + opts.letterSpacing;
  }
}

function drawTextInRect(
  ctx: CanvasRenderingContext2D,
  text: string,
  rect: Rect,
  opts: {
    weight: number;
    size: number;
    color: string;
    letterSpacing?: number;
    align?: 'left' | 'center' | 'right';
    family?: string;
    strokeColor?: string;
    strokeWidth?: number;
    shadow?: boolean;
    minSize?: number;
    offsetX?: number;
    offsetY?: number;
  },
) {
  ctx.save();
  const letterSpacing = opts.letterSpacing ?? 0;
  const displayText = upper(text);
  const minSize = opts.minSize ?? Math.max(10, Math.round(opts.size * 0.55));
  let fittedSize = Math.min(opts.size, Math.max(minSize, Math.floor(rect.height * 0.92)));
  setFont(ctx, opts.weight, fittedSize, opts.family);
  while (fittedSize > minSize && measureSpacedText(ctx, displayText, letterSpacing) > rect.width) {
    fittedSize -= 1;
    setFont(ctx, opts.weight, fittedSize, opts.family);
  }

  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.width, rect.height);
  ctx.clip();
  ctx.fillStyle = opts.color;
  ctx.textBaseline = 'middle';
  if (opts.strokeColor && opts.strokeWidth) {
    ctx.strokeStyle = opts.strokeColor;
    ctx.lineWidth = opts.strokeWidth;
    ctx.lineJoin = 'round';
  }
  if (opts.shadow) {
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 22;
    ctx.shadowOffsetY = 8;
  }
  const align = opts.align ?? 'center';
  const x = (align === 'left' ? rect.x : align === 'right' ? rect.x + rect.width : rect.x + rect.width / 2) + (opts.offsetX ?? 0);
  drawSpacedText(ctx, displayText, x, rect.y + rect.height / 2 + (opts.offsetY ?? 0), {
    align,
    letterSpacing,
    stroke: Boolean(opts.strokeColor && opts.strokeWidth),
  });
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

async function drawBackground(ctx: CanvasRenderingContext2D, state: VSDesignerState) {
  ctx.fillStyle = state.bgColor;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const backgroundImageSrc =
    state.backgroundStyle === 'image'
      ? state.backgroundImageUrl
      : state.backgroundStyle === 'stadium'
        ? STADIUM_THEME_BACKGROUND
        : undefined;

  if (backgroundImageSrc) {
    const bg = await loadImage(backgroundImageSrc);
    if (bg) {
      const fit = fitCover(bg.naturalWidth || bg.width, bg.naturalHeight || bg.height, {
        x: 0,
        y: 0,
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
      });
      ctx.drawImage(bg, fit.x, fit.y, fit.width, fit.height);
      if (state.backgroundStyle === 'stadium') {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        return;
      }
    }
  }

  const main = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  main.addColorStop(0, state.backgroundStyle === 'image' ? 'rgba(5,8,18,0.66)' : 'rgba(255,255,255,0.05)');
  main.addColorStop(0.42, 'rgba(8,17,34,0.82)');
  main.addColorStop(1, 'rgba(0,0,0,0.46)');
  ctx.fillStyle = main;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  if (state.backgroundStyle === 'stadium') {
    ctx.save();
    const pitch = ctx.createLinearGradient(0, 730, 0, 1080);
    pitch.addColorStop(0, 'rgba(12,86,57,0)');
    pitch.addColorStop(1, 'rgba(24,118,75,0.12)');
    ctx.fillStyle = pitch;
    ctx.fillRect(0, 660, CANVAS_WIDTH, 420);
    for (const x of [230, 520, 1400, 1690]) {
      const light = ctx.createRadialGradient(x, 118, 0, x, 118, 360);
      light.addColorStop(0, 'rgba(255,255,255,0.14)');
      light.addColorStop(0.42, 'rgba(255,255,255,0.035)');
      light.addColorStop(1, 'rgba(255,244,200,0)');
      ctx.fillStyle = light;
      ctx.fillRect(x - 380, 0, 760, 520);
    }
    ctx.restore();
  }

  const center = ctx.createRadialGradient(960, 500, 0, 960, 500, 580);
  center.addColorStop(0, 'rgba(255,255,255,0.13)');
  center.addColorStop(0.42, 'rgba(33,63,118,0.16)');
  center.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = center;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

}

async function drawEntityImage(ctx: CanvasRenderingContext2D, entity: VSEntity, box: Rect) {
  const img = await loadImage(entity.imageUrl);
  ctx.save();
  ctx.shadowColor = entity.type === 'club' ? 'rgba(0,0,0,0.58)' : 'rgba(0,0,0,0.42)';
  ctx.shadowBlur = entity.type === 'club' ? 38 : 24;
  ctx.shadowOffsetY = 18;

  if (!img) {
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    drawRoundedRect(ctx, box, 16);
    ctx.fill();
    ctx.restore();
    return;
  }

  const fit = fitContain(img.naturalWidth || img.width, img.naturalHeight || img.height, box);
  ctx.drawImage(img, fit.x, fit.y, fit.width, fit.height);
  ctx.restore();
}

function drawStatusRibbon(ctx: CanvasRenderingContext2D, rect: Rect, label: string) {
  ctx.save();
  const pill = {
    x: rect.x + 160,
    y: rect.y + 18,
    width: rect.width - 320,
    height: rect.height - 36,
  };
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.fillStyle = 'rgba(255,255,255,0.055)';
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, pill, 999);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  drawTextInRect(ctx, label, pill, {
    weight: 900,
    size: 32,
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 8,
    family: BODY_FONT,
  });
}

function drawScore(ctx: CanvasRenderingContext2D, state: VSDesignerState, layout: VSLayout) {
  ctx.save();
  ctx.shadowColor = 'rgba(255,255,255,0.34)';
  ctx.shadowBlur = 34;
  const scoreSize = Math.min(220, Math.max(120, state.centerSize * 1.65));
  if (state.scoreMode) {
    drawTextInRect(ctx, state.leftScore || '0', layout.scoreLeft, {
      weight: 900,
      size: scoreSize,
      color: state.centerColor || WHITE,
      align: 'right',
      shadow: true,
    });
    ctx.shadowBlur = 0;
    const dash = layout.scoreDash;
    const dashGradient = ctx.createLinearGradient(dash.x, dash.y, dash.x + dash.width, dash.y);
    dashGradient.addColorStop(0, 'rgba(255,255,255,0.18)');
    dashGradient.addColorStop(0.5, 'rgba(255,255,255,0.7)');
    dashGradient.addColorStop(1, 'rgba(255,255,255,0.18)');
    ctx.fillStyle = dashGradient;
    drawRoundedRect(ctx, dash, 999);
    ctx.fill();
    drawTextInRect(ctx, state.rightScore || '0', layout.scoreRight, {
      weight: 900,
      size: scoreSize,
      color: state.centerColor || WHITE,
      align: 'left',
      shadow: true,
    });
  } else {
    drawTextInRect(ctx, state.vsText || 'VS', layout.centerText, {
      weight: 900,
      size: Math.min(170, Math.max(90, state.centerSize * 1.25)),
      color: VS_FLAME_COLOR,
      letterSpacing: 10,
      shadow: true,
    });
  }
  ctx.restore();
}

function drawMeta(ctx: CanvasRenderingContext2D, state: VSDesignerState, layout: VSLayout) {
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  drawRoundedRect(ctx, { x: 520, y: 830, width: 880, height: 86 }, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(960, 848);
  ctx.lineTo(960, 898);
  ctx.stroke();
  ctx.restore();

  drawTextInRect(ctx, layout.dateStr, { x: 580, y: 846, width: 330, height: 42 }, {
    weight: 800,
    size: 22,
    color: 'rgba(255,255,255,0.82)',
    letterSpacing: 1.2,
    family: BODY_FONT,
  });
  drawTextInRect(ctx, upper(state.venueName, 'NATIONAL STADIUM'), { x: 1010, y: 846, width: 330, height: 42 }, {
    weight: 800,
    size: 22,
    color: 'rgba(255,255,255,0.82)',
    letterSpacing: 1.2,
    family: BODY_FONT,
  });
  drawTextInRect(ctx, upper(state.venueCity, 'FLAGS WING'), { x: 1010, y: 882, width: 330, height: 26 }, {
    weight: 700,
    size: 17,
    color: 'rgba(255,255,255,0.42)',
    letterSpacing: 3,
    family: BODY_FONT,
  });
  drawTextInRect(ctx, upper(state.hashtag, '#MATCHDAY'), layout.hashtag, {
    weight: 900,
    size: 30,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
    family: BODY_FONT,
  });
}

async function drawGroupBanner(ctx: CanvasRenderingContext2D, state: VSDesignerState) {
  const teams = (state.groupTeams?.length ? state.groupTeams : [state.left, state.right]).slice(0, 4);
  const paddedTeams = [...teams];
  while (paddedTeams.length < 4) paddedTeams.push({ name: 'Team', imageUrl: '', type: 'club' });

  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  drawRoundedRect(ctx, { x: 520, y: 150, width: 880, height: 170 }, 28);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, { x: 520, y: 150, width: 880, height: 170 }, 28);
  ctx.stroke();
  ctx.restore();

  drawTextInRect(ctx, state.eventTitle || 'GROUP STAGE', { x: 520, y: 188, width: 880, height: 82 }, {
    weight: 900,
    size: 62,
    color: state.titleColor || WHITE,
    letterSpacing: 5,
    family: BODY_FONT,
    shadow: true,
    offsetX: 12,
    offsetY: -5,
  });
  drawTextInRect(ctx, upper(state.groupName, 'GROUP A'), { x: 690, y: 270, width: 540, height: 44 }, {
    weight: 900,
    size: 30,
    color: 'rgba(255,255,255,0.52)',
    letterSpacing: 8,
    family: BODY_FONT,
  });

  const cardW = 360;
  const cardH = 360;
  const gap = 42;
  const startX = Math.round((CANVAS_WIDTH - cardW * 4 - gap * 3) / 2);
  const y = 420;

  await Promise.all(paddedTeams.map(async (team, index) => {
    const x = startX + index * (cardW + gap);
    ctx.save();
    const cardGradient = ctx.createLinearGradient(x, y, x + cardW, y + cardH);
    cardGradient.addColorStop(0, 'rgba(255,255,255,0.105)');
    cardGradient.addColorStop(1, 'rgba(255,255,255,0.035)');
    ctx.fillStyle = cardGradient;
    ctx.strokeStyle = 'rgba(255,255,255,0.13)';
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, { x, y, width: cardW, height: cardH }, 28);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.26)';
    ctx.fillRect(x + 28, y + 28, 54, 4);
    ctx.fillRect(x + cardW - 82, y + cardH - 32, 54, 4);
    ctx.restore();

    await drawEntityImage(ctx, team, {
      x: x + 70,
      y: y + 54,
      width: cardW - 140,
      height: 180,
    });

    drawTextInRect(ctx, team.name, { x: x + 24, y: y + 252, width: cardW - 48, height: 54 }, {
      weight: 900,
      size: 28,
      minSize: 13,
      color: state.nameColor || WHITE,
      letterSpacing: 1.1,
      family: BODY_FONT,
      shadow: true,
    });
    drawTextInRect(ctx, `POT ${index + 1}`, { x: x + 24, y: y + 310, width: cardW - 48, height: 34 }, {
      weight: 800,
      size: 20,
      color: 'rgba(255,255,255,0.42)',
      letterSpacing: 4,
      family: BODY_FONT,
    });
  }));

  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  drawRoundedRect(ctx, { x: 560, y: 868, width: 800, height: 72 }, 18);
  ctx.fill();
  ctx.restore();
  drawTextInRect(ctx, getDateStr(state), { x: 610, y: 874, width: 330, height: 54 }, {
    weight: 800,
    size: 22,
    color: 'rgba(255,255,255,0.76)',
    letterSpacing: 1.4,
    family: BODY_FONT,
  });
  drawTextInRect(ctx, upper(state.venueName, 'DRAW STUDIO'), { x: 980, y: 874, width: 330, height: 54 }, {
    weight: 800,
    size: 22,
    color: 'rgba(255,255,255,0.76)',
    letterSpacing: 1.4,
    family: BODY_FONT,
  });
  drawTextInRect(ctx, upper(state.hashtag, '#GROUPSTAGE'), { x: 760, y: 982, width: 400, height: 40 }, {
    weight: 900,
    size: 30,
    color: 'rgba(255,255,255,0.62)',
    letterSpacing: 1,
    family: BODY_FONT,
  });
}

function drawCleanBallIcon(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.save();
  ctx.fillStyle = '#2563eb';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.46, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 5; i += 1) {
    const angle = -Math.PI / 2 + i * ((Math.PI * 2) / 5);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * r * 0.82, y + Math.sin(angle) * r * 0.82);
    ctx.stroke();
  }
  ctx.restore();
}

async function drawCleanEntityImage(ctx: CanvasRenderingContext2D, entity: VSEntity, box: Rect) {
  const img = await loadImage(entity.imageUrl);
  ctx.save();
  if (!img) {
    ctx.fillStyle = 'rgba(37,99,235,0.08)';
    drawRoundedRect(ctx, box, 24);
    ctx.fill();
    ctx.restore();
    return;
  }
  ctx.shadowColor = 'rgba(15,23,42,0.14)';
  ctx.shadowBlur = 22;
  ctx.shadowOffsetY = 12;
  const fit = fitContain(img.naturalWidth || img.width, img.naturalHeight || img.height, box);
  ctx.drawImage(img, fit.x, fit.y, fit.width, fit.height);
  ctx.restore();
}

function drawCleanInfoCell(
  ctx: CanvasRenderingContext2D,
  icon: 'calendar' | 'stadium',
  title: string,
  subtitle: string,
  rect: Rect,
) {
  ctx.save();
  const iconX = rect.x + 58;
  const iconY = rect.y + rect.height / 2;
  ctx.strokeStyle = '#2563eb';
  ctx.fillStyle = '#2563eb';
  ctx.lineWidth = 5;
  if (icon === 'calendar') {
    drawRoundedRect(ctx, { x: iconX - 22, y: iconY - 24, width: 44, height: 46 }, 7);
    ctx.stroke();
    ctx.fillRect(iconX - 12, iconY - 33, 5, 14);
    ctx.fillRect(iconX + 8, iconY - 33, 5, 14);
    ctx.fillRect(iconX - 13, iconY - 4, 8, 8);
    ctx.fillRect(iconX + 4, iconY - 4, 8, 8);
    ctx.fillRect(iconX - 13, iconY + 12, 8, 8);
    ctx.fillRect(iconX + 4, iconY + 12, 8, 8);
  } else {
    ctx.beginPath();
    ctx.ellipse(iconX, iconY + 2, 32, 16, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(iconX, iconY + 2, 18, 8, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillRect(iconX - 30, iconY + 18, 60, 5);
  }
  ctx.restore();

  drawTextInRect(ctx, title, { x: rect.x + 110, y: rect.y + 18, width: rect.width - 140, height: 34 }, {
    weight: 900,
    size: 27,
    color: '#172033',
    letterSpacing: 1.2,
    align: 'left',
    family: BODY_FONT,
  });
  drawTextInRect(ctx, subtitle, { x: rect.x + 110, y: rect.y + 52, width: rect.width - 140, height: 34 }, {
    weight: 800,
    size: 22,
    color: '#7b8494',
    letterSpacing: 1.6,
    align: 'left',
    family: BODY_FONT,
  });
}

async function drawCleanMatchdayBanner(ctx: CanvasRenderingContext2D, state: VSDesignerState, layout: VSLayout) {
  const accent = state.titleColor && state.titleColor !== '#FFFFFF' ? state.titleColor : '#2563eb';
  const ink = state.centerColor && state.centerColor !== '#FFFFFF' ? state.centerColor : '#172033';
  const muted = '#7b8494';

  ctx.save();
  const page = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  page.addColorStop(0, '#f8fafc');
  page.addColorStop(1, '#e9eef6');
  ctx.fillStyle = page;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.shadowColor = 'rgba(15,23,42,0.14)';
  ctx.shadowBlur = 42;
  ctx.shadowOffsetY = 20;
  ctx.fillStyle = '#ffffff';
  drawRoundedRect(ctx, { x: 48, y: 50, width: 1824, height: 980 }, 28);
  ctx.fill();
  ctx.restore();

  ctx.save();
  const footer = ctx.createLinearGradient(0, 880, 0, 1030);
  footer.addColorStop(0, 'rgba(248,250,252,0)');
  footer.addColorStop(1, 'rgba(226,232,240,0.92)');
  ctx.fillStyle = footer;
  drawRoundedRect(ctx, { x: 48, y: 50, width: 1824, height: 980 }, 28);
  ctx.fill();
  ctx.restore();

  drawCleanBallIcon(ctx, 792, 130, 25);
  drawTextInRect(ctx, state.eventTitle || 'MATCH DAY', { x: 830, y: 103, width: 430, height: 56 }, {
    weight: 900,
    size: Math.min(48, Math.max(26, state.titleSize * 1.2)),
    color: accent,
    letterSpacing: 10,
    align: 'left',
    family: BODY_FONT,
  });

  ctx.save();
  ctx.fillStyle = 'rgba(37,99,235,0.12)';
  ctx.fillRect(705, 245, 2, 405);
  ctx.fillRect(1213, 245, 2, 405);
  ctx.restore();

  await Promise.all([
    drawCleanEntityImage(ctx, state.left, state.left.type === 'club'
      ? { x: 210, y: 220, width: 380, height: 380 }
      : { x: 145, y: 280, width: 510, height: 320 }),
    drawCleanEntityImage(ctx, state.right, state.right.type === 'club'
      ? { x: 1330, y: 220, width: 380, height: 380 }
      : { x: 1265, y: 280, width: 510, height: 320 }),
  ]);

  const centerLabel = state.scoreMode ? `${state.leftScore || '0'}-${state.rightScore || '0'}` : (state.vsText || 'VS');
  drawTextInRect(ctx, centerLabel, { x: 760, y: 315, width: 400, height: 110 }, {
    weight: 900,
    size: state.scoreMode ? Math.min(110, Math.max(64, state.centerSize * 0.8)) : Math.min(96, Math.max(54, state.centerSize * 0.72)),
    color: state.scoreMode ? ink : VS_FLAME_COLOR,
    letterSpacing: state.scoreMode ? 4 : 2,
    family: BODY_FONT,
    shadow: false,
  });

  ctx.save();
  ctx.fillStyle = accent;
  drawRoundedRect(ctx, { x: 782, y: 455, width: 356, height: 54 }, 10);
  ctx.fill();
  ctx.restore();
  drawTextInRect(ctx, upper(state.statusText, 'KICK OFF'), { x: 782, y: 458, width: 356, height: 48 }, {
    weight: 900,
    size: 26,
    color: '#ffffff',
    letterSpacing: 1.6,
    family: BODY_FONT,
  });

  if (!state.scoreMode) {
    drawTextInRect(ctx, state.dateMode === 'manual' ? upper(state.dateText, '20:00') : '20:00', { x: 790, y: 535, width: 340, height: 66 }, {
      weight: 900,
      size: 54,
      color: ink,
      letterSpacing: 1.2,
      family: BODY_FONT,
    });
    drawTextInRect(ctx, 'LOCAL TIME', { x: 790, y: 600, width: 340, height: 34 }, {
      weight: 800,
      size: 22,
      color: muted,
      letterSpacing: 3,
      family: BODY_FONT,
    });
  }

  drawTextInRect(ctx, state.left.name, { x: 145, y: 635, width: 510, height: 70 }, {
    weight: 900,
    size: Math.min(58, Math.max(34, state.nameSize * 1.45)),
    color: state.nameColor && state.nameColor !== '#CCCCCC' ? state.nameColor : ink,
    letterSpacing: 2,
    family: BODY_FONT,
  });
  drawTextInRect(ctx, state.left.type === 'club' ? 'CLUB' : 'COUNTRY', { x: 145, y: 700, width: 510, height: 42 }, {
    weight: 800,
    size: 22,
    color: muted,
    letterSpacing: 2.5,
    family: BODY_FONT,
  });
  drawTextInRect(ctx, state.right.name, { x: 1265, y: 635, width: 510, height: 70 }, {
    weight: 900,
    size: Math.min(58, Math.max(34, state.nameSize * 1.45)),
    color: state.nameColor && state.nameColor !== '#CCCCCC' ? state.nameColor : ink,
    letterSpacing: 2,
    family: BODY_FONT,
  });
  drawTextInRect(ctx, state.right.type === 'club' ? 'CLUB' : 'COUNTRY', { x: 1265, y: 700, width: 510, height: 42 }, {
    weight: 800,
    size: 22,
    color: muted,
    letterSpacing: 2.5,
    family: BODY_FONT,
  });

  ctx.save();
  ctx.strokeStyle = 'rgba(37,99,235,0.16)';
  ctx.fillStyle = 'rgba(255,255,255,0.82)';
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, { x: 240, y: 760, width: 1440, height: 128 }, 14);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(37,99,235,0.12)';
  ctx.fillRect(958, 790, 2, 70);
  ctx.restore();

  const dateValue = state.dateMode === 'manual' ? upper(state.dateText, layout.dateStr) : layout.dateStr;
  const dateParts = dateValue.split(',');
  drawCleanInfoCell(ctx, 'calendar', dateParts[0] || dateValue, dateParts.slice(1).join(',').trim() || dateValue, {
    x: 355,
    y: 780,
    width: 500,
    height: 86,
  });
  drawCleanInfoCell(ctx, 'stadium', upper(state.venueName, 'NATIONAL STADIUM'), upper(state.venueCity, 'FLAGS WING'), {
    x: 1045,
    y: 780,
    width: 520,
    height: 86,
  });

  drawTextInRect(ctx, upper(state.hashtag, '#MATCHDAY'), { x: 760, y: 940, width: 400, height: 44 }, {
    weight: 900,
    size: 26,
    color: accent,
    letterSpacing: 2,
    family: BODY_FONT,
  });
}
export async function renderVSDesignToCanvas(state: VSDesignerState, scale = 1): Promise<HTMLCanvasElement> {
  const layout = getLayout(state);
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH * scale;
  canvas.height = CANVAS_HEIGHT * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.scale(scale, scale);
  if (state.backgroundStyle === 'clean' && state.template !== 'group') {
    await drawCleanMatchdayBanner(ctx, state, layout);
    return canvas;
  }
  await drawBackground(ctx, state);

  if (state.template === 'group') {
    await drawGroupBanner(ctx, state);
    return canvas;
  }

  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  drawRoundedRect(ctx, { x: 720, y: 214, width: 480, height: 104 }, 24);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, { x: 720, y: 214, width: 480, height: 104 }, 24);
  ctx.stroke();
  ctx.restore();

  await Promise.all([
    drawEntityImage(ctx, state.left, layout.leftImage),
    drawEntityImage(ctx, state.right, layout.rightImage),
  ]);

  drawTextInRect(ctx, state.eventTitle || 'MATCHDAY', layout.title, {
    weight: 900,
    size: Math.min(62, Math.max(30, state.titleSize * 1.28)),
    color: state.titleColor || WHITE,
    letterSpacing: 5,
    family: BODY_FONT,
    shadow: true,
    offsetX: 14,
    offsetY: -7,
  });

  drawScore(ctx, state, layout);
  drawStatusRibbon(ctx, layout.status, upper(state.statusText, 'FULL TIME'));

  drawTextInRect(ctx, state.left.name, layout.leftName, {
    weight: 900,
    size: Math.min(62, Math.max(34, state.nameSize * 1.45)),
    color: state.nameColor || WHITE,
    letterSpacing: 6,
    family: BODY_FONT,
  });
  drawTextInRect(ctx, state.right.name, layout.rightName, {
    weight: 900,
    size: Math.min(62, Math.max(34, state.nameSize * 1.45)),
    color: state.nameColor || WHITE,
    letterSpacing: 6,
    family: BODY_FONT,
  });
  drawMeta(ctx, state, layout);

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
