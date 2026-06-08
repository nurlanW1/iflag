import { Spinner } from '@/components/ui/Spinner';

export default function DashboardLoading() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
      <Spinner size="lg" label="Loading dashboard" />
      <p className="text-sm text-neutral-400">Loading your account…</p>
    </div>
  );
}
