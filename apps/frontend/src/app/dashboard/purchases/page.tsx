import type { ReactNode } from 'react';
import Link from 'next/link';
import { Package } from 'lucide-react';
import { EmptyState } from '@/components/dashboard/EmptyState';
import {
  fetchAccountOwnedFileRows,
  fetchAccountPurchases,
} from '@/lib/account/dashboard-data';
import { getDashboardDataUserId } from '@/lib/dashboard/account';
import { getAccessTokenFromCookies } from '@/lib/auth/session.server';
import type { AccountPurchaseRow } from '@/types/account';

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

function purchaseStatusBadge(status: AccountPurchaseRow['status']) {
  switch (status) {
    case 'fulfilled':
      return <Badge className="bg-emerald-100 text-emerald-900">Paid</Badge>;
    case 'pending':
      return <Badge className="bg-amber-100 text-amber-900">Pending</Badge>;
    case 'refunded':
      return <Badge className="bg-gray-200 text-gray-800">Refunded</Badge>;
    default:
      return null;
  }
}

export default async function DashboardPurchasesPage() {
  const dataUserId = await getDashboardDataUserId();
  const access = await getAccessTokenFromCookies();
  const [purchases, ownedFiles] = await Promise.all([
    fetchAccountPurchases(dataUserId, access),
    fetchAccountOwnedFileRows(dataUserId, access),
  ]);
  const hasOwned = ownedFiles.length > 0;
  const hasOrders = purchases.length > 0;

  return (
    <div className="w-full min-w-0">
      <h1 className="text-2xl font-black text-gray-900">Purchased files</h1>
      <p className="mt-1 text-sm text-gray-600">
        One-time purchases from Paddle (and demo/admin grants in development) linked to your account.
        Files stay available while your account is in good standing.
      </p>

      <section className="mt-10" aria-labelledby="orders-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="orders-heading" className="text-lg font-bold text-gray-900">
              Order history
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Checkout rows from Paddle when your session is linked to the billing backend.
            </p>
          </div>
        </div>

        {!hasOrders ? (
          <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 px-5 py-8 text-center">
            <p className="text-sm text-gray-600">
              No orders synced yet. After you complete a Paddle checkout, orders appear here if backend cookies
              match your Clerk email (open any dashboard page once to sync).
            </p>
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-2xl border border-gray-200 bg-white">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-600">
                <tr>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {purchases.map((row) => (
                  <tr key={row.id}>
                    <td className="px-5 py-4 font-medium text-gray-900">{row.productTitle}</td>
                    <td className="px-5 py-4 text-gray-600">
                      {row.purchasedAt ? (
                        <time dateTime={row.purchasedAt}>
                          {new Date(row.purchasedAt).toLocaleString()}
                        </time>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">{purchaseStatusBadge(row.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

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
