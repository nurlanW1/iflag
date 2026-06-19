import { getMagnificSearchUrl } from '@/lib/affiliates';

interface PartnerLinksProps {
  countryName: string;
}

export function PartnerLinks({ countryName }: PartnerLinksProps) {
  const query = `${countryName} flag`;

  return (
    <div className="mt-8 border-t border-gray-200 pt-6">
      <div className="mb-1 text-sm font-medium text-gray-700">
        Need more {countryName} flag styles?
      </div>
      <div className="mb-4 text-xs text-gray-500">
        Find additional variations on these platforms
      </div>

      <div className="flex flex-col gap-2">
        <a
          href={getMagnificSearchUrl(query)}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 transition-colors hover:border-gray-300"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-blue-600 text-[10px] font-bold text-white">
              FP
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">Freepik / Magnific</div>
              <div className="text-xs text-gray-500">Millions of flag vectors and photos</div>
            </div>
          </div>
          <span className="text-xs text-gray-400">↗</span>
        </a>
      </div>

      <div className="mt-3 text-[11px] text-gray-400">
        External links may be affiliate links. Flagswing may earn a commission.
      </div>
    </div>
  );
}
