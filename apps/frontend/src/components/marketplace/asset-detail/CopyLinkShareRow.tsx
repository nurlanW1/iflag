'use client';

import { usePathname } from 'next/navigation';
import { Link2, Share2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * PDP-only quick actions — copy page URL / native share where available.
 */
export function CopyLinkShareRow() {
  const pathname = usePathname();

  const fullUrl =
    typeof window !== 'undefined' && pathname ? `${window.location.origin}${pathname}` : '';

  const onCopy = async () => {
    if (!fullUrl) return;
    try {
      await navigator.clipboard.writeText(fullUrl);
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy');
    }
  };

  const onShare = async () => {
    if (!fullUrl) return;
    try {
      if (navigator.share) {
        await navigator.share({ url: fullUrl });
        return;
      }
      await navigator.clipboard.writeText(fullUrl);
      toast.success('Link copied');
    } catch {
      // user cancelled share sheet
    }
  };

  return (
    <div className="mt-6 flex gap-2">
      <button
        type="button"
        onClick={() => void onCopy()}
        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200/95 bg-white py-2.5 text-[13px] font-semibold text-slate-700 shadow-sm transition-[transform,box-shadow,background] duration-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md active:scale-[0.99]"
      >
        <Link2 className="h-4 w-4 text-slate-500" aria-hidden />
        Copy link
      </button>
      <button
        type="button"
        onClick={() => void onShare()}
        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200/95 bg-white py-2.5 text-[13px] font-semibold text-slate-700 shadow-sm transition-[transform,box-shadow,background] duration-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md active:scale-[0.99]"
      >
        <Share2 className="h-4 w-4 text-slate-500" aria-hidden />
        Share
      </button>
    </div>
  );
}
