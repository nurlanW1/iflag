import Link from 'next/link';
import { Download } from 'lucide-react';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { fetchAccountDownloads } from '@/lib/account/dashboard-data';
import { getSessionUserFromCookies } from '@/lib/auth/session.server';

export default async function DashboardDownloadsPage() {
  const user = await getSessionUserFromCookies();
  if (!user) return null;

  const downloads = await fetchAccountDownloads(user.id);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-black text-gray-900">Downloads</h1>
      <p className="mt-1 text-sm text-gray-600">
        Per-file access and download buttons live on{' '}
        <Link href="/dashboard/purchases" className="font-medium text-[#009ab6] hover:underline">
          Your files
        </Link>
        . Event-style history can be added when analytics storage exists.
      </p>
      {downloads.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={Download}
            title="No download events recorded"
            description="Use Your files to download previews and Pro assets you own or unlock via subscription."
            action={{ label: 'Open Your files', href: '/dashboard/purchases' }}
          />
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white">
          {downloads.map((d) => (
            <li key={d.id} className="px-6 py-4">
              <p className="font-semibold text-gray-900">{d.assetLabel}</p>
              <p className="text-sm text-gray-500">
                {d.tier === 'full' ? 'Full quality' : 'Preview'} · {d.downloadedAt || '—'}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
