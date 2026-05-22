'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download } from 'lucide-react';

export type NeonDlFileRow = {
  id: string;
  format: string;
  tier: string;
};

/**
 * Sidebar for Neon-backed marketplace products: select `country_flag_files.id` → `/api/download/[fileId]`.
 */
export function NeonAssetDownloads({ files }: { files: NeonDlFileRow[] }) {
  const sorted = useMemo(
    () =>
      [...files].sort((a, b) => {
        const fa = a.format.toLowerCase().localeCompare(b.format.toLowerCase());
        return fa !== 0 ? fa : a.id.localeCompare(b.id);
      }),
    [files]
  );

  const [sel, setSel] = useState<string>(sorted[0]?.id ?? '');

  useEffect(() => {
    if (!sorted.length) return;
    if (!sel || !sorted.some((f) => f.id === sel)) {
      setSel(sorted[0]!.id);
    }
  }, [sorted, sel]);

  const active = sorted.find((f) => f.id === sel);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-bold text-gray-900">Formats</h2>
        <p className="mt-1 text-xs text-gray-500">
          Pick an export; the button uses your account and Paddle / subscription gates on the API.
        </p>
        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Available file formats">
          {sorted.map((f) => {
            const on = active?.id === f.id;
            return (
              <li key={`${f.id}-${f.format}`}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => setSel(f.id)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition ${
                    on
                      ? 'border-[#009ab6] bg-[#009ab6]/10 text-[#006b7d]'
                      : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {f.format.toUpperCase()}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {active ? (
        <dl className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
          <div className="flex justify-between gap-2">
            <dt className="font-semibold text-gray-800">Access</dt>
            <dd>{active.tier === 'pro' ? 'Pro' : active.tier === 'preview_free' ? 'Preview' : active.tier}</dd>
          </div>
        </dl>
      ) : null}

      <a
        href={`/api/download/${active?.id ?? ''}`}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#009ab6] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#007a8a]"
      >
        <Download size={18} aria-hidden />
        Download ({active?.format.toUpperCase() ?? '…'})
      </a>
    </div>
  );
}
