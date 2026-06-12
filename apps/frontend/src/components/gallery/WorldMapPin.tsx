export function WorldMapPin({ slug: _ }: { slug: string }) {
  return (
    <div className="w-full select-none">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/world_map.svg"
        alt="World map"
        className="w-full opacity-[0.22]"
        draggable={false}
      />
    </div>
  );
}
