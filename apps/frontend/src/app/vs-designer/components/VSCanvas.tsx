'use client';

import { forwardRef } from 'react';
import type { VSDesignerState } from '@/lib/vs-designer-types';

const FONT = '"Arial Black", "Arial Bold", system-ui, -apple-system, Arial, sans-serif';
const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;
const CENTER_COLUMN_WIDTH = CANVAS_WIDTH * 0.24;

const SIDE_IMAGE_STYLE = {
  width: 510,
  height: 340,
  objectFit: 'contain',
  filter: 'drop-shadow(0 12px 48px rgba(0,0,0,0.6))',
  display: 'block',
  flex: '0 0 auto',
} as const;

const CLUB_IMAGE_STYLE = {
  ...SIDE_IMAGE_STYLE,
  width: 300,
  height: 300,
} as const;

function getDateStr(s: VSDesignerState): string {
  if (s.dateMode === 'manual') return s.dateText;
  return new Date()
    .toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    .toUpperCase();
}

const VSCanvas = forwardRef<HTMLDivElement, VSDesignerState>((state, ref) => {
  const dateStr = getDateStr(state);
  const scoreCenterY = 485;
  const scoreHeight = Math.round(state.centerSize * 1.04);
  const scoreTop = Math.round(scoreCenterY - scoreHeight / 2);
  const scoreLineWidth = Math.round(state.centerSize * 0.32);
  const scoreLineHeight = Math.max(3, Math.round(state.centerSize * 0.035));
  const scoreNumberWidth = Math.round(state.centerSize * 1.08);
  const scoreGap = Math.round(state.centerSize * 0.06);
  const scoreGroupWidth = (scoreNumberWidth * 2) + scoreLineWidth + (scoreGap * 2);
  const scoreGroupLeft = Math.round((CENTER_COLUMN_WIDTH - scoreGroupWidth) / 2);
  const scoreLineTop = Math.round(scoreCenterY - scoreLineHeight / 2);
  const dateHeight = 34;
  const dateCenterY = Math.round(scoreCenterY + state.centerSize * 0.6 + 61);
  const dateTop = Math.round(dateCenterY - dateHeight / 2);
  const titleHeight = Math.round(state.titleSize * 1.24);
  const titleTop = Math.round(scoreTop - titleHeight - 48);

  return (
    <div
      ref={ref}
      style={{
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        backgroundColor: state.bgColor,
        display: 'flex',
        alignItems: 'stretch',
        overflow: 'hidden',
        position: 'relative',
        transformOrigin: 'top left',
      }}
    >
      {/* Subtle ambient glow */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(255,255,255,0.04) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Vertical divider */}
      <div style={{
        position: 'absolute', left: '50%', top: '10%', height: '80%',
        width: 1, background: 'rgba(255,255,255,0.08)',
        transform: 'translateX(-50%)',
      }} />

      {/* LEFT */}
      <div style={{
        width: '38%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 44, padding: '60px 70px',
      }}>
        {state.left.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={state.left.imageUrl} alt={state.left.name} crossOrigin="anonymous"
            style={state.left.type === 'club' ? CLUB_IMAGE_STYLE : SIDE_IMAGE_STYLE}
          />
        ) : (
          <div style={{ width: 510, height: 340, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }} />
        )}
        <span style={{
          fontSize: state.nameSize, color: state.nameColor, fontWeight: 900,
          letterSpacing: 6, textAlign: 'center', textTransform: 'uppercase',
          fontFamily: FONT, lineHeight: 1.2,
        }}>
          {state.left.name}
        </span>
      </div>

      {/* CENTER */}
      <div style={{
        width: '24%',
        flex: '0 0 24%',
        height: '100%',
        position: 'relative',
        display: 'block',
      }}>
        {/* Event title */}
        <span style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: titleTop,
          height: titleHeight,
          display: 'block',
          fontSize: state.titleSize, color: state.titleColor, fontWeight: 800,
          letterSpacing: 7, textTransform: 'uppercase', textAlign: 'center',
          fontFamily: FONT, lineHeight: `${titleHeight}px`,
          whiteSpace: 'nowrap',
        }}>
          {state.eventTitle}
        </span>

        {/* Score or VS */}
        {state.scoreMode ? (
          <div style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: '100%',
            display: 'block',
            filter: `drop-shadow(0 0 46px ${state.centerColor}cc) drop-shadow(0 0 92px ${state.centerColor}66)`,
          }}>
            <span style={{
              position: 'absolute',
              left: scoreGroupLeft,
              top: scoreTop,
              width: scoreNumberWidth,
              height: scoreHeight,
              display: 'block',
              fontSize: state.centerSize,
              color: state.centerColor,
              fontWeight: 900,
              fontFamily: FONT,
              lineHeight: `${scoreHeight}px`,
              textAlign: 'right',
              letterSpacing: -4,
              fontVariantNumeric: 'tabular-nums',
              whiteSpace: 'nowrap',
            }}>
              {state.leftScore || '0'}
            </span>
            <span style={{
              position: 'absolute',
              left: scoreGroupLeft + scoreNumberWidth + scoreGap,
              top: scoreLineTop,
              width: scoreLineWidth,
              height: scoreLineHeight,
              display: 'block',
              borderRadius: 999,
              backgroundColor: state.centerColor,
              opacity: 0.28,
            }} />
            <span style={{
              position: 'absolute',
              left: scoreGroupLeft + scoreNumberWidth + scoreGap + scoreLineWidth + scoreGap,
              top: scoreTop,
              width: scoreNumberWidth,
              height: scoreHeight,
              display: 'block',
              fontSize: state.centerSize,
              color: state.centerColor,
              fontWeight: 900,
              fontFamily: FONT,
              lineHeight: `${scoreHeight}px`,
              textAlign: 'left',
              letterSpacing: -4,
              fontVariantNumeric: 'tabular-nums',
              whiteSpace: 'nowrap',
            }}>
              {state.rightScore || '0'}
            </span>
          </div>
        ) : (
          <span style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: scoreTop,
            height: scoreHeight,
            display: 'block',
            fontSize: state.centerSize,
            color: state.centerColor,
            fontWeight: 900,
            letterSpacing: 14,
            fontFamily: FONT,
            lineHeight: `${scoreHeight}px`,
            textAlign: 'center',
            textShadow: `0 0 50px ${state.centerColor}cc, 0 0 100px ${state.centerColor}55`,
            whiteSpace: 'nowrap',
          }}>
            {state.vsText}
          </span>
        )}

        {/* Date */}
        {dateStr ? (
          <span style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: dateTop,
            height: dateHeight,
            display: 'block',
            fontSize: 20, color: state.dateColor, fontWeight: 500,
            letterSpacing: 4, textAlign: 'center', textTransform: 'uppercase',
            fontFamily: FONT, lineHeight: `${dateHeight}px`,
            whiteSpace: 'nowrap',
          }}>
            {dateStr}
          </span>
        ) : null}
      </div>

      {/* RIGHT */}
      <div style={{
        width: '38%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 44, padding: '60px 70px',
      }}>
        {state.right.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={state.right.imageUrl} alt={state.right.name} crossOrigin="anonymous"
            style={state.right.type === 'club' ? CLUB_IMAGE_STYLE : SIDE_IMAGE_STYLE}
          />
        ) : (
          <div style={{ width: 510, height: 340, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }} />
        )}
        <span style={{
          fontSize: state.nameSize, color: state.nameColor, fontWeight: 900,
          letterSpacing: 6, textAlign: 'center', textTransform: 'uppercase',
          fontFamily: FONT, lineHeight: 1.2,
        }}>
          {state.right.name}
        </span>
      </div>
    </div>
  );
});

VSCanvas.displayName = 'VSCanvas';
export default VSCanvas;
