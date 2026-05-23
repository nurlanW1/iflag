'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Upload,
  Package,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Flag,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Spinner } from '@/components/ui/Spinner';

import { useAuth } from '@/contexts/AuthContext';
import { useUser, useClerk } from '@clerk/nextjs';

import { getClerkPublishableKey } from '@/lib/auth/clerk-env';
import { clientClerkUserMatchesAdmin } from '@/lib/auth/admin-email';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const clerkUiEnabled = Boolean(getClerkPublishableKey());

  // --- When Clerk is configured, admin access is enforced in middleware via allow-list + Clerk session. ---
  if (clerkUiEnabled) {
    return <AdminLayoutClerk>{children}</AdminLayoutClerk>;
  }

  // --- Legacy: JWT/cookie admin role when Clerk keys are not present (local or transitional deploys). ---
  return <AdminLayoutLegacy>{children}</AdminLayoutLegacy>;
}

function AdminLayoutClerk({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();

  const primaryEmail =
    user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress ?? '';
  const isAdminUser = clientClerkUserMatchesAdmin(user);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      const target = pathname ? encodeURIComponent(pathname) : '%2Fadmin';
      router.replace(`/sign-in?redirect_url=${target}`);
      return;
    }
    // --- Client-side defense: any Clerk-linked email on the allow-list (see admin-email.ts). ---
    if (!clientClerkUserMatchesAdmin(user)) {
      router.replace('/access-denied?reason=forbidden');
    }
  }, [isLoaded, isSignedIn, user, pathname, router]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <Spinner size="lg" label="Loading admin" />
      </div>
    );
  }

  if (!isSignedIn || !isAdminUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <Spinner size="lg" label="Redirecting" />
      </div>
    );
  }

  return (
    <AdminChrome
      userEmail={primaryEmail}
      onSignOut={() => void signOut(() => router.push('/'))}
    >
      {children}
    </AdminChrome>
  );
}

function AdminLayoutLegacy({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login?callbackUrl=%2Fadmin');
      return;
    }
    // --- Legacy admin gate: role on session from custom auth API (not Clerk). ---
    if (user.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <Spinner size="lg" label="Loading admin" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <Spinner size="lg" label="Redirecting" />
      </div>
    );
  }

  return (
    <AdminChrome userEmail={user.email} onSignOut={() => void logout()}>
      {children}
    </AdminChrome>
  );
}

