'use client';

import { forwardRef } from 'react';
import type { VSDesignerState } from '@/lib/vs-designer-types';

interface VSCanvasProps {
  state: VSDesignerState;
}

function getDateString(state: VSDesignerState): string {
  if (state.dateMode === 'manual') return state.dateText;
  return new Date()
    .toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    .toUpperCase();
}

const VSCanvas = forwardRef<HTMLDivElement, VSCanvasProps>(({ state }, ref) => {
  const dateStr = getDateString(state);

  return (
    <div
      ref={ref}
      style={{
        width: 1920,
        height: 1080,
        backgroundColor: state.bgColor,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'stretch',
        transformOrigin: 'top left',
      }}
    >
      {/* Radial glow behind VS */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 700,
          height: 700,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Center divider */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '5%',
          height: '90%',
          width: 1,
          background: 'rgba(255,255,255,0.1)',
          transform: 'translateX(-50%)',
        }}
      />

      {/* LEFT ENTITY */}
      <div
        style={{
          width: '40%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 36,
          padding: '80px 60px',
        }}
      >
        {state.left.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={state.left.imageUrl}
            alt={state.left.name}
            crossOrigin="anonymous"
            style={{
              width: 320,
              height: 210,
              objectFit: state.left.type === 'club' ? 'contain' : 'cover',
              borderRadius: state.left.type === 'flag' ? 8 : 0,
              boxShadow: '0 8px 48px rgba(0,0,0,0.55)',
            }}
          />
        ) : (
          <div style={{ width: 320, height: 210, background: 'rgba(255,255,255,0.08)', borderRadius: 8 }} />
        )}
        <span
          style={{
            fontSize: state.nameSize,
            color: state.nameColor,
            fontWeight: 700,
            letterSpacing: 3,
            textAlign: 'center',
            textTransform: 'uppercase',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {state.left.name}
        </span>
      </div>

      {/* CENTER */}
      <div
        style={{
          width: '20%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
          padding: '60px 0',
        }}
      >
        <span
          style={{
            fontSize: state.titleSize,
            color: state.titleColor,
            fontWeight: 800,
            letterSpacing: 5,
            textTransform: 'uppercase',
            textAlign: 'center',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {state.eventTitle}
        </span>
        <span
          style={{
            fontSize: state.vsSize,
            color: state.vsColor,
            fontWeight: 900,
            letterSpacing: 10,
            textShadow: `0 0 40px ${state.vsColor}99, 0 0 90px ${state.vsColor}44`,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            lineHeight: 1,
          }}
        >
          {state.vsText}
        </span>
        <span
          style={{
            fontSize: 20,
            color: state.dateColor,
            fontWeight: 500,
            letterSpacing: 3,
            textAlign: 'center',
            textTransform: 'uppercase',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {dateStr}
        </span>
      </div>

      {/* RIGHT ENTITY */}
      <div
        style={{
          width: '40%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 36,
          padding: '80px 60px',
        }}
      >
        {state.right.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={state.right.imageUrl}
            alt={state.right.name}
            crossOrigin="anonymous"
            style={{
              width: 320,
              height: 210,
              objectFit: state.right.type === 'club' ? 'contain' : 'cover',
              borderRadius: state.right.type === 'flag' ? 8 : 0,
              boxShadow: '0 8px 48px rgba(0,0,0,0.55)',
            }}
          />
        ) : (
          <div style={{ width: 320, height: 210, background: 'rgba(255,255,255,0.08)', borderRadius: 8 }} />
        )}
        <span
          style={{
            fontSize: state.nameSize,
            color: state.nameColor,
            fontWeight: 700,
            letterSpacing: 3,
            textAlign: 'center',
            textTransform: 'uppercase',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {state.right.name}
        </span>
      </div>
    </div>
  );
});

VSCanvas.displayName = 'VSCanvas';
export default VSCanvas;
