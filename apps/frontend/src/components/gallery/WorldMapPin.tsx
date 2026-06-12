'use client';

export function WorldMapPin({ slug: _ }: { slug: string }) {
  return (
    <div
      className="h-full w-full select-none overflow-hidden"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/world_map.svg"
        alt=""
        className="h-full w-full object-cover object-center opacity-[0.22]"
        draggable={false}
        style={{ pointerEvents: 'none' }}
      />
    </div>
  );
}
