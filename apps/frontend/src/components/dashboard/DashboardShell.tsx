'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ChevronRight,
  CreditCard,
  Download,
  Flag,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  User,
} from 'lucide-react';
import type { SessionUser } from '@/lib/auth/session.server';

const navItems: { href: string; label: string; icon: typeof User }[] = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
  { href: '/dashboard/purchases', label: 'Your files', icon: Package },
  { href: '/dashboard/downloads', label: 'Downloads', icon: Download },
  { href: '/dashboard/subscription', label: 'Subscription', icon: CreditCard },
  { href: '/dashboard/settings', label: 'Account settings', icon: Settings },
];

export function DashboardShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    try {
      await fetch('/api/auth/sign-out', { method: 'POST', credentials: 'include' });
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
      router.push('/');
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 overflow-y-auto border-r border-gray-200/80 bg-white shadow-sm md:block">
        <div className="p-6">
          <div className="mb-8 border-b border-gray-200/80 pb-6">
            <Link href="/dashboard" className="group flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#009ab6] to-[#006d7a] shadow-lg shadow-[#009ab6]/20 transition group-hover:shadow-[#009ab6]/30">
                <Flag size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">My account</h2>
                <p className="text-xs text-gray-500">{user.email}</p>
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
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="font-bold text-gray-900">
              My account
            </Link>
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="text-sm font-medium text-red-600"
            >
              Sign out
            </button>
          </div>
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
          </nav>
        </header>
        <main className="p-6 lg:p-8" id="dashboard-main">
          {children}
        </main>
      </div>
    </div>
  );
}
