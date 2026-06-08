'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
import { probeClerkBackendSessionLinked } from '@/lib/auth/clerk-session-bridge.client';

const navItems: { href: string; label: string; icon: typeof User }[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
  { href: '/dashboard/purchases', label: 'Purchased files', icon: Package },
  { href: '/dashboard/downloads', label: 'Downloads', icon: Download },
  { href: '/dashboard/subscription', label: 'Billing', icon: CreditCard },
];

export function DashboardShell({
  account,
  children,
}: {
  account: DashboardAccount;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [billingNotice, setBillingNotice] = useState<string | null>(null);
  const { signOut } = useClerk();
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();

  /**
   * Best-effort backend JWT link for dashboard/purchases APIs (optional for Paddle checkout).
   */
  useEffect(() => {
    if (!clerkLoaded || !clerkUser?.id) return;

    let cancelled = false;

    void probeClerkBackendSessionLinked().then(({ linked, reason }) => {
      if (cancelled) return;
      if (linked || reason === 'clerk_disabled') {
        setBillingNotice(null);
        return;
      }
      setBillingNotice(
        'Dashboard purchases use a separate server session. If billing looks wrong, sign out and back in once.',
      );
    });

    return () => {
      cancelled = true;
    };
  }, [clerkLoaded, clerkUser?.id]);

  async function handleSignOut() {
    await signOut({ redirectUrl: '/' });
  }

  // --- Same allow-list as /admin middleware: any Clerk-linked email may match (see admin-email.ts). ---
  const showAdminEntry =
    (clerkLoaded && clientClerkUserMatchesAdmin(clerkUser)) || clerkEmailMatchesAdmin(account.email);

  const sidebarTitle = account.displayName || account.email;

  return (
    <div className="flex min-h-screen bg-[#fafaf9]">
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 overflow-y-auto border-r border-neutral-200/80 bg-white shadow-sm md:block">
        <div className="p-6">
          <div className="mb-8 border-b border-neutral-200/80 pb-6">
            <Link href="/dashboard" className="group flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-blue)] shadow-sm transition group-hover:shadow-md">
                <Flag size={20} className="text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-[#2a2a2a]">My account</h2>
                <p className="truncate text-xs text-neutral-500" title={account.email}>
                  {sidebarTitle}
                </p>
                {account.displayName ? (
                  <p className="truncate text-xs text-neutral-400" title={account.email}>
                    {account.email}
                  </p>
                ) : null}
              </div>
            </Link>
          </div>
          <nav className="flex flex-col gap-0.5" aria-label="Account">
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
                      ? 'bg-[var(--brand-blue-soft)] text-[var(--brand-blue)]'
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-[#2a2a2a]'
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
            <div className="mt-6 border-t border-neutral-200/80 pt-6">
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
        <header className="border-b border-neutral-200/80 bg-white/90 px-4 py-4 backdrop-blur md:hidden">
          <div className="flex items-center justify-between gap-2">
            <Link href="/dashboard" className="min-w-0 truncate font-semibold text-[#2a2a2a]">
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
          <p className="mt-1 truncate text-xs text-neutral-400">{account.email}</p>
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
                    active ? 'bg-[var(--brand-blue-soft)] text-[var(--brand-blue)]' : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            {showAdminEntry ? (
              <Link
                href="/admin"
                className="rounded-lg border border-[var(--brand-blue)]/40 bg-[var(--brand-blue-soft)] px-2 py-1 text-xs font-semibold text-[var(--brand-blue)]"
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
                Production checklist: set{' '}
                <code className="rounded bg-white/80 px-1">NEXT_PUBLIC_API_URL</code> to your Railway backend
                (…/api) and{' '}
                <code className="rounded bg-white/80 px-1">INTERNAL_AUTH_BRIDGE_SECRET</code> on Vercel (same secret on
                the API server).
              </p>
            </div>
          ) : null}
          {showAdminEntry && pathname === '/dashboard' ? (
            <div className="mb-6 rounded-2xl border border-[var(--brand-blue)]/20 bg-[var(--brand-blue-soft)] px-5 py-4 shadow-sm">
              <p className="text-sm font-semibold text-[#2a2a2a]">Admin</p>
              <p className="mt-1 text-sm text-neutral-500">
                Open the admin panel to manage countries, uploads, and assets.
              </p>
              <Link
                href="/admin"
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-[var(--brand-blue)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--brand-blue-hover)]"
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
