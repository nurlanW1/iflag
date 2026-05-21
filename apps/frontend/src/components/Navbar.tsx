'use client';

import { ClerkLoaded, ClerkLoading, Show, UserButton, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { clientClerkUserMatchesAdmin } from '@/lib/auth/admin-email';
import {
  User,
  LogOut,
  Crown,
  Flag,
  Menu,
  X,
  Globe,
  Heart,
  ShoppingCart,
  LayoutGrid,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SITE_NAME } from '@/lib/seo/site-config';
import { PageShell } from '@/components/layout';

function useAuthPageLinks() {
  const pathname = usePathname() ?? '/';
  const onAuthPage =
    pathname === '/sign-in' ||
    pathname === '/sign-up' ||
    pathname.startsWith('/sign-in/') ||
    pathname.startsWith('/sign-up/');
  const suffix = onAuthPage ? '' : `?redirect_url=${encodeURIComponent(pathname)}`;
  return { signInHref: `/sign-in${suffix}`, signUpHref: `/sign-up${suffix}` };
}

type NavbarProps = {
  clerkUiEnabled?: boolean;
};

/** Rangli nav havolalar — fon bilan ajralib turishi uchun */
const navBrowse =
  'text-base font-semibold tracking-tight text-[#1565c0] transition-colors duration-200 hover:text-[#0d47a1]';
const navCategories =
  'text-base font-semibold tracking-tight text-[#0f766e] transition-colors duration-200 hover:text-[#115e59]';
const navPricing =
  'text-base font-semibold tracking-tight text-[#b45309] transition-colors duration-200 hover:text-[#92400e]';
const navCollections =
  'text-base font-semibold tracking-tight text-[#6d28d9] transition-colors duration-200 hover:text-[#5b21b6]';
const navLogin =
  'text-base font-semibold tracking-tight text-[#1565c0] transition-colors duration-200 hover:text-[#0d47a1] hover:underline underline-offset-4';

export default function Navbar({ clerkUiEnabled = true }: NavbarProps) {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { signInHref, signUpHref } = useAuthPageLinks();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const clerkAppearance = {
    elements: {
      avatarBox: 'h-11 w-11 lg:h-12 lg:w-12 ring-2 ring-[#1565c0]/35',
    },
  } as const;

  /* Oq / och kulrang fon — sahifa `#fafaf9` dan ajralishi uchun */
  const shellClass = scrolled
    ? 'border-neutral-200 bg-white shadow-[0_8px_30px_-12px_rgba(30,58,95,0.12)] backdrop-blur-md'
    : 'border-neutral-200/80 bg-white/95 shadow-[0_1px_0_rgba(30,58,95,0.06)] backdrop-blur-md';

  function DesktopAuthCluster() {
    return (
      <>
        <NavbarAdminNav clerkUiEnabled={clerkUiEnabled} legacyUser={user} />

        {user ? (
          <>
            <Link
              href="/gallery"
              className="rounded-lg p-2.5 text-[#c026d3] transition-colors hover:bg-fuchsia-50 hover:text-[#86198f]"
              aria-label="Collections"
              title="Collections"
            >
              <Heart size={24} aria-hidden />
            </Link>
            <Link
              href="/dashboard/downloads"
              className="rounded-lg p-2.5 text-[#1565c0] transition-colors hover:bg-blue-50 hover:text-[#0d47a1]"
              aria-label="Downloads"
              title="Downloads"
            >
              <ShoppingCart size={24} aria-hidden />
            </Link>
            <div className="flex items-center gap-4 border-l border-neutral-200 pl-6">
              <Link
                href="/dashboard"
                className="flex max-w-[14rem] items-center gap-2.5 text-base font-semibold text-[#1e293b] transition hover:text-[#1565c0]"
              >
                <User size={22} aria-hidden />
                <span className="hidden min-[900px]:inline truncate">{user.full_name || user.email}</span>
              </Link>
              <button
                type="button"
                onClick={() => logout()}
                className="rounded-lg p-2.5 text-[#64748b] transition hover:bg-slate-100 hover:text-[#1e293b]"
                aria-label="Sign out"
              >
                <LogOut size={22} aria-hidden />
              </button>
            </div>
          </>
        ) : clerkUiEnabled ? (
          <>
            <ClerkLoading>
              <div className="flex items-center gap-4" aria-hidden>
                <div className="h-11 w-[4.5rem] animate-pulse rounded-lg bg-neutral-200/80" />
                <div className="h-11 w-28 animate-pulse rounded-lg bg-neutral-200/80" />
                <div className="h-11 w-11 animate-pulse rounded-full bg-neutral-200/80" />
              </div>
            </ClerkLoading>
            <ClerkLoaded>
              <Show when="signed-out">
                <div className="flex items-center gap-4">
                  <Link href={signInHref} className={`${navLogin} whitespace-nowrap`}>
                    Log in
                  </Link>
                  <Link
                    href={signUpHref}
                    className="inline-flex h-11 min-h-[44px] min-w-[8rem] items-center justify-center rounded-lg bg-[#1565c0] px-7 text-base font-semibold text-white shadow-md transition-colors hover:bg-[#0d47a1]"
                  >
                    Sign up
                  </Link>
                </div>
              </Show>
              <Show when="signed-in">
                <>
                  <Link
                    href="/gallery"
                    className="rounded-lg p-2.5 text-[#c026d3] transition-colors hover:bg-fuchsia-50 hover:text-[#86198f]"
                    aria-label="Collections"
                  >
                    <Heart size={24} aria-hidden />
                  </Link>
                  <Link
                    href="/dashboard/downloads"
                    className="rounded-lg p-2.5 text-[#1565c0] transition-colors hover:bg-blue-50 hover:text-[#0d47a1]"
                    aria-label="Downloads"
                  >
                    <ShoppingCart size={24} aria-hidden />
                  </Link>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 text-base font-semibold text-[#1e293b] transition hover:text-[#1565c0]"
                  >
                    <User size={22} aria-hidden />
                    <span className="hidden min-[1100px]:inline">Dashboard</span>
                  </Link>
                  <UserButton appearance={clerkAppearance} />
                </>
              </Show>
            </ClerkLoaded>
          </>
        ) : (
          <div className="flex items-center gap-4">
            <Link href={signInHref} className={navLogin}>
              Log in
            </Link>
            <Link
              href={signUpHref}
              className="inline-flex h-11 min-h-[44px] items-center justify-center rounded-lg bg-[#1565c0] px-7 text-base font-semibold text-white shadow-md transition-colors hover:bg-[#0d47a1]"
            >
              Sign up
            </Link>
          </div>
        )}
      </>
    );
  }

  return (
    <nav
      className={`sticky top-0 z-50 w-full border-b transition-[background-color,border-color,box-shadow] duration-300 supports-[padding:max(0px)]:pt-[env(safe-area-inset-top)] ${shellClass}`}
      aria-label="Primary"
    >
      <PageShell className="!py-0">
        {/* Mobile / tablet */}
        <div className="flex flex-col py-3 lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="flex min-h-[52px] min-w-0 items-center gap-3 transition hover:opacity-90">
              <Flag size={36} className="shrink-0 text-[#c62828]" aria-hidden strokeWidth={1.75} />
              <span className="truncate bg-gradient-to-r from-[#1565c0] via-[#0f766e] to-[#6d28d9] bg-clip-text text-2xl font-bold tracking-tight text-transparent">
                {SITE_NAME}
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((o) => !o)}
              className="inline-flex min-h-[48px] min-w-[48px] touch-manipulation items-center justify-center rounded-lg text-[#1e293b] transition hover:bg-slate-100"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav-menu"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X size={28} aria-hidden /> : <Menu size={28} aria-hidden />}
            </button>
          </div>
        </div>

        {/* Desktop */}
        <div className="hidden min-h-[72px] flex-row items-center gap-6 py-4 xl:gap-8 lg:flex">
          <Link href="/" className="flex shrink-0 items-center gap-3 transition hover:opacity-90">
            <Flag size={40} className="shrink-0 text-[#c62828]" aria-hidden strokeWidth={1.75} />
            <span className="bg-gradient-to-r from-[#1565c0] via-[#0f766e] to-[#6d28d9] bg-clip-text text-[1.65rem] font-bold tracking-tight text-transparent">
              {SITE_NAME}
            </span>
          </Link>

          <nav className="hidden shrink-0 items-center gap-8 xl:gap-9 lg:flex" aria-label="Main navigation">
            <Link href="/browse" className={navBrowse}>
              Browse
            </Link>
            <Link href="/#catalog-categories" className={navCategories}>
              Categories
            </Link>
            <Link href="/pricing" className={`flex items-center gap-2 ${navPricing}`} title="Plans — Paddle checkout">
              <Crown size={19} className="text-[#ca8a04]" aria-hidden strokeWidth={1.75} />
              Pricing
            </Link>
            <Link href="/gallery" className={navCollections}>
              Collections
            </Link>
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-4 lg:gap-5">
            <DesktopAuthCluster />
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen ? (
            <motion.div
              id="mobile-nav-menu"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-neutral-200 bg-white lg:hidden"
            >
              <div className="space-y-1 py-4">
                <Link
                  href="/browse"
                  className="flex items-center gap-3 px-4 py-3.5 text-base font-semibold text-[#1565c0] hover:bg-blue-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LayoutGrid size={20} aria-hidden />
                  Browse
                </Link>
                <Link
                  href="/#catalog-categories"
                  className="block px-4 py-3.5 text-base font-semibold text-[#0f766e] hover:bg-teal-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Categories
                </Link>
                <Link
                  href="/pricing"
                  className="flex items-center gap-3 px-4 py-3.5 text-base font-semibold text-[#b45309] hover:bg-amber-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Crown size={20} className="text-[#ca8a04]" aria-hidden />
                  Pricing
                </Link>
                <Link
                  href="/gallery"
                  className="block px-4 py-3.5 text-base font-semibold text-[#6d28d9] hover:bg-violet-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Collections
                </Link>

                <NavbarAdminNav clerkUiEnabled={clerkUiEnabled} legacyUser={user} onNavigate={() => setMobileMenuOpen(false)} />

                {user ? (
                  <>
                    <Link
                      href="/gallery"
                      className="block px-4 py-3.5 text-base font-semibold text-[#6d28d9] hover:bg-violet-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Saved collections
                    </Link>
                    <Link
                      href="/dashboard/downloads"
                      className="block px-4 py-3.5 text-base font-semibold text-[#1565c0] hover:bg-blue-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Downloads
                    </Link>
                    <Link
                      href="/dashboard"
                      className="block px-4 py-3.5 text-base font-semibold text-[#1e293b] hover:bg-slate-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        void logout();
                      }}
                      className="block w-full px-4 py-3.5 text-left text-base font-semibold text-[#64748b] hover:bg-slate-100"
                    >
                      Sign out
                    </button>
                  </>
                ) : clerkUiEnabled ? (
                  <>
                    <ClerkLoading>
                      <div className="space-y-2 px-4" aria-hidden>
                        <div className="h-11 w-full animate-pulse rounded-lg bg-neutral-200/80" />
                        <div className="h-11 w-full animate-pulse rounded-lg bg-neutral-200/80" />
                      </div>
                    </ClerkLoading>
                    <ClerkLoaded>
                      <Show when="signed-out">
                        <div className="mt-2 flex flex-col gap-2 px-4 pb-4">
                          <Link
                            href={signInHref}
                            className="py-2 text-base font-semibold text-[#1565c0]"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            Log in
                          </Link>
                          <Link
                            href={signUpHref}
                            className="flex min-h-11 w-full items-center justify-center rounded-lg bg-[#1565c0] py-3 text-center text-base font-semibold text-white shadow-md"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            Sign up
                          </Link>
                        </div>
                      </Show>
                      <Show when="signed-in">
                        <div className="mt-2 space-y-1 px-4 pb-4">
                          <Link
                            href="/dashboard/downloads"
                            className="block py-2 text-base font-semibold text-[#1565c0]"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            Downloads
                          </Link>
                          <Link
                            href="/dashboard"
                            className="block py-2 text-base font-semibold text-[#1e293b]"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            Dashboard
                          </Link>
                          <div className="flex items-center justify-between pt-3">
                            <span className="text-base font-medium text-neutral-600">Account</span>
                            <UserButton appearance={clerkAppearance} />
                          </div>
                        </div>
                      </Show>
                    </ClerkLoaded>
                  </>
                ) : (
                  <div className="mt-2 flex flex-col gap-2 px-4 pb-6">
                    <Link
                      href={signInHref}
                      className="py-2 text-base font-semibold text-[#1565c0]"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Log in
                    </Link>
                    <Link
                      href={signUpHref}
                      className="flex min-h-11 items-center justify-center rounded-lg bg-[#1565c0] py-3 text-center text-base font-semibold text-white shadow-md"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign up
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </PageShell>
    </nav>
  );
}

function NavbarAdminNav({
  clerkUiEnabled,
  legacyUser,
  onNavigate,
}: {
  clerkUiEnabled: boolean;
  legacyUser: { role?: string } | null | undefined;
  onNavigate?: () => void;
}) {
  if (!clerkUiEnabled && legacyUser?.role === 'admin') {
    return <AdminNavLink variant={onNavigate ? 'mobile' : 'desktop'} onNavigate={onNavigate} />;
  }
  if (!clerkUiEnabled) {
    return null;
  }
  return (
    <ClerkLoaded>
      <Show when="signed-in">
        <ClerkAdminNavLink onNavigate={onNavigate} />
      </Show>
    </ClerkLoaded>
  );
}

function ClerkAdminNavLink({ onNavigate }: { onNavigate?: () => void }) {
  const { user, isLoaded } = useUser();
  if (!isLoaded) return null;
  if (!clientClerkUserMatchesAdmin(user)) return null;
  return <AdminNavLink variant={onNavigate ? 'mobile' : 'desktop'} onNavigate={onNavigate} />;
}

function AdminNavLink({
  onNavigate,
  variant = 'desktop',
}: {
  onNavigate?: () => void;
  variant?: 'desktop' | 'mobile';
}) {
  if (variant === 'mobile') {
    return (
      <Link
        href="/admin"
        className="flex items-center gap-3 px-4 py-3 text-base font-semibold text-[#059669] hover:bg-emerald-50"
        title="Admin panel"
        onClick={onNavigate}
      >
        <Globe size={20} aria-hidden />
        Admin panel
      </Link>
    );
  }
  return (
    <Link
      href="/admin"
      className="inline-flex items-center gap-2 rounded-lg border-2 border-[#059669]/40 bg-emerald-50/80 px-4 py-2 text-base font-semibold text-[#047857] shadow-sm transition hover:border-[#059669] hover:bg-emerald-50"
      title="Admin panel"
      onClick={onNavigate}
    >
      <Globe size={20} aria-hidden />
      <span className="hidden sm:inline">Admin</span>
    </Link>
  );
}
