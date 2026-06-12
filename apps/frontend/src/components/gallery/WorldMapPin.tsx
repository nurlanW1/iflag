import { COUNTRY_COORDS, latLonToPercent } from '@/lib/country-coordinates';

export function WorldMapPin({ slug }: { slug: string }) {
  const coords = COUNTRY_COORDS[slug];
  const pin = coords ? latLonToPercent(coords[0], coords[1]) : null;

  return (
    <div className="relative w-full select-none">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/world_map.svg"
        alt="World map"
        className="w-full opacity-[0.22]"
        draggable={false}
      />

      {pin && (
        <div
          className="pointer-events-none absolute"
          style={{
            left: `${pin.x}%`,
            top: `${pin.y}%`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <svg
            viewBox="0 0 20 26"
            width="18"
            height="23"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
          >
            <path
              d="M10 0C6.13 0 3 3.13 3 7c0 5.25 6.5 13.5 6.77 13.84a.3.3 0 0 0 .46 0C10.5 20.5 17 12.25 17 7c0-3.87-3.13-7-7-7z"
              fill="#DC2626"
            />
            <circle cx="10" cy="7" r="2.5" fill="white" />
          </svg>
        </div>
      )}

      {/* Subtle country dot glow */}
      {pin && (
        <div
          className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500/30 ring-2 ring-red-500/20"
          style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
          aria-hidden
        />
      )}
    </div>
  );
}
