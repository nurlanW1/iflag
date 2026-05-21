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
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SITE_NAME } from '@/lib/seo/site-config';
import { PageShell } from '@/components/layout';
import { NavbarSearch } from '@/components/marketplace/NavbarSearch';

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

const navLinkClass =
  'text-base font-semibold tracking-tight text-white/85 transition-colors hover:text-white';

export default function Navbar({ clerkUiEnabled = true }: NavbarProps) {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { signInHref, signUpHref } = useAuthPageLinks();

  const clerkAppearance = {
    elements: {
      avatarBox: 'h-11 w-11 lg:h-12 lg:w-12 ring-2 ring-white/35',
    },
  } as const;

  function DesktopAuthCluster() {
    return (
      <>
        <NavbarAdminNav clerkUiEnabled={clerkUiEnabled} legacyUser={user} />

        {user ? (
          <>
            <Link
              href="/gallery"
              className="rounded-xl p-2.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Collections & gallery"
              title="Gallery"
            >
              <Heart size={26} aria-hidden />
            </Link>
            <Link
              href="/dashboard/downloads"
              className="rounded-xl p-2.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Downloads"
              title="Downloads"
            >
              <ShoppingCart size={26} aria-hidden />
            </Link>
            <div className="flex items-center gap-4 border-l border-white/15 pl-8">
              <Link
                href="/dashboard"
                className="flex max-w-[14rem] items-center gap-2.5 text-base font-semibold text-white/90 transition hover:text-white"
              >
                <User size={24} aria-hidden />
                <span className="hidden min-[900px]:inline truncate">{user.full_name || user.email}</span>
              </Link>
              <button
                type="button"
                onClick={() => logout()}
                className="rounded-xl p-2.5 text-white/55 transition hover:bg-white/10 hover:text-white"
                aria-label="Sign out"
              >
                <LogOut size={24} aria-hidden />
              </button>
            </div>
          </>
        ) : clerkUiEnabled ? (
          <>
            <ClerkLoading>
              <div className="flex items-center gap-4" aria-hidden>
                <div className="h-12 w-[4.5rem] animate-pulse rounded-lg bg-white/10" />
                <div className="h-12 w-28 animate-pulse rounded-xl bg-white/10" />
                <div className="h-12 w-12 animate-pulse rounded-full bg-white/10" />
              </div>
            </ClerkLoading>
            <ClerkLoaded>
              <Show when="signed-out">
                <div className="flex items-center gap-5">
                  <Link href={signInHref} className={`${navLinkClass} whitespace-nowrap`}>
                    Log in
                  </Link>
                  <Link
                    href={signUpHref}
                    className="inline-flex h-12 min-h-[48px] min-w-[8rem] items-center justify-center rounded-xl bg-[#009ab6] px-8 text-base font-bold text-white shadow-lg shadow-black/25 transition hover:bg-[#00b4d4]"
                  >
                    Sign up
                  </Link>
                </div>
              </Show>
              <Show when="signed-in">
                <>
                  <Link
                    href="/gallery"
                    className="rounded-xl p-2.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                    aria-label="Collections & gallery"
                  >
                    <Heart size={26} aria-hidden />
                  </Link>
                  <Link
                    href="/dashboard/downloads"
                    className="rounded-xl p-2.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                    aria-label="Downloads"
                  >
                    <ShoppingCart size={26} aria-hidden />
                  </Link>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2.5 text-base font-semibold text-white/90 transition hover:text-white"
                  >
                    <User size={24} aria-hidden />
                    <span className="hidden min-[1100px]:inline">Dashboard</span>
                  </Link>
                  <UserButton appearance={clerkAppearance} />
                </>
              </Show>
            </ClerkLoaded>
          </>
        ) : (
          <div className="flex items-center gap-5">
            <Link href={signInHref} className={navLinkClass}>
              Log in
            </Link>
            <Link
              href={signUpHref}
              className="inline-flex h-12 min-h-[48px] items-center justify-center rounded-xl bg-[#009ab6] px-8 text-base font-bold text-white shadow-lg transition hover:bg-[#00b4d4]"
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
      className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#080f18]/98 shadow-[0_12px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl supports-[padding:max(0px)]:pt-[env(safe-area-inset-top)]"
      aria-label="Primary"
    >
      <PageShell className="!py-0">
        {/* Mobile / tablet */}
        <div className="flex flex-col gap-4 py-4 lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="flex min-h-[52px] min-w-0 items-center gap-3 text-white transition hover:text-white">
              <Flag size={40} className="shrink-0 text-[#5ce1f7]" aria-hidden />
              <span className="truncate text-2xl font-black tracking-tight">{SITE_NAME}</span>
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((o) => !o)}
              className="inline-flex min-h-[48px] min-w-[48px] touch-manipulation items-center justify-center rounded-xl text-white transition hover:bg-white/10"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav-menu"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X size={30} aria-hidden /> : <Menu size={30} aria-hidden />}
            </button>
          </div>
          <NavbarSearch compact />
        </div>

        {/* Desktop marketplace header */}
        <div className="hidden min-h-[88px] flex-row items-center gap-10 py-5 lg:flex">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-3 text-white transition hover:text-white"
          >
            <Flag size={44} className="shrink-0 text-[#5ce1f7]" aria-hidden />
            <span className="text-3xl font-black tracking-tight">{SITE_NAME}</span>
          </Link>

          <nav className="hidden shrink-0 items-center gap-10 lg:flex" aria-label="Main navigation">
            <Link href="/browse" className={navLinkClass}>
              Browse
            </Link>
            <Link href="/#catalog-categories" className={navLinkClass}>
              Categories
            </Link>
            <Link href="/gallery" className={navLinkClass}>
              Gallery
            </Link>
            <Link href="/pricing" className={`flex items-center gap-2 ${navLinkClass}`} title="Plans — Paddle checkout">
              <Crown size={22} className="text-[#5ce1f7]" aria-hidden />
              Pricing
            </Link>
          </nav>

          <div className="mx-auto min-w-0 max-w-[52rem] flex-1 px-2">
            <NavbarSearch />
          </div>

          <div className="flex shrink-0 items-center gap-5 lg:gap-6">
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
              className="overflow-hidden border-t border-white/10 bg-[#0c1624] lg:hidden"
            >
              <div className="space-y-1 py-5">
                <Link
                  href="/browse"
                  className="flex items-center gap-3 px-5 py-3.5 text-lg font-semibold text-white/90 hover:bg-white/[0.06]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LayoutGrid size={22} aria-hidden />
                  Browse
                </Link>
                <Link
                  href="/#catalog-categories"
                  className="block px-5 py-3.5 text-lg font-semibold text-white/90 hover:bg-white/[0.06]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Categories
                </Link>
                <Link
                  href="/gallery"
                  className="block px-5 py-3.5 text-lg font-semibold text-white/90 hover:bg-white/[0.06]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Gallery
                </Link>
                <Link
                  href="/pricing"
                  className="flex items-center gap-3 px-5 py-3.5 text-lg font-semibold text-white/90 hover:bg-white/[0.06]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Crown size={22} className="text-[#5ce1f7]" aria-hidden />
                  Pricing
                </Link>

                <NavbarAdminNav clerkUiEnabled={clerkUiEnabled} legacyUser={user} onNavigate={() => setMobileMenuOpen(false)} />

                {user ? (
                  <>
                    <Link
                      href="/gallery"
                      className="block px-5 py-3.5 text-lg font-semibold text-white/90 hover:bg-white/[0.06]"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Collections
                    </Link>
                    <Link
                      href="/dashboard/downloads"
                      className="block px-5 py-3.5 text-lg font-semibold text-white/90 hover:bg-white/[0.06]"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Downloads
                    </Link>
                    <Link
                      href="/dashboard"
                      className="block px-5 py-3.5 text-lg font-semibold text-white/90 hover:bg-white/[0.06]"
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
                      className="block w-full px-5 py-3.5 text-left text-lg font-semibold text-white/90 hover:bg-white/[0.06]"
                    >
                      Sign out
                    </button>
                  </>
                ) : clerkUiEnabled ? (
                  <>
                    <ClerkLoading>
                      <div className="space-y-2 px-5" aria-hidden>
                        <div className="h-12 w-full animate-pulse rounded-xl bg-white/10" />
                        <div className="h-12 w-full animate-pulse rounded-xl bg-white/10" />
                      </div>
                    </ClerkLoading>
                    <ClerkLoaded>
                      <Show when="signed-out">
                        <div className="mt-4 flex flex-col gap-3 px-5">
                          <Link
                            href={signInHref}
                            className="block py-2 text-lg font-semibold text-white/88 hover:text-white"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            Log in
                          </Link>
                          <Link
                            href={signUpHref}
                            className="flex min-h-[3.25rem] w-full items-center justify-center rounded-xl bg-[#009ab6] py-3.5 text-center text-lg font-bold text-white hover:bg-[#00b4d4]"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            Sign up
                          </Link>
                        </div>
                      </Show>
                      <Show when="signed-in">
                        <div className="mt-4 space-y-2 px-5 pb-4">
                          <Link
                            href="/dashboard/downloads"
                            className="block py-2 text-lg font-semibold text-white/88 hover:text-white"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            Downloads
                          </Link>
                          <Link
                            href="/dashboard"
                            className="block py-2 text-lg font-semibold text-white/88 hover:text-white"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            Dashboard
                          </Link>
                          <div className="flex items-center justify-between pt-2">
                            <span className="text-lg font-semibold text-white/80">Account</span>
                            <UserButton appearance={clerkAppearance} />
                          </div>
                        </div>
                      </Show>
                    </ClerkLoaded>
                  </>
                ) : (
                  <div className="mt-4 flex flex-col gap-3 px-5 pb-6">
                    <Link
                      href={signInHref}
                      className="block py-2 text-lg font-semibold text-white/88"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Log in
                    </Link>
                    <Link
                      href={signUpHref}
                      className="flex min-h-[3.25rem] items-center justify-center rounded-xl bg-[#009ab6] py-3.5 text-center text-lg font-bold text-white hover:bg-[#00b4d4]"
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
        className="flex items-center gap-3 px-5 py-3 text-lg font-semibold text-[#82f0ff] hover:bg-white/[0.06] hover:text-white"
        title="Admin panel"
        onClick={onNavigate}
      >
        <Globe size={22} aria-hidden />
        Admin Panel
      </Link>
    );
  }
  return (
    <Link
      href="/admin"
      className="inline-flex items-center gap-2 rounded-xl border border-[#5ce1f7]/45 bg-[#009ab6]/15 px-5 py-2.5 text-base font-semibold text-[#c9fbff] transition hover:border-[#5ce1f7] hover:bg-[#009ab6]/30"
      title="Admin panel"
      onClick={onNavigate}
    >
      <Globe size={22} aria-hidden />
      <span className="hidden sm:inline">Admin</span>
    </Link>
  );
}