function AdminChrome({
  children,
  userEmail,
  onSignOut,
}: {
  children: ReactNode;
  userEmail: string;
  onSignOut: () => void;
}) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 supports-[padding:max(0px)]:min-h-[100dvh]">
      {mobileNavOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] md:hidden"
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-[100dvh] w-[min(18rem,calc(100vw-2.5rem))] max-w-[85vw] flex-col overflow-y-auto overscroll-contain border-r border-gray-200/80 bg-white shadow-xl transition-transform duration-200 ease-out md:sticky md:top-0 md:z-auto md:max-w-none md:h-screen md:w-72 md:shrink-0 md:translate-x-0 md:shadow-sm ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        aria-label="Admin navigation"
        id="admin-sidebar"
      >
        <div className="flex items-center justify-between gap-2 border-b border-gray-200/80 p-4 md:hidden">
          <span className="truncate text-sm font-semibold text-gray-900">Menu</span>
          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 touch-manipulation items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100"
            aria-controls="admin-sidebar"
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen(false)}
          >
            <X size={22} aria-hidden />
          </button>
        </div>
        <div className="p-4 sm:p-6">
          <div className="mb-6 hidden border-b border-gray-200/80 pb-6 md:block">
            <Link href="/admin" className="group mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563eb] to-[#1e40af] shadow-lg shadow-[#2563eb]/20 transition-all group-hover:shadow-xl group-hover:shadow-[#2563eb]/30">
                <Flag size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Admin</h2>
                <p className="text-xs text-gray-500">{userEmail}</p>
              </div>
            </Link>
          </div>

          <div className="mb-6 border-b border-gray-200/80 pb-6 md:hidden">
            <Link
              href="/admin"
              className="group flex items-center gap-3"
              onClick={() => setMobileNavOpen(false)}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563eb] to-[#1e40af] shadow-lg shadow-[#2563eb]/20">
                <Flag size={20} className="text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-gray-900">Admin</h2>
                <p className="truncate text-xs text-gray-500" title={userEmail}>
                  {userEmail}
                </p>
              </div>
            </Link>
          </div>

          <nav className="flex flex-col gap-1.5" aria-label="Admin sections">
            <AdminNavLink
              href="/admin"
              icon={LayoutDashboard}
              active={pathname === '/admin'}
              onNavigate={() => setMobileNavOpen(false)}
            >
              Dashboard
            </AdminNavLink>
            <AdminNavLink
              href="/admin/countries"
              icon={Flag}
              active={pathname?.startsWith('/admin/countries') ?? false}
              onNavigate={() => setMobileNavOpen(false)}
            >
              Countries
            </AdminNavLink>
            <AdminNavLink
              href="/admin/upload"
              icon={Upload}
              active={pathname === '/admin/upload'}
              onNavigate={() => setMobileNavOpen(false)}
            >
              Upload Assets
            </AdminNavLink>
            <AdminNavLink
              href="/admin/assets"
              icon={Package}
              active={pathname?.startsWith('/admin/assets') ?? false}
              onNavigate={() => setMobileNavOpen(false)}
            >
              Manage Assets
            </AdminNavLink>
            <AdminNavLink
              href="/admin/subscriptions"
              icon={Users}
              active={pathname?.startsWith('/admin/subscriptions') ?? false}
              onNavigate={() => setMobileNavOpen(false)}
            >
              Subscriptions
            </AdminNavLink>
            <AdminNavLink
              href="/admin/analytics"
              icon={BarChart3}
              active={pathname?.startsWith('/admin/analytics') ?? false}
              onNavigate={() => setMobileNavOpen(false)}
            >
              Analytics
            </AdminNavLink>
            <AdminNavLink
              href="/admin/settings"
              icon={Settings}
              active={pathname?.startsWith('/admin/settings') ?? false}
              onNavigate={() => setMobileNavOpen(false)}
            >
              Settings
            </AdminNavLink>

            <div className="mt-6 border-t border-gray-200/80 pt-6">
              <button
                type="button"
                onClick={onSignOut}
                className="group flex w-full items-center gap-3 rounded-xl bg-red-50/50 px-4 py-2.5 text-sm font-medium text-red-600 transition-all duration-200 hover:bg-red-50"
              >
                <LogOut size={18} className="transition-transform group-hover:scale-110" aria-hidden />
                Sign out
              </button>
            </div>
          </nav>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col pb-[env(safe-area-inset-bottom)]">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-gray-200/80 bg-white/95 px-3 py-3 backdrop-blur-md supports-[padding:max(0px)]:pt-[max(0.75rem,env(safe-area-inset-top))] md:hidden">
          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 touch-manipulation items-center justify-center rounded-lg text-gray-800 hover:bg-gray-100"
            aria-controls="admin-sidebar"
            aria-expanded={mobileNavOpen}
            aria-label="Open admin navigation"
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu size={22} aria-hidden />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-gray-900">Admin</p>
            <p className="truncate text-xs text-gray-500">{userEmail}</p>
          </div>
        </header>
        <main className="min-h-screen flex-1" id="admin-main">
          <div className="p-5 sm:p-7 lg:p-10 xl:p-12">{children}</div>
        </main>
      </div>
    </div>
  );
}

function AdminNavLink({
  href,
  icon: Icon,
  children,
  active,
  onNavigate,
}: {
  href: string;
  icon: LucideIcon;
  children: ReactNode;
  active?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link href={href} aria-current={active ? 'page' : undefined} onClick={onNavigate}>
      <motion.div
        whileHover={{ x: 4 }}
        whileTap={{ scale: 0.98 }}
        className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
          active
            ? 'bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] text-white shadow-lg shadow-[#2563eb]/20'
            : 'text-gray-700 hover:bg-gray-50 hover:text-[#2563eb]'
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon size={18} className={active ? 'text-white' : 'text-gray-500 group-hover:text-[#2563eb]'} />
          <span>{children}</span>
        </div>
        {active && <ChevronRight size={16} className="text-white/80" />}
      </motion.div>
    </Link>
  );
}
