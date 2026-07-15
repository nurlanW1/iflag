'use client';

import { forwardRef, useEffect, useRef } from 'react';
import type { VSEntity, VSDesignerState } from '@/lib/vs-designer-types';

const FONT_FAMILY = '"Impact", "Arial Black", "Arial Bold", Arial, system-ui, sans-serif';
const BODY_FONT = '"Arial Black", "Arial Bold", Arial, system-ui, sans-serif';
const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;
const GOLD = '#f4c95b';
const GOLD_DARK = '#9a6617';
const WHITE = '#fffaf0';

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
  },
) {
  ctx.save();
  setFont(ctx, opts.weight, opts.size, opts.family);
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
  const x = align === 'left' ? rect.x : align === 'right' ? rect.x + rect.width : rect.x + rect.width / 2;
  drawSpacedText(ctx, upper(text), x, rect.y + rect.height / 2, {
    align,
    letterSpacing: opts.letterSpacing ?? 0,
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

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outer: number, inner: number) {
  let rot = Math.PI / 2 * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;
  ctx.beginPath();
  ctx.moveTo(cx, cy - outer);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outer;
    y = cy + Math.sin(rot) * outer;
    ctx.lineTo(x, y);
    rot += step;
    x = cx + Math.cos(rot) * inner;
    y = cy + Math.sin(rot) * inner;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outer);
  ctx.closePath();
}

function drawTrophy(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  const grad = ctx.createLinearGradient(-40, -70, 40, 80);
  grad.addColorStop(0, '#fff0a5');
  grad.addColorStop(0.45, GOLD);
  grad.addColorStop(1, GOLD_DARK);
  ctx.fillStyle = grad;
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(-36, -52);
  ctx.lineTo(36, -52);
  ctx.quadraticCurveTo(30, 28, 0, 40);
  ctx.quadraticCurveTo(-30, 28, -36, -52);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(-42, -32, 24, Math.PI * 0.55, Math.PI * 1.45, false);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 8;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(42, -32, 24, Math.PI * 1.55, Math.PI * 0.45, false);
  ctx.stroke();

  ctx.fillRect(-8, 40, 16, 28);
  ctx.fillRect(-34, 68, 68, 12);
  ctx.fillRect(-48, 80, 96, 12);
  ctx.restore();
}

function drawLineOrnament(ctx: CanvasRenderingContext2D, y: number) {
  ctx.save();
  ctx.strokeStyle = GOLD;
  ctx.fillStyle = GOLD;
  ctx.globalAlpha = 0.95;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(720, y);
  ctx.lineTo(820, y);
  ctx.moveTo(1100, y);
  ctx.lineTo(1200, y);
  ctx.stroke();
  drawStar(ctx, 704, y, 4, 12, 4);
  drawStar(ctx, 1216, y, 4, 12, 4);
  ctx.fill();
  ctx.restore();
}

function drawCalendarIcon(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.strokeStyle = GOLD;
  ctx.fillStyle = GOLD;
  ctx.lineWidth = 5;
  drawRoundedRect(ctx, { x, y, width: 54, height: 54 }, 8);
  ctx.stroke();
  ctx.fillRect(x + 10, y + 17, 34, 5);
  ctx.fillRect(x + 14, y + 30, 7, 7);
  ctx.fillRect(x + 29, y + 30, 7, 7);
  ctx.fillRect(x + 14, y + 42, 7, 7);
  ctx.fillRect(x + 29, y + 42, 7, 7);
  ctx.restore();
}

function drawStadiumIcon(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.strokeStyle = GOLD;
  ctx.fillStyle = GOLD;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(x + 32, y + 30, 38, 20, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x + 32, y + 30, 22, 10, 0, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 5; i++) {
    const px = x + 8 + i * 12;
    ctx.beginPath();
    ctx.moveTo(px, y + 7);
    ctx.lineTo(px, y + 20);
    ctx.stroke();
    drawStar(ctx, px, y + 4, 4, 4, 2);
    ctx.fill();
  }
  ctx.restore();
}

async function drawBackground(ctx: CanvasRenderingContext2D, state: VSDesignerState) {
  ctx.fillStyle = state.bgColor;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  if (state.backgroundStyle === 'image' && state.backgroundImageUrl) {
    const bg = await loadImage(state.backgroundImageUrl);
    if (bg) {
      const fit = fitCover(bg.naturalWidth || bg.width, bg.naturalHeight || bg.height, {
        x: 0,
        y: 0,
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
      });
      ctx.drawImage(bg, fit.x, fit.y, fit.width, fit.height);
    }
  }

  const main = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  main.addColorStop(0, state.backgroundStyle === 'image' ? 'rgba(7,12,28,0.58)' : 'rgba(247,236,198,0.78)');
  main.addColorStop(0.28, 'rgba(25,40,82,0.88)');
  main.addColorStop(0.56, 'rgba(7,21,57,0.94)');
  main.addColorStop(0.78, 'rgba(63,19,86,0.9)');
  main.addColorStop(1, 'rgba(185,12,54,0.84)');
  ctx.fillStyle = main;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  if (state.backgroundStyle === 'stadium') {
    ctx.save();
    const pitch = ctx.createLinearGradient(0, 740, 0, 1080);
    pitch.addColorStop(0, 'rgba(6,60,40,0)');
    pitch.addColorStop(1, 'rgba(11,105,60,0.36)');
    ctx.fillStyle = pitch;
    ctx.fillRect(0, 660, CANVAS_WIDTH, 420);
    ctx.strokeStyle = 'rgba(255,255,255,0.11)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(960, 960, 320, 82, 0, Math.PI, 0);
    ctx.moveTo(0, 880);
    ctx.lineTo(CANVAS_WIDTH, 880);
    ctx.stroke();
    for (const x of [230, 520, 1400, 1690]) {
      const light = ctx.createRadialGradient(x, 118, 0, x, 118, 360);
      light.addColorStop(0, 'rgba(255,244,200,0.32)');
      light.addColorStop(0.4, 'rgba(255,244,200,0.08)');
      light.addColorStop(1, 'rgba(255,244,200,0)');
      ctx.fillStyle = light;
      ctx.fillRect(x - 380, 0, 760, 520);
    }
    ctx.restore();
  }

  const center = ctx.createRadialGradient(960, 500, 0, 960, 500, 580);
  center.addColorStop(0, 'rgba(255,255,255,0.16)');
  center.addColorStop(0.38, 'rgba(33,63,118,0.22)');
  center.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = center;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const leftGlow = ctx.createRadialGradient(250, 460, 0, 250, 460, 520);
  leftGlow.addColorStop(0, 'rgba(255,231,142,0.28)');
  leftGlow.addColorStop(1, 'rgba(255,231,142,0)');
  ctx.fillStyle = leftGlow;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const rightGlow = ctx.createRadialGradient(1650, 460, 0, 1650, 460, 520);
  rightGlow.addColorStop(0, 'rgba(255,28,88,0.28)');
  rightGlow.addColorStop(1, 'rgba(255,28,88,0)');
  ctx.fillStyle = rightGlow;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = 'rgba(255,255,255,0.055)';
  ctx.fillRect(CANVAS_WIDTH / 2 - 0.5, 110, 1, 860);
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
  ctx.strokeStyle = GOLD;
  ctx.fillStyle = 'rgba(5,15,45,0.42)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(rect.x + 70, rect.y + 8);
  ctx.lineTo(rect.x + rect.width - 70, rect.y + 8);
  ctx.lineTo(rect.x + rect.width - 118, rect.y + rect.height - 8);
  ctx.lineTo(rect.x + 118, rect.y + rect.height - 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.shadowColor = GOLD;
  ctx.shadowBlur = 18;
  ctx.fillStyle = GOLD;
  ctx.fillRect(rect.x + 250, rect.y + 7, 160, 3);
  ctx.fillRect(rect.x + 250, rect.y + rect.height - 10, 160, 3);
  ctx.restore();

  drawTextInRect(ctx, label, rect, {
    weight: 900,
    size: 48,
    color: GOLD,
    letterSpacing: 12,
    family: BODY_FONT,
    shadow: true,
  });
}

function drawScore(ctx: CanvasRenderingContext2D, state: VSDesignerState, layout: VSLayout) {
  ctx.save();
  ctx.shadowColor = 'rgba(255,255,255,0.42)';
  ctx.shadowBlur = 26;
  const scoreSize = Math.min(220, Math.max(120, state.centerSize * 1.65));
  if (state.scoreMode) {
    drawTextInRect(ctx, state.leftScore || '0', layout.scoreLeft, {
      weight: 900,
      size: scoreSize,
      color: state.centerColor || WHITE,
      strokeColor: GOLD,
      strokeWidth: 4,
      align: 'right',
      shadow: true,
    });
    ctx.shadowBlur = 0;
    const dash = layout.scoreDash;
    const dashGradient = ctx.createLinearGradient(dash.x, dash.y, dash.x + dash.width, dash.y);
    dashGradient.addColorStop(0, 'rgba(255,255,255,0.25)');
    dashGradient.addColorStop(0.5, GOLD);
    dashGradient.addColorStop(1, 'rgba(255,255,255,0.25)');
    ctx.fillStyle = dashGradient;
    drawRoundedRect(ctx, dash, 999);
    ctx.fill();
    drawTextInRect(ctx, state.rightScore || '0', layout.scoreRight, {
      weight: 900,
      size: scoreSize,
      color: state.centerColor || WHITE,
      strokeColor: GOLD,
      strokeWidth: 4,
      align: 'left',
      shadow: true,
    });
  } else {
    drawTextInRect(ctx, state.vsText || 'VS', layout.centerText, {
      weight: 900,
      size: Math.min(170, Math.max(90, state.centerSize * 1.25)),
      color: state.centerColor || WHITE,
      strokeColor: GOLD,
      strokeWidth: 4,
      letterSpacing: 10,
      shadow: true,
    });
  }
  ctx.restore();
}

function drawMeta(ctx: CanvasRenderingContext2D, state: VSDesignerState, layout: VSLayout) {
  drawCalendarIcon(ctx, 575, 835);
  drawStadiumIcon(ctx, 1028, 835);

  drawTextInRect(ctx, layout.dateStr, layout.date, {
    weight: 800,
    size: 24,
    color: WHITE,
    letterSpacing: 1.5,
    align: 'left',
    family: BODY_FONT,
  });
  drawTextInRect(ctx, upper(state.venueName, 'NATIONAL STADIUM'), layout.venue, {
    weight: 800,
    size: 24,
    color: WHITE,
    letterSpacing: 1.5,
    align: 'left',
    family: BODY_FONT,
  });
  drawTextInRect(ctx, upper(state.venueCity, 'FLAGS WING'), { x: layout.venue.x, y: layout.venue.y + 36, width: layout.venue.width, height: 32 }, {
    weight: 700,
    size: 19,
    color: GOLD,
    letterSpacing: 2.5,
    align: 'left',
    family: BODY_FONT,
  });

  ctx.save();
  ctx.strokeStyle = GOLD;
  ctx.globalAlpha = 0.95;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(1068, 835);
  ctx.lineTo(1068, 900);
  ctx.stroke();
  ctx.restore();

  drawLineOrnament(ctx, 984);
  drawTextInRect(ctx, upper(state.hashtag, '#MATCHDAY'), layout.hashtag, {
    weight: 900,
    size: 36,
    color: WHITE,
    letterSpacing: 1,
    family: BODY_FONT,
  });
}

async function drawGroupBanner(ctx: CanvasRenderingContext2D, state: VSDesignerState) {
  const teams = (state.groupTeams?.length ? state.groupTeams : [state.left, state.right]).slice(0, 4);
  const paddedTeams = [...teams];
  while (paddedTeams.length < 4) paddedTeams.push({ name: 'Team', imageUrl: '', type: 'club' });

  ctx.save();
  ctx.fillStyle = GOLD;
  for (const [x, y, r] of [
    [892, 105, 9],
    [922, 88, 12],
    [960, 76, 17],
    [998, 88, 12],
    [1028, 105, 9],
  ]) {
    drawStar(ctx, x, y, 5, r, r * 0.43);
    ctx.fill();
  }
  ctx.restore();
  drawTrophy(ctx, 960, 155, 0.78);
  drawLineOrnament(ctx, 250);

  drawTextInRect(ctx, state.eventTitle || 'GROUP STAGE', { x: 520, y: 235, width: 880, height: 82 }, {
    weight: 900,
    size: 62,
    color: state.titleColor || WHITE,
    letterSpacing: 5,
    family: BODY_FONT,
    shadow: true,
  });
  drawTextInRect(ctx, upper(state.groupName, 'GROUP A'), { x: 690, y: 318, width: 540, height: 56 }, {
    weight: 900,
    size: 38,
    color: GOLD,
    letterSpacing: 7,
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
    cardGradient.addColorStop(0, 'rgba(255,255,255,0.13)');
    cardGradient.addColorStop(1, 'rgba(255,255,255,0.035)');
    ctx.fillStyle = cardGradient;
    ctx.strokeStyle = 'rgba(244,201,91,0.45)';
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, { x, y, width: cardW, height: cardH }, 28);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(244,201,91,0.95)';
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
      size: 32,
      color: state.nameColor || WHITE,
      letterSpacing: 2.5,
      family: BODY_FONT,
      shadow: true,
    });
    drawTextInRect(ctx, `POT ${index + 1}`, { x: x + 24, y: y + 310, width: cardW - 48, height: 34 }, {
      weight: 800,
      size: 20,
      color: GOLD,
      letterSpacing: 4,
      family: BODY_FONT,
    });
  }));

  drawCalendarIcon(ctx, 628, 875);
  drawStadiumIcon(ctx, 1010, 875);
  drawTextInRect(ctx, getDateStr(state), { x: 704, y: 872, width: 290, height: 60 }, {
    weight: 800,
    size: 24,
    color: WHITE,
    letterSpacing: 1.4,
    align: 'left',
    family: BODY_FONT,
  });
  drawTextInRect(ctx, upper(state.venueName, 'DRAW STUDIO'), { x: 1090, y: 872, width: 430, height: 60 }, {
    weight: 800,
    size: 24,
    color: WHITE,
    letterSpacing: 1.4,
    align: 'left',
    family: BODY_FONT,
  });
  drawLineOrnament(ctx, 1000);
  drawTextInRect(ctx, upper(state.hashtag, '#GROUPSTAGE'), { x: 760, y: 982, width: 400, height: 40 }, {
    weight: 900,
    size: 34,
    color: WHITE,
    letterSpacing: 1,
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
  await drawBackground(ctx, state);

  if (state.template === 'group') {
    await drawGroupBanner(ctx, state);
    return canvas;
  }

  ctx.save();
  ctx.fillStyle = GOLD;
  const stars = [
    [892, 132, 9],
    [922, 116, 12],
    [960, 104, 17],
    [998, 116, 12],
    [1028, 132, 9],
  ];
  for (const [x, y, r] of stars) {
    drawStar(ctx, x, y, 5, r, r * 0.43);
    ctx.fill();
  }
  ctx.restore();
  drawTrophy(ctx, 960, 185, 0.95);

  drawLineOrnament(ctx, 305);

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
  });

  drawScore(ctx, state, layout);
  drawStatusRibbon(ctx, layout.status, upper(state.statusText, 'FULL TIME'));

  drawTextInRect(ctx, state.left.name, layout.leftName, {
    weight: 900,
    size: Math.min(62, Math.max(34, state.nameSize * 1.45)),
    color: state.nameColor || WHITE,
    letterSpacing: 4,
    family: BODY_FONT,
    strokeColor: 'rgba(0,0,0,0.18)',
    strokeWidth: 2,
  });
  drawTextInRect(ctx, state.right.name, layout.rightName, {
    weight: 900,
    size: Math.min(62, Math.max(34, state.nameSize * 1.45)),
    color: state.nameColor || WHITE,
    letterSpacing: 4,
    family: BODY_FONT,
    strokeColor: 'rgba(0,0,0,0.18)',
    strokeWidth: 2,
  });
  drawTextInRect(ctx, state.left.type === 'club' ? 'HOME SIDE' : 'COUNTRY FLAG', layout.leftTagline, {
    weight: 700,
    size: 26,
    color: GOLD,
    letterSpacing: 7,
    family: BODY_FONT,
  });
  drawTextInRect(ctx, state.right.type === 'club' ? 'AWAY SIDE' : 'COUNTRY FLAG', layout.rightTagline, {
    weight: 700,
    size: 26,
    color: GOLD,
    letterSpacing: 7,
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
