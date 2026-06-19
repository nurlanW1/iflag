import { getMagnificSearchUrl } from '@/lib/affiliates';

interface PartnerLinksProps {
  countryName: string;
}

export function PartnerLinks({ countryName }: PartnerLinksProps) {
  const query = `${countryName} flag`;

  return (
    <div className="mt-10 border-t border-neutral-200/60 pt-8">
      <div className="mb-5 flex items-center gap-2.5">
        <h3 className="text-base font-semibold text-[#2a2a2a]">
          More {countryName} flag resources
        </h3>
        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600 ring-1 ring-blue-200">
          Free vectors
        </span>
      </div>

      <a
        href={getMagnificSearchUrl(query)}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="group flex items-center gap-4 rounded-2xl border border-neutral-200/90 bg-white px-5 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1273eb] text-[11px] font-extrabold tracking-tight text-white shadow-sm">
          FP
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-[#2a2a2a]">
            Freepik — {countryName} flag vectors &amp; photos
          </div>
          <div className="mt-0.5 text-xs text-neutral-500">
            Millions of free &amp; premium flag assets — SVG, PNG, AI, EPS
          </div>
        </div>

        <span className="ml-2 shrink-0 text-sm text-neutral-400 transition-transform duration-200 group-hover:translate-x-0.5">
          ↗
        </span>
      </a>

      <p className="mt-3 text-[11px] text-neutral-400">
        External links may be affiliate links. Flagswing may earn a commission.
      </p>
    </div>
  );
}
