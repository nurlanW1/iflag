'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { usePathname, useRouter } from 'next/navigation';
import { Download } from 'lucide-react';
import { triggerApiFileDownload } from '@/lib/client/trigger-api-download';

/**
 * Opens preview download via hidden iframe after auth preflight — avoids navigating away from the PDP.
 */
export function MarketplacePreviewDownloadButton({ apiPath }: { apiPath: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);

  const returnTo = pathname || '/browse';

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => {
        setBusy(true);
        void triggerApiFileDownload(apiPath, {
          onUnauthorized: () =>
            router.push(`/login?callbackUrl=${encodeURIComponent(returnTo)}`),
          onForbidden: () =>
            router.push(`/pricing?callbackUrl=${encodeURIComponent(returnTo)}`),
          onNotFound: () => toast.error('File not found.'),
          onError: () => toast.error('Download failed. Please try again.'),
        }).finally(() => setBusy(false));
      }}
      className="flex w-full min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-70"
    >
      <Download size={18} aria-hidden />
      {busy ? 'Downloading…' : 'Preview download'}
    </button>
  );
}
