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

const EntitySlot = ({ entity, nameSize, nameColor, side }: {
  entity: VSDesignerState['left'];
  nameSize: number;
  nameColor: string;
  side: 'left' | 'right';
}) => (
  <div style={{
    width: '40%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 48,
    padding: '60px 80px',
  }}>
    {entity.imageUrl ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={entity.imageUrl}
        alt={entity.name}
        crossOrigin="anonymous"
        style={{
          width: entity.type === 'club' ? 260 : 480,
          height: entity.type === 'club' ? 260 : 320,
          objectFit: 'contain',
          filter: 'drop-shadow(0 8px 32px rgba(0,0,0,0.5))',
          display: 'block',
        }}
      />
    ) : (
      <div style={{
        width: 480,
        height: 320,
        background: 'rgba(255,255,255,0.06)',
        borderRadius: 6,
      }} />
    )}
    <span style={{
      fontSize: nameSize,
      color: nameColor,
      fontWeight: 800,
      letterSpacing: 4,
      textAlign: 'center',
      textTransform: 'uppercase',
      fontFamily: 'system-ui, -apple-system, Arial, sans-serif',
      lineHeight: 1.2,
    }}>
      {entity.name}
    </span>
  </div>
);

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
        fontFamily: 'system-ui, -apple-system, Arial, sans-serif',
      }}
    >
      {/* Radial glow */}
      <div style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: 800,
        height: 800,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.055) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      {/* Divider */}
      <div style={{
        position: 'absolute',
        left: '50%',
        top: '8%',
        height: '84%',
        width: 1,
        background: 'rgba(255,255,255,0.1)',
        transform: 'translateX(-50%)',
      }} />

      {/* LEFT */}
      <EntitySlot entity={state.left} nameSize={state.nameSize} nameColor={state.nameColor} side="left" />

      {/* CENTER */}
      <div style={{
        width: '20%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: '60px 20px',
      }}>
        <span style={{
          fontSize: state.titleSize,
          color: state.titleColor,
          fontWeight: 800,
          letterSpacing: 6,
          textTransform: 'uppercase',
          textAlign: 'center',
          fontFamily: 'system-ui, -apple-system, Arial, sans-serif',
          lineHeight: 1.2,
        }}>
          {state.eventTitle}
        </span>
        <span style={{
          fontSize: state.vsSize,
          color: state.vsColor,
          fontWeight: 900,
          letterSpacing: 12,
          filter: `drop-shadow(0 0 30px ${state.vsColor}88) drop-shadow(0 0 60px ${state.vsColor}44)`,
          fontFamily: 'system-ui, -apple-system, Arial, sans-serif',
          lineHeight: 1,
          display: 'block',
        }}>
          {state.vsText}
        </span>
        <span style={{
          fontSize: 22,
          color: state.dateColor,
          fontWeight: 500,
          letterSpacing: 3,
          textAlign: 'center',
          textTransform: 'uppercase',
          fontFamily: 'system-ui, -apple-system, Arial, sans-serif',
          lineHeight: 1.4,
        }}>
          {dateStr}
        </span>
      </div>

      {/* RIGHT */}
      <EntitySlot entity={state.right} nameSize={state.nameSize} nameColor={state.nameColor} side="right" />
    </div>
  );
});

VSCanvas.displayName = 'VSCanvas';
export default VSCanvas;
