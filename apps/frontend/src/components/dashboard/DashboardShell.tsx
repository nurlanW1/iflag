'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  const { signOut } = useClerk();
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();

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
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#009ab6] to-[#006d7a] shadow-lg shadow-[#009ab6]/20 transition group-hover:shadow-[#009ab6]/30">
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
                      ? 'bg-[#009ab6]/10 text-[#009ab6]'
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
                className="flex items-center gap-3 rounded-xl border border-[#009ab6]/35 bg-[#009ab6]/5 px-4 py-2.5 text-sm font-semibold text-[#009ab6] transition hover:bg-[#009ab6]/10"
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
                    active ? 'bg-[#009ab6]/15 text-[#009ab6]' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            {showAdminEntry ? (
              <Link
                href="/admin"
                className="rounded-lg border border-[#009ab6]/40 bg-[#009ab6]/10 px-2 py-1 text-xs font-semibold text-[#009ab6]"
              >
                Admin Panel
              </Link>
            ) : null}
          </nav>
        </header>
        <main className="p-6 lg:p-8" id="dashboard-main">
          {showAdminEntry && pathname === '/dashboard' ? (
            <div className="mb-6 rounded-2xl border border-[#009ab6]/25 bg-gradient-to-r from-[#009ab6]/12 via-white to-white px-5 py-4 shadow-sm">
              <p className="text-sm font-semibold text-gray-900">Admin</p>
              <p className="mt-1 text-sm text-gray-600">
                Open the admin panel to manage countries, uploads, and assets.
              </p>
              <Link
                href="/admin"
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-[#009ab6] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-[#009ab6]/25 transition hover:bg-[#007a8a]"
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
