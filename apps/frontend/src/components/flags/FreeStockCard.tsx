interface FreeStockCardProps {
  thumbUrl: string;
  description: string;
  photographer: string;
  sourceUrl: string;
  source: 'pexels' | 'pixabay';
}

export function FreeStockCard({
  thumbUrl,
  description,
  photographer,
  sourceUrl,
  source,
}: FreeStockCardProps) {
  const badgeColor = source === 'pexels' ? 'bg-green-600' : 'bg-emerald-600';

  return (
    <a
      href={sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:border-neutral-300 hover:shadow-md"
    >
      <span
        className={`absolute right-2 top-2 z-10 ${badgeColor} rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white`}
      >
        Free
      </span>

      <div className="aspect-[4/3] overflow-hidden bg-neutral-100">
        <img
          src={thumbUrl}
          alt={description}
          loading="lazy"
          decoding="async"
          draggable={false}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <div className="p-3">
        <p className="mb-1 truncate text-xs text-neutral-500">
          Photo by {photographer}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
            {source}
          </span>
          <span className="text-xs text-[var(--brand-blue)] group-hover:underline">
            View ↗
          </span>
        </div>
      </div>
    </a>
  );
}
