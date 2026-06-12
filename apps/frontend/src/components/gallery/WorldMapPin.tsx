'use client';

export function WorldMapPin({ slug: _ }: { slug: string }) {
  return (
    <div
      className="w-full select-none overflow-hidden"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/world_map.svg"
        alt=""
        className="w-full opacity-[0.22]"
        draggable={false}
        style={{ pointerEvents: 'none', display: 'block' }}
      />
    </div>
  );
}
