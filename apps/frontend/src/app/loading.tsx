import { Spinner } from '@/components/ui/Spinner';

export default function RootLoading() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 bg-white px-4">
      <Spinner size="lg" label="Loading page" />
      <p className="text-sm text-gray-500">Loading…</p>
    </div>
  );
}
