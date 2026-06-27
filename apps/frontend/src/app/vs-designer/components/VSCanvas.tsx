'use client';

import { forwardRef } from 'react';
import type { VSDesignerState } from '@/lib/vs-designer-types';

const FONT = '"Arial Black", "Arial Bold", system-ui, -apple-system, Arial, sans-serif';
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
  const scoreTop = scoreCenterY - state.centerSize * 0.55;
  const scoreHeight = state.centerSize * 1.15;
  const dateTop = scoreTop + scoreHeight + 46;
  const titleTop = scoreTop - state.titleSize * 1.6 - 48;

  return (
    <div
      ref={ref}
      style={{
        width: 1920,
        height: 1080,
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
        background: `radial-gradient(ellipse 60% 60% at 50% 50%, rgba(255,255,255,0.04) 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* Vertical divider */}
      <div style={{
        position: 'absolute', left: '50%', top: '10%', height: '80%',
        width: 1, background: 'rgba(255,255,255,0.08)',
        transform: 'translateX(-50%)',
      }} />

      {/* ─── LEFT ──── */}
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

      {/* ─── CENTER ── */}
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
          fontSize: state.titleSize, color: state.titleColor, fontWeight: 800,
          letterSpacing: 7, textTransform: 'uppercase', textAlign: 'center',
          fontFamily: FONT, lineHeight: 1.2,
        }}>
          {state.eventTitle}
        </span>

        {/* Score or VS */}
        {state.scoreMode ? (
          <div style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: scoreTop,
            height: scoreHeight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0,
          }}>
            {/* Left score */}
            <span style={{
              fontSize: state.centerSize,
              color: state.centerColor,
              fontWeight: 900,
              fontFamily: FONT,
              minWidth: '1.4ch',
              textAlign: 'right',
              letterSpacing: -4,
              lineHeight: 0.9,
              display: 'inline-block',
              fontVariantNumeric: 'tabular-nums',
              textShadow: `0 0 60px ${state.centerColor}cc, 0 0 120px ${state.centerColor}66`,
            }}>
              {state.leftScore || '0'}
            </span>

            {/* Separator */}
            <span style={{
              fontSize: state.centerSize * 0.45,
              color: state.centerColor,
              fontWeight: 200,
              fontFamily: FONT,
              opacity: 0.28,
              padding: `0 ${state.centerSize * 0.18}px`,
              letterSpacing: 0,
              lineHeight: 1,
              display: 'inline-block',
            }}>
              —
            </span>

            {/* Right score */}
            <span style={{
              fontSize: state.centerSize,
              color: state.centerColor,
              fontWeight: 900,
              fontFamily: FONT,
              minWidth: '1.4ch',
              textAlign: 'left',
              letterSpacing: -4,
              lineHeight: 0.9,
              display: 'inline-block',
              fontVariantNumeric: 'tabular-nums',
              textShadow: `0 0 60px ${state.centerColor}cc, 0 0 120px ${state.centerColor}66`,
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: state.centerSize,
            color: state.centerColor,
            fontWeight: 900,
            letterSpacing: 14,
            fontFamily: FONT,
            lineHeight: 0.9,
            textShadow: `0 0 50px ${state.centerColor}cc, 0 0 100px ${state.centerColor}55`,
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
            fontSize: 20, color: state.dateColor, fontWeight: 500,
            letterSpacing: 4, textAlign: 'center', textTransform: 'uppercase',
            fontFamily: FONT, lineHeight: 1.5,
          }}>
            {dateStr}
          </span>
        ) : null}
      </div>

      {/* ─── RIGHT ─── */}
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
