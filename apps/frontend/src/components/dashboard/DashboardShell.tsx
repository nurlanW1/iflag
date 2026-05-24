'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useClerk, useUser } from '@clerk/nextjs';
import {
  ChevronRight,
  CreditCard,
  Download,
  Flag,
  Globe,
  LayoutDashboard,
  LogOut,
  Package,
  User,
} from 'lucide-react';
import type { DashboardAccount } from '@/lib/dashboard/account';
import { clerkEmailMatchesAdmin, clientClerkUserMatchesAdmin } from '@/lib/auth/admin-email';

const navItems: { href: string; label: string; icon: typeof User }[] = [
  { href: '/dashboard', label: 'Dashboard home', icon: LayoutDashboard },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
  { href: '/dashboard/purchases', label: 'Purchased files', icon: Package },
  { href: '/dashboard/downloads', label: 'Downloads', icon: Download },
  { href: '/dashboard/subscription', label: 'Subscription', icon: CreditCard },
];

export function DashboardShell({
  account,
  children,
}: {
  account: DashboardAccount;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [billingNotice, setBillingNotice] = useState<string | null>(null);
  const { signOut } = useClerk();
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();

  /**
   * Best-effort backend JWT link for dashboard/purchases APIs (optional for Paddle checkout).
   */
  useEffect(() => {
    if (!clerkLoaded || !clerkUser?.id) return;

    let cancelled = false;

    (async () => {
      try {
        const linkRes = await fetch('/api/auth/session-linked', {
          cache: 'no-store',
          credentials: 'include',
        });
        const linkJson = (await linkRes.json()) as {
          linked?: boolean;
          reason?: string;
        };
        if (cancelled) return;
        if (linkJson.linked || linkJson.reason === 'clerk_disabled') {
          setBillingNotice(null);
          return;
        }

        const syncRes = await fetch('/api/auth/clerk-sync', {
          method: 'POST',
          credentials: 'include',
        });
        const syncBody = (await syncRes.json().catch(() => ({}))) as {
          ok?: boolean;
          error?: string;
          code?: string;
        };
        if (cancelled) return;
        if (syncRes.ok) {
          setBillingNotice(null);
          router.refresh();
          return;
        }

        const configCodes = new Set([
          'BRIDGE_SECRET_MISSING',
          'API_URL_MISSING',
          'API_UNREACHABLE',
        ]);
        if (syncBody.code && configCodes.has(syncBody.code) && syncBody.error) {
          setBillingNotice(syncBody.error);
        } else {
          setBillingNotice(null);
        }
      } catch {
        /* ignore — Paddle checkout uses Clerk session tokens without backend cookies */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clerkLoaded, clerkUser?.id, router]);

  async function handleSignOut() {
    await signOut({ redirectUrl: '/' });
  }

  // --- Same allow-list as /admin middleware: any Clerk-linked email may match (see admin-email.ts). ---
  const showAdminEntry =
    (clerkLoaded && clientClerkUserMatchesAdmin(clerkUser)) || clerkEmailMatchesAdmin(account.email);

  const sidebarTitle = account.displayName || account.email;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 overflow-y-auto border-r border-gray-200/80 bg-white shadow-sm md:block">
        <div className="p-6">
          <div className="mb-8 border-b border-gray-200/80 pb-6">
            <Link href="/dashboard" className="group flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563eb] to-[#1e40af] shadow-lg shadow-[#2563eb]/20 transition group-hover:shadow-[#2563eb]/30">
                <Flag size={20} className="text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-gray-900">My account</h2>
                <p className="truncate text-xs text-gray-500" title={account.email}>
                  {sidebarTitle}
                </p>
                {account.displayName ? (
                  <p className="truncate text-xs text-gray-400" title={account.email}>
                    {account.email}
                  </p>
                ) : null}
              </div>
            </Link>
          </div>
          <nav className="flex flex-col gap-1" aria-label="Account">
            {navItems.map((item) => {
              const active =
                item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                    active
                      ? 'bg-[#2563eb]/10 text-[#2563eb]'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                  {active ? <ChevronRight size={16} className="ml-auto opacity-60" /> : null}
                </Link>
              );
            })}
            {showAdminEntry ? (
              <Link
                href="/admin"
                className="flex items-center gap-3 rounded-xl border border-[#2563eb]/35 bg-[#2563eb]/5 px-4 py-2.5 text-sm font-semibold text-[#2563eb] transition hover:bg-[#2563eb]/10"
              >
                <Globe size={18} aria-hidden />
                Admin Panel
              </Link>
            ) : null}
            <div className="mt-6 border-t border-gray-200/80 pt-6">
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="flex w-full items-center gap-3 rounded-xl bg-red-50/50 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                <LogOut size={18} />
                Sign out
              </button>
            </div>
          </nav>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="border-b border-gray-200/80 bg-white/90 px-4 py-4 backdrop-blur md:hidden">
          <div className="flex items-center justify-between gap-2">
            <Link href="/dashboard" className="min-w-0 truncate font-bold text-gray-900">
              My account
            </Link>
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="shrink-0 text-sm font-medium text-red-600"
            >
              Sign out
            </button>
          </div>
          <p className="mt-1 truncate text-xs text-gray-500">{account.email}</p>
          <nav className="mt-3 flex flex-wrap gap-2" aria-label="Account shortcuts">
            {navItems.map((item) => {
              const active =
                item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`rounded-lg px-2 py-1 text-xs font-medium ${
                    active ? 'bg-[#2563eb]/15 text-[#2563eb]' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            {showAdminEntry ? (
              <Link
                href="/admin"
                className="rounded-lg border border-[#2563eb]/40 bg-[#2563eb]/10 px-2 py-1 text-xs font-semibold text-[#2563eb]"
              >
                Admin Panel
              </Link>
            ) : null}
          </nav>
        </header>
        <main className="p-6 md:p-8 xl:p-12 2xl:p-14" id="dashboard-main">
          {billingNotice ? (
            <div
              role="alert"
              className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
            >
              <p className="font-semibold">Billing / login link</p>
              <p className="mt-1 text-amber-900/90">{billingNotice}</p>
              <p className="mt-2 text-xs text-amber-800/80">
                Production checklist: set <code className="rounded bg-white/80 px-1">API_URL</code> and{' '}
                <code className="rounded bg-white/80 px-1">INTERNAL_AUTH_BRIDGE_SECRET</code> on Vercel (same secret on
                the API server).
              </p>
            </div>
          ) : null}
          {showAdminEntry && pathname === '/dashboard' ? (
            <div className="mb-6 rounded-2xl border border-[#2563eb]/25 bg-gradient-to-r from-[#2563eb]/12 via-white to-white px-5 py-4 shadow-sm">
              <p className="text-sm font-semibold text-gray-900">Admin</p>
              <p className="mt-1 text-sm text-gray-600">
                Open the admin panel to manage countries, uploads, and assets.
              </p>
              <Link
                href="/admin"
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-[#2563eb] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-[#2563eb]/25 transition hover:bg-[#1d4ed8]"
              >
                Go to Admin Panel
              </Link>
            </div>
          ) : null}
          {children}
        </main>
      </div>
    </div>
  );
}
