'use client';

import { forwardRef } from 'react';
import type { VSDesignerState } from '@/lib/vs-designer-types';

const FONT = 'system-ui, -apple-system, Arial Black, Arial, sans-serif';

function getDateStr(state: VSDesignerState): string {
  if (state.dateMode === 'manual') return state.dateText;
  return new Date()
    .toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    .toUpperCase();
}

const VSCanvas = forwardRef<HTMLDivElement, VSDesignerState>(
  (state, ref) => {
    const dateStr = getDateStr(state);
    const showScore = state.scoreMode;

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
        {/* Subtle center radial glow */}
        <div style={{
          position: 'absolute', left: '50%', top: '50%',
          transform: 'translate(-50%,-50%)',
          width: 900, height: 900, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />

        {/* Vertical divider */}
        <div style={{
          position: 'absolute', left: '50%', top: '7%', height: '86%',
          width: 1, background: 'rgba(255,255,255,0.08)',
          transform: 'translateX(-50%)',
        }} />

        {/* ─── LEFT ENTITY ───────────────────── */}
        <div style={{
          width: '38%', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 44, padding: '60px 70px',
        }}>
          {state.left.imageUrl
            ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={state.left.imageUrl} alt={state.left.name} crossOrigin="anonymous"
                style={{
                  width: state.left.type === 'club' ? 280 : 500,
                  height: state.left.type === 'club' ? 280 : 334,
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 10px 40px rgba(0,0,0,0.55))',
                  display: 'block',
                }}
              />
            )
            : <div style={{ width: 500, height: 334, background: 'rgba(255,255,255,0.06)', borderRadius: 8 }} />
          }
          <span style={{
            fontSize: state.nameSize, color: state.nameColor, fontWeight: 800,
            letterSpacing: 5, textAlign: 'center', textTransform: 'uppercase',
            fontFamily: FONT, lineHeight: 1.2,
          }}>
            {state.left.name}
          </span>
        </div>

        {/* ─── CENTER ────────────────────────── */}
        <div style={{
          width: '24%', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 24, padding: '40px 20px',
        }}>
          {/* Event title */}
          <span style={{
            fontSize: state.titleSize, color: state.titleColor, fontWeight: 800,
            letterSpacing: 6, textTransform: 'uppercase', textAlign: 'center',
            fontFamily: FONT, lineHeight: 1.2,
          }}>
            {state.eventTitle}
          </span>

          {/* Score or VS */}
          {showScore ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 16, lineHeight: 1,
            }}>
              <span style={{
                fontSize: state.centerSize, color: state.centerColor, fontWeight: 900,
                fontFamily: FONT,
                filter: `drop-shadow(0 0 30px ${state.centerColor}88)`,
              }}>
                {state.leftScore || '0'}
              </span>
              <span style={{
                fontSize: state.centerSize * 0.55, color: state.centerColor,
                fontWeight: 300, opacity: 0.5, fontFamily: FONT,
              }}>
                —
              </span>
              <span style={{
                fontSize: state.centerSize, color: state.centerColor, fontWeight: 900,
                fontFamily: FONT,
                filter: `drop-shadow(0 0 30px ${state.centerColor}88)`,
              }}>
                {state.rightScore || '0'}
              </span>
            </div>
          ) : (
            <span style={{
              fontSize: state.centerSize, color: state.centerColor, fontWeight: 900,
              letterSpacing: 12, fontFamily: FONT, lineHeight: 1, display: 'block',
              filter: `drop-shadow(0 0 40px ${state.centerColor}99) drop-shadow(0 0 80px ${state.centerColor}44)`,
            }}>
              {state.vsText}
            </span>
          )}

          {/* Date */}
          <span style={{
            fontSize: 22, color: state.dateColor, fontWeight: 500,
            letterSpacing: 3, textAlign: 'center', textTransform: 'uppercase',
            fontFamily: FONT, lineHeight: 1.5,
          }}>
            {dateStr}
          </span>
        </div>

        {/* ─── RIGHT ENTITY ──────────────────── */}
        <div style={{
          width: '38%', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 44, padding: '60px 70px',
        }}>
          {state.right.imageUrl
            ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={state.right.imageUrl} alt={state.right.name} crossOrigin="anonymous"
                style={{
                  width: state.right.type === 'club' ? 280 : 500,
                  height: state.right.type === 'club' ? 280 : 334,
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 10px 40px rgba(0,0,0,0.55))',
                  display: 'block',
                }}
              />
            )
            : <div style={{ width: 500, height: 334, background: 'rgba(255,255,255,0.06)', borderRadius: 8 }} />
          }
          <span style={{
            fontSize: state.nameSize, color: state.nameColor, fontWeight: 800,
            letterSpacing: 5, textAlign: 'center', textTransform: 'uppercase',
            fontFamily: FONT, lineHeight: 1.2,
          }}>
            {state.right.name}
          </span>
        </div>
      </div>
    );
  }
);

VSCanvas.displayName = 'VSCanvas';
export default VSCanvas;
