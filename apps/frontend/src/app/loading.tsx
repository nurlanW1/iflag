import { Spinner } from '@/components/ui/Spinner';

export default function RootLoading() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 bg-[#fafaf9] px-4">
      <Spinner size="lg" label="Loading page" />
      <p className="text-sm text-neutral-400">Loading…</p>
    </div>
  );
}
