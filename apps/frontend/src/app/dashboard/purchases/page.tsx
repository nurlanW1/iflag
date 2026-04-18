import type { ReactNode } from 'react';
import Link from 'next/link';
import { Package } from 'lucide-react';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { fetchAccountOwnedFileRows } from '@/lib/account/dashboard-data';
import { getDashboardDataUserId } from '@/lib/dashboard/account';

function Badge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold ${className ?? ''}`}
    >
      {children}
    </span>
  );
}

export default async function DashboardPurchasesPage() {
  const dataUserId = await getDashboardDataUserId();
  const ownedFiles = await fetchAccountOwnedFileRows(dataUserId);
  const hasOwned = ownedFiles.length > 0;

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-black text-gray-900">Purchased files</h1>
      <p className="mt-1 text-sm text-gray-600">
        One-time purchases and admin grants linked to your account. Files stay available while your
        account is in good standing.
      </p>

      <section className="mt-10" aria-labelledby="owned-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="owned-heading" className="text-lg font-bold text-gray-900">
              Your library
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Download links are issued after the server verifies your access.
            </p>
          </div>
          <Badge className="bg-emerald-600 text-white">Owned</Badge>
        </div>

        {!hasOwned ? (
          <div className="mt-6">
            <EmptyState
              icon={Package}
              title="No purchases yet"
              description="When you buy a product, the files you are entitled to will be listed here."
              action={{ label: 'Browse catalog', href: '/browse' }}
            />
          </div>
        ) : (
          <ul className="mt-6 divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white">
            {ownedFiles.map((row) => (
              <li
                key={row.accessId}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-gray-900">{row.productTitle}</p>
                    <Badge className="bg-emerald-100 text-emerald-900">Owned</Badge>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    {row.format.toUpperCase()} · {row.qualityLabel} · {row.fileName}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Granted{' '}
                    <time dateTime={row.grantedAt}>{new Date(row.grantedAt).toLocaleString()}</time>
                  </p>
                  <Link
                    href={`/flags/${row.productSlug}`}
                    className="mt-2 inline-block text-xs font-medium text-[#009ab6] hover:underline"
                  >
                    Product page
                  </Link>
                </div>
                <a
                  href={`/api/marketplace/files/${row.productId}/${row.fileId}/download`}
                  className="inline-flex shrink-0 items-center justify-center rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#009ab6]"
                >
                  Download
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
