interface ShutterstockCardProps {
  id: string;
  thumbUrl: string;
  description: string;
  shutterUrl: string;
}

export function ShutterstockCard({ thumbUrl, description, shutterUrl }: ShutterstockCardProps) {
  return (
    <a
      href={shutterUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block overflow-hidden rounded-xl border border-gray-200 bg-gray-50 transition-all hover:border-gray-300 hover:shadow-md"
    >
      {/* SS Badge */}
      <div className="absolute right-2 top-2 z-10 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
        SS
      </div>

      {/* Preview image */}
      <div className="aspect-[4/3] overflow-hidden bg-gray-100">
        {thumbUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbUrl}
            alt={description || 'Stock flag image'}
            loading="lazy"
            decoding="async"
            draggable={false}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-300">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
        )}
      </div>

      {/* Bottom */}
      <div className="p-3">
        <p className="mb-2 truncate text-xs text-gray-500">{description}</p>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-400">shutterstock</span>
          <span className="text-xs text-blue-600 group-hover:underline">View ↗</span>
        </div>
      </div>
    </a>
  );
}
