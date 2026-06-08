import Link from 'next/link';
import { Download } from 'lucide-react';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { fetchAccountDownloads } from '@/lib/account/dashboard-data';
import { getDashboardDataUserId } from '@/lib/dashboard/account';

export default async function DashboardDownloadsPage() {
  const dataUserId = await getDashboardDataUserId();
  const downloads = await fetchAccountDownloads(dataUserId);

  return (
    <div className="w-full min-w-0">
      <h1 className="text-2xl font-semibold tracking-tight text-[#2a2a2a]">Downloads</h1>
      <p className="mt-1 text-sm text-neutral-500">
        A timeline of download activity. Per-file downloads are also available from{' '}
        <Link href="/dashboard/purchases" className="font-medium text-[var(--brand-blue)] hover:underline">
          Purchased files
        </Link>
        .
      </p>
      {downloads.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={Download}
            title="No downloads recorded"
            description="When download events are tracked for your account, they will show up here."
            action={{ label: 'Open purchased files', href: '/dashboard/purchases' }}
          />
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-neutral-100 rounded-2xl border border-neutral-200 bg-white">
          {downloads.map((d) => (
            <li key={d.id} className="px-6 py-4">
              <p className="font-semibold text-[#2a2a2a]">{d.assetLabel}</p>
              <p className="text-sm text-neutral-500">
                {d.tier === 'full' ? 'Full quality' : 'Preview'} · {d.downloadedAt || '—'}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
