import clsx from 'clsx';
import { Crown } from 'lucide-react';

type Props = {
  premium: boolean;
};

/** Country folder design cards only — crown marks free (green) vs premium (yellow). */
export function CountryDesignTierCrown({ premium }: Props) {
  return (
    <span
      className={clsx(
        'pointer-events-none absolute left-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-lg shadow-[0_1px_4px_rgba(15,23,42,0.18)] ring-1 ring-black/10',
        premium ? 'bg-amber-400 text-amber-950' : 'bg-emerald-500 text-white',
      )}
      title={premium ? 'Premium' : 'Free'}
    >
      <Crown className="h-4 w-4 shrink-0" strokeWidth={2.35} aria-hidden />
      <span className="sr-only">{premium ? 'Premium design' : 'Free design'}</span>
    </span>
  );
}
