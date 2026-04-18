import type { ReactNode } from 'react';
import Link from 'next/link';
import { Gift, Package, Sparkles, Crown, AlertTriangle } from 'lucide-react';
import { EmptyState } from '@/components/dashboard/EmptyState';
import {
  fetchAccountFreePreviewRows,
  fetchAccountOwnedFileRows,
  fetchAccountSubscriptionAccessPanel,
} from '@/lib/account/dashboard-data';
import { getSessionUserFromCookies } from '@/lib/auth/session.server';

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
  const user = await getSessionUserFromCookies();
  if (!user) return null;

  const [ownedFiles, freePreviews, subPanel] = await Promise.all([
    fetchAccountOwnedFileRows(user.id),
    fetchAccountFreePreviewRows(),
    fetchAccountSubscriptionAccessPanel(user.id),
  ]);

  const hasOwned = ownedFiles.length > 0;
  const hasFreeSection = freePreviews.length > 0;

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-black text-gray-900">Your files &amp; access</h1>
      <p className="mt-1 text-sm text-gray-600">
        Permanent purchases stay on your account. Pro downloads are authorized on the server—links
        below hit a verified download route.
      </p>

      {/* Subscription access */}
      <section className="mt-10" aria-labelledby="sub-access-heading">
        <h2 id="sub-access-heading" className="text-lg font-bold text-gray-900">
          Subscription access
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          While your plan is active, you can download <strong>any</strong> premium file in the
          catalog (same server checks as one-time purchases).
        </p>

        {subPanel.hasProViaSubscription ? (
          <div className="mt-4 rounded-2xl border border-[#009ab6]/30 bg-[#009ab6]/5 px-5 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <Crown className="h-5 w-5 text-[#009ab6]" aria-hidden />
              <span className="font-semibold text-gray-900">
                {subPanel.planName ?? 'Pro'} — active
              </span>
              <Badge className="bg-[#009ab6] text-white">Subscription</Badge>
              {subPanel.status === 'trialing' ? (
                <Badge className="bg-amber-100 text-amber-900">Trial</Badge>
              ) : null}
              {subPanel.status === 'past_due' ? (
                <Badge className="bg-red-100 text-red-800">Past due</Badge>
              ) : null}
            </div>
            {subPanel.validThrough ? (
              <p className="mt-2 text-sm text-gray-700">
                Access through{' '}
                <time dateTime={subPanel.validThrough}>
                  {new Date(subPanel.validThrough).toLocaleString()}
                </time>
                .
              </p>
            ) : null}
            <Link
              href="/browse"
              className="mt-3 inline-flex text-sm font-semibold text-[#009ab6] hover:underline"
            >
              Browse catalog for Pro downloads →
            </Link>
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-5 py-4 text-sm text-gray-600">
            <p>No active subscription. </p>
            <Link href="/pricing" className="mt-2 inline-block font-semibold text-[#009ab6] hover:underline">
              View Pro plans →
            </Link>
          </div>
        )}

        {subPanel.lapsed && !subPanel.hasProViaSubscription ? (
          <div
            className="mt-4 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950"
            role="status"
          >
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-700" aria-hidden />
            <div>
              <p className="font-semibold">Previous subscription ended</p>
              <p className="mt-1 text-amber-900/90">
                {subPanel.lapsed.planName} — status {subPanel.lapsed.status}. Access ended{' '}
                <time dateTime={subPanel.lapsed.endedAt}>
                  {new Date(subPanel.lapsed.endedAt).toLocaleString()}
                </time>
                . Files you <strong>bought outright</strong> remain available below; subscription-only
                Pro access no longer applies.
              </p>
            </div>
          </div>
        ) : null}
      </section>

      {/* Permanent purchases */}
      <section className="mt-12" aria-labelledby="owned-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="owned-heading" className="text-lg font-bold text-gray-900">
              Purchased files
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              One-time buys and admin grants. These entitlements do not expire while your account
              stays in good standing.
            </p>
          </div>
          <Badge className="bg-emerald-600 text-white">Permanent</Badge>
        </div>

        {!hasOwned ? (
          <div className="mt-6">
            <EmptyState
              icon={Package}
              title="No purchased files yet"
              description="When you buy a flag, every Pro file for that product is added to your account permanently."
              action={{ label: 'Browse catalog', href: '/browse' }}
            />
          </div>
        ) : (
          <ul className="mt-6 divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white">
            {ownedFiles.map((row) => (
              <li key={row.accessId} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
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
                  Download Pro
                </a>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-gray-500">
          Pro downloads require R2 signing on the server. If you see a configuration error, set
          storage credentials per <code className="rounded bg-gray-100 px-1">signed-download.ts</code>.
        </p>
      </section>

      {/* Free previews */}
      <section className="mt-12" aria-labelledby="free-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="free-heading" className="text-lg font-bold text-gray-900">
              Free preview downloads
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Low-resolution / preview tier files with a public URL. Separate from paid Pro assets.
            </p>
          </div>
          <Badge className="bg-slate-600 text-white">Free</Badge>
        </div>

        {!hasFreeSection ? (
          <div className="mt-6">
            <EmptyState
              icon={Gift}
              title="No catalog previews"
              description="Published products with preview files will appear here."
              action={{ label: 'Browse catalog', href: '/browse' }}
            />
          </div>
        ) : (
          <ul className="mt-6 divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white">
            {freePreviews.map((row) => (
              <li
                key={`${row.productId}-${row.fileId}`}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-gray-900">{row.productTitle}</p>
                    <Badge className="bg-slate-100 text-slate-800">Preview</Badge>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    {row.format.toUpperCase()} · {row.qualityLabel} · {row.fileName}
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
                  className="inline-flex shrink-0 items-center justify-center rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 transition hover:border-[#009ab6] hover:text-[#009ab6]"
                >
                  Download preview
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12 rounded-2xl border border-gray-100 bg-gray-50/80 px-5 py-4 text-sm text-gray-600">
        <div className="flex gap-2">
          <Sparkles className="h-5 w-5 shrink-0 text-[#009ab6]" aria-hidden />
          <p>
            <strong className="text-gray-800">Access list</strong> reflects server-side grants
            (webhooks / fulfillment). Download buttons call{' '}
            <code className="rounded bg-white px-1 text-xs">/api/marketplace/files/…/download</code>,
            which re-checks your session and entitlements before issuing a file or redirect.
          </p>
        </div>
      </section>
    </div>
  );
}
