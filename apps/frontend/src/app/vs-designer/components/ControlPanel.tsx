'use client';

import { useState } from 'react';
import { Users, Type, Palette, Download } from 'lucide-react';
import type { VSDesignerState, VSEntity } from '@/lib/vs-designer-types';
import SearchDropdown from './SearchDropdown';
import ExportButton from './ExportButton';

// ─── Reusable primitives ────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">{children}</div>;
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-neutral-700 bg-neutral-800/80 px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
    />
  );
}

function ColorSizeRow({
  colorLabel, color, onColor,
  sizeLabel, size, onSize, min, max,
}: {
  colorLabel?: string; color: string; onColor: (v: string) => void;
  sizeLabel?: string; size: number; onSize: (v: number) => void; min: number; max: number;
}) {
  return (
    <div className="flex items-end gap-3">
      <div className="shrink-0">
        {colorLabel && <div className="mb-1 text-[11px] text-neutral-500">{colorLabel}</div>}
        <label className="relative block h-8 w-8 cursor-pointer overflow-hidden rounded-lg border border-neutral-700" title="Rang">
          <div className="h-full w-full" style={{ backgroundColor: color }} />
          <input type="color" value={color} onChange={(e) => onColor(e.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
        </label>
      </div>
      <div className="flex-1">
        {sizeLabel && <div className="mb-1 text-[11px] text-neutral-500">{sizeLabel} — {size}px</div>}
        <input
          type="range" min={min} max={max} value={size}
          onChange={(e) => onSize(Number(e.target.value))}
          className="w-full accent-blue-500"
        />
      </div>
    </div>
  );
}

function ModeToggle({ mode, onMode }: { mode: 'flag' | 'club'; onMode: (m: 'flag' | 'club') => void }) {
  return (
    <div className="flex rounded-lg border border-neutral-700 overflow-hidden">
      {(['flag', 'club'] as const).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onMode(m)}
          className={`flex-1 py-1.5 text-xs font-semibold transition-colors ${mode === m ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}
        >
          {m === 'flag' ? '🏳 Davlat' : '⚽ Klub'}
        </button>
      ))}
    </div>
  );
}

// ─── Entity half (left or right) ────────────────────────────────────────────

function EntityHalf({
  label, entity, mode, onMode, onUpdate,
}: {
  label: string;
  entity: VSEntity;
  mode: 'flag' | 'club';
  onMode: (m: 'flag' | 'club') => void;
  onUpdate: (patch: Partial<VSEntity>) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs font-bold text-neutral-300">{label}</div>

      {/* Preview thumbnail */}
      {entity.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={entity.imageUrl}
          alt={entity.name}
          crossOrigin="anonymous"
          className="mx-auto h-12 w-20 rounded object-contain"
        />
      )}

      <ModeToggle mode={mode} onMode={onMode} />
      <SearchDropdown mode={mode} onSelect={(e) => onUpdate({ name: e.name, imageUrl: e.imageUrl })} />

      <div>
        <Label>Nom</Label>
        <TextInput value={entity.name} onChange={(v) => onUpdate({ name: v })} />
      </div>
    </div>
  );
}

// ─── Tabs ───────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'entities', label: 'Tomonlar', icon: Users },
  { id: 'text', label: 'Matn', icon: Type },
  { id: 'style', label: 'Dizayn', icon: Palette },
] as const;

type TabId = typeof TABS[number]['id'];

// ─── BG presets ─────────────────────────────────────────────────────────────

const BG_PRESETS = [
  '#0A1628', '#0a0a14', '#0a1a0a', '#1a0a0a', '#1a0a2a', '#000000', '#111827', '#1e293b',
];

// ─── Main Control Panel ──────────────────────────────────────────────────────

interface ControlPanelProps {
  state: VSDesignerState;
  onChange: (patch: Partial<VSDesignerState>) => void;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  wrapperRef: React.RefObject<HTMLDivElement | null>;
}

export default function ControlPanel({ state, onChange, canvasRef, wrapperRef }: ControlPanelProps) {
  const [tab, setTab] = useState<TabId>('entities');
  const [leftMode, setLeftMode] = useState<'flag' | 'club'>('flag');
  const [rightMode, setRightMode] = useState<'flag' | 'club'>('flag');

  function updateLeft(patch: Partial<VSEntity>) {
    onChange({ left: { ...state.left, ...patch, type: leftMode } });
  }
  function updateRight(patch: Partial<VSEntity>) {
    onChange({ right: { ...state.right, ...patch, type: rightMode } });
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-neutral-800 shrink-0">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold transition-colors ${
              tab === id
                ? 'border-b-2 border-blue-500 text-blue-400'
                : 'border-b-2 border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Icon size={16} aria-hidden />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4">

        {/* ENTITIES TAB */}
        {tab === 'entities' && (
          <div className="flex flex-col gap-5">
            <EntityHalf
              label="← Chap tomon"
              entity={state.left}
              mode={leftMode}
              onMode={(m) => { setLeftMode(m); onChange({ left: { ...state.left, type: m } }); }}
              onUpdate={updateLeft}
            />
            <div className="border-t border-neutral-800" />
            <EntityHalf
              label="→ O'ng tomon"
              entity={state.right}
              mode={rightMode}
              onMode={(m) => { setRightMode(m); onChange({ right: { ...state.right, type: m } }); }}
              onUpdate={updateRight}
            />
          </div>
        )}

        {/* TEXT TAB */}
        {tab === 'text' && (
          <div className="flex flex-col gap-4">
            <div>
              <Label>Tadbir nomi</Label>
              <TextInput value={state.eventTitle} onChange={(v) => onChange({ eventTitle: v })} placeholder="WORLD CUP 2026" />
              <ColorSizeRow
                color={state.titleColor} onColor={(v) => onChange({ titleColor: v })}
                sizeLabel="Hajm" size={state.titleSize} onSize={(v) => onChange({ titleSize: v })} min={18} max={48}
              />
            </div>

            <div className="border-t border-neutral-800" />

            <div>
              <Label>VS matni</Label>
              <TextInput value={state.vsText} onChange={(v) => onChange({ vsText: v })} placeholder="VS" />
              <ColorSizeRow
                color={state.vsColor} onColor={(v) => onChange({ vsColor: v })}
                sizeLabel="Hajm" size={state.vsSize} onSize={(v) => onChange({ vsSize: v })} min={60} max={140}
              />
            </div>

            <div className="border-t border-neutral-800" />

            <div>
              <Label>Sana</Label>
              <div className="mb-2 flex rounded-lg border border-neutral-700 overflow-hidden">
                {(['auto', 'manual'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => onChange({ dateMode: m })}
                    className={`flex-1 py-1.5 text-xs font-semibold transition-colors ${state.dateMode === m ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}
                  >
                    {m === 'auto' ? 'Avtomatik' : 'Qo\'lda'}
                  </button>
                ))}
              </div>
              {state.dateMode === 'manual' && (
                <TextInput value={state.dateText} onChange={(v) => onChange({ dateText: v })} placeholder="JUNE 26, 2026" />
              )}
              <div className="mt-2 flex items-center gap-2">
                <label className="relative block h-7 w-7 cursor-pointer overflow-hidden rounded border border-neutral-700 shrink-0">
                  <div className="h-full w-full" style={{ backgroundColor: state.dateColor }} />
                  <input type="color" value={state.dateColor} onChange={(e) => onChange({ dateColor: e.target.value })} className="absolute inset-0 opacity-0 cursor-pointer" />
                </label>
                <span className="text-xs text-neutral-500">Sana rangi</span>
              </div>
            </div>

            <div className="border-t border-neutral-800" />

            <div>
              <Label>Ism hajmi ({state.nameSize}px)</Label>
              <div className="flex items-center gap-2">
                <label className="relative block h-7 w-7 cursor-pointer overflow-hidden rounded border border-neutral-700 shrink-0">
                  <div className="h-full w-full" style={{ backgroundColor: state.nameColor }} />
                  <input type="color" value={state.nameColor} onChange={(e) => onChange({ nameColor: e.target.value })} className="absolute inset-0 opacity-0 cursor-pointer" />
                </label>
                <input
                  type="range" min={14} max={36} value={state.nameSize}
                  onChange={(e) => onChange({ nameSize: Number(e.target.value) })}
                  className="flex-1 accent-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* STYLE TAB */}
        {tab === 'style' && (
          <div className="flex flex-col gap-4">
            <div>
              <Label>Fon rangi</Label>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {BG_PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    title={c}
                    onClick={() => onChange({ bgColor: c })}
                    style={{ backgroundColor: c }}
                    className={`h-10 rounded-lg border-2 transition-all hover:scale-105 ${state.bgColor === c ? 'border-blue-400 ring-2 ring-blue-400/30' : 'border-neutral-700'}`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <label className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-neutral-600 text-neutral-400 hover:border-blue-500 shrink-0">
                  <span className="text-lg leading-none">+</span>
                  <input type="color" value={state.bgColor} onChange={(e) => onChange({ bgColor: e.target.value })} className="sr-only" />
                </label>
                <span className="text-sm text-neutral-400">O'z rangingiz: <span className="font-mono text-white">{state.bgColor}</span></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Export — always visible */}
      <div className="shrink-0 border-t border-neutral-800 p-4">
        <ExportButton canvasRef={canvasRef} wrapperRef={wrapperRef} state={state} />
      </div>
    </div>
  );
}
