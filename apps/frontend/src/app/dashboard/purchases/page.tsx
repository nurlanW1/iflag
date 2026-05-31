import type { ReactNode } from 'react';
import Link from 'next/link';
import { Package, ShoppingBag } from 'lucide-react';
import { EmptyState } from '@/components/dashboard/EmptyState';
import {
  fetchAccountOwnedFileRows,
  fetchAccountPurchasedAssets,
  fetchAccountPurchases,
} from '@/lib/account/dashboard-data';
import { getDashboardDataUserId } from '@/lib/dashboard/account';
import { getAccessTokenFromCookies } from '@/lib/auth/session.server';
import type { AccountPurchaseRow } from '@/types/account';
import { slugFromAssetGroupKey } from '@/lib/marketplace/group-flag-products';

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

function assetHref(productSlug: string | null, assetGroupKey: string): string {
  const slug =
    productSlug?.trim() ||
    (assetGroupKey.startsWith('solo:') ? `nf-${assetGroupKey.slice(5)}` : slugFromAssetGroupKey(assetGroupKey));
  return `/assets/${encodeURIComponent(slug)}`;
}

export default async function DashboardPurchasesPage() {
  const dataUserId = await getDashboardDataUserId();
  const access = await getAccessTokenFromCookies();
  const [purchases, ownedFiles, purchasedAssets] = await Promise.all([
    fetchAccountPurchases(dataUserId, access),
    fetchAccountOwnedFileRows(dataUserId, access),
    fetchAccountPurchasedAssets(access),
  ]);
  const hasOwned = ownedFiles.length > 0;
  const hasOrders = purchases.length > 0;
  const hasAssets = purchasedAssets.length > 0;

  return (
    <div className="w-full min-w-0">
      <h1 className="text-2xl font-black text-gray-900">My purchases</h1>
      <p className="mt-1 text-sm text-gray-600">
        One-time $1 purchases unlock a design forever — download again anytime without paying twice.
      </p>

      <section className="mt-10" aria-labelledby="assets-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="assets-heading" className="text-lg font-bold text-gray-900">
              Purchased designs
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Lifetime access per design — all formats included after checkout.
            </p>
          </div>
          <Badge className="bg-emerald-600 text-white">Owned</Badge>
        </div>

        {!hasAssets ? (
          <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 px-5 py-8 text-center">
            <p className="text-sm text-gray-600">
              No purchased designs yet. Buy a premium variant on any asset page — it appears here after Paddle
              confirms payment.
            </p>
            <Link
              href="/gallery"
              className="mt-4 inline-flex text-sm font-semibold text-[#2563eb] hover:underline"
            >
              Browse gallery
            </Link>
          </div>
        ) : (
          <ul className="mt-6 divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white">
            {purchasedAssets.map((row) => {
              const title =
                row.display_title?.trim() ||
                row.product_slug?.trim() ||
                row.asset_group_key;
              const href = assetHref(row.product_slug, row.asset_group_key);
              return (
                <li
                  key={row.id}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <ShoppingBag className="h-4 w-4 text-emerald-600" aria-hidden />
                      <p className="font-semibold text-gray-900">{title}</p>
                      <Badge className="bg-emerald-100 text-emerald-900">Lifetime</Badge>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Purchased{' '}
                      <time dateTime={row.purchased_at}>
                        {new Date(row.purchased_at).toLocaleString()}
                      </time>
                      {row.country_slug ? ` · ${row.country_slug}` : null}
                    </p>
                  </div>
                  <Link
                    href={href}
                    className="inline-flex shrink-0 items-center justify-center rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2563eb]"
                  >
                    Open &amp; download
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-10" aria-labelledby="orders-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="orders-heading" className="text-lg font-bold text-gray-900">
              Order history
            </h2>
            <p className="mt-1 text-sm text-gray-600">Paddle checkout receipts synced to your account.</p>
          </div>
        </div>

        {!hasOrders ? (
          <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 px-5 py-8 text-center">
            <p className="text-sm text-gray-600">
              No orders synced yet. After checkout, rows appear here when your session is linked to the billing API.
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
              Download entitlements
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Pro file rows you can download from the catalog API.
            </p>
          </div>
        </div>

        {!hasOwned ? (
          <div className="mt-6">
            <EmptyState
              icon={Package}
              title="No file entitlements yet"
              description="After you buy a design, downloadable formats appear here when the catalog is linked."
              action={{ label: 'Open gallery', href: '/gallery' }}
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
                    href={`/assets/${row.productSlug}`}
                    className="mt-2 inline-block text-xs font-medium text-[#2563eb] hover:underline"
                  >
                    Product page
                  </Link>
                </div>
                <a
                  href={`/api/marketplace/files/${row.productId}/${row.fileId}/download`}
                  className="inline-flex shrink-0 items-center justify-center rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2563eb]"
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
