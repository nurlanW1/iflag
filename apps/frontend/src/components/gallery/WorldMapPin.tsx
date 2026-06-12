export function WorldMapPin({ slug: _ }: { slug: string }) {
  return (
    <div className="select-none overflow-hidden" style={{ marginRight: '-2rem' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/world_map.svg"
        alt="World map"
        className="w-full opacity-[0.22]"
        draggable={false}
        style={{ minWidth: '110%' }}
      />
    </div>
  );
}
