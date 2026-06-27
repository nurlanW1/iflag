'use client';

import { forwardRef } from 'react';
import type { VSDesignerState } from '@/lib/vs-designer-types';

const FONT = '"Arial Black", "Arial Bold", system-ui, -apple-system, Arial, sans-serif';

function getDateStr(s: VSDesignerState): string {
  if (s.dateMode === 'manual') return s.dateText;
  return new Date()
    .toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    .toUpperCase();
}

const VSCanvas = forwardRef<HTMLDivElement, VSDesignerState>((state, ref) => {
  const dateStr = getDateStr(state);

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
            style={{
              width: state.left.type === 'club' ? 300 : 510,
              height: state.left.type === 'club' ? 300 : 340,
              objectFit: 'contain',
              filter: 'drop-shadow(0 12px 48px rgba(0,0,0,0.6))',
              display: 'block',
            }}
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
        width: '24%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 20, padding: '40px 16px',
      }}>
        {/* Event title */}
        <span style={{
          fontSize: state.titleSize, color: state.titleColor, fontWeight: 800,
          letterSpacing: 7, textTransform: 'uppercase', textAlign: 'center',
          fontFamily: FONT, lineHeight: 1.3,
        }}>
          {state.eventTitle}
        </span>

        {/* Score or VS */}
        {state.scoreMode ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
            {/* Left score */}
            <span style={{
              fontSize: state.centerSize,
              color: state.centerColor,
              fontWeight: 900,
              fontFamily: FONT,
              minWidth: '1.4ch',
              textAlign: 'right',
              letterSpacing: -4,
              lineHeight: 1,
              display: 'inline-block',
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
              lineHeight: 1,
              display: 'inline-block',
              textShadow: `0 0 60px ${state.centerColor}cc, 0 0 120px ${state.centerColor}66`,
            }}>
              {state.rightScore || '0'}
            </span>
          </div>
        ) : (
          <span style={{
            fontSize: state.centerSize,
            color: state.centerColor,
            fontWeight: 900,
            letterSpacing: 14,
            fontFamily: FONT,
            lineHeight: 1,
            textShadow: `0 0 50px ${state.centerColor}cc, 0 0 100px ${state.centerColor}55`,
          }}>
            {state.vsText}
          </span>
        )}

        {/* Date */}
        {dateStr ? (
          <span style={{
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
            style={{
              width: state.right.type === 'club' ? 300 : 510,
              height: state.right.type === 'club' ? 300 : 340,
              objectFit: 'contain',
              filter: 'drop-shadow(0 12px 48px rgba(0,0,0,0.6))',
              display: 'block',
            }}
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
