'use client';

import { ClerkLoaded, ClerkLoading, Show, UserButton, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { clientClerkUserMatchesAdmin } from '@/lib/auth/admin-email';
import { User, LogOut, Crown, Flag, Menu, X, Globe, Heart, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
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
  /** When false (no Clerk publishable key), skip Clerk UI to avoid runtime errors outside ClerkProvider. */
  clerkUiEnabled?: boolean;
};

export default function Navbar({ clerkUiEnabled = true }: NavbarProps) {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { signInHref, signUpHref } = useAuthPageLinks();

  const clerkAppearance = {
    elements: {
      avatarBox: 'h-11 w-11 ring-2 ring-white/30',
    },
  } as const;

  return (
    <nav
      className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0a1628]/97 shadow-[0_10px_34px_rgba(0,0,0,0.48)] backdrop-blur-lg supports-[padding:max(0px)]:pt-[env(safe-area-inset-top)]"
      aria-label="Primary"
    >
      <PageShell>
        <div className="flex w-full min-w-0 items-center justify-between gap-3 py-5 md:gap-10 lg:gap-12 lg:py-[1.4rem]">
          <Link
            href="/"
            className="flex min-h-[48px] min-w-0 items-center gap-3 text-white transition hover:text-white"
          >
            <Flag size={38} className="shrink-0 text-[#5ce1f7]" aria-hidden />
            <span className="truncate text-2xl font-black tracking-tight sm:text-[1.75rem] lg:text-3xl">
              {SITE_NAME}
            </span>
          </Link>

          <div className="hidden items-center md:flex xl:gap-14">
            <div className="flex items-center gap-10 xl:gap-11">
              <Link
                href="/browse"
                className="text-base font-semibold tracking-tight text-white/82 transition-colors hover:text-white xl:text-[1.06rem]"
              >
                Browse
              </Link>
              <Link
                href="/gallery"
                className="text-base font-semibold tracking-tight text-white/82 transition-colors hover:text-white xl:text-[1.06rem]"
              >
                Gallery
              </Link>
              <Link
                href="/pricing"
                title="Compare plans — Paddle checkout"
                className="flex items-center gap-2 text-base font-semibold tracking-tight text-white/82 transition-colors hover:text-white xl:text-[1.06rem]"
              >
                <Crown size={21} className="text-[#5ce1f7]" aria-hidden />
                Pricing
              </Link>
            </div>

            <div className="ml-2 flex items-center gap-6 border-l border-white/12 pl-10 xl:gap-7">
              <NavbarAdminNav clerkUiEnabled={clerkUiEnabled} legacyUser={user} />

              {user ? (
                <>
                  <button
                    type="button"
                    className="rounded-lg p-2 text-white/55 transition-colors hover:bg-white/8 hover:text-white disabled:opacity-40"
                    aria-label="Favorites (coming soon)"
                    disabled
                  >
                    <Heart size={26} aria-hidden />
                  </button>
                  <button
                    type="button"
                    className="rounded-lg p-2 text-white/55 transition-colors hover:bg-white/8 hover:text-white disabled:opacity-40"
                    aria-label="Cart (coming soon)"
                    disabled
                  >
                    <ShoppingCart size={26} aria-hidden />
                  </button>
                  <div className="flex items-center gap-4">
                    <Link
                      href="/dashboard"
                      className="flex max-w-[14rem] items-center gap-2.5 text-base font-semibold text-white/88 transition hover:text-white"
                    >
                      <User size={22} aria-hidden />
                      <span className="hidden min-[900px]:inline truncate">{user.full_name || user.email}</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => logout()}
                      className="rounded-lg p-2 text-white/55 transition hover:bg-white/8 hover:text-white"
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
                      <div className="h-12 w-[4.5rem] animate-pulse rounded-lg bg-white/10" />
                      <div className="h-12 w-28 animate-pulse rounded-xl bg-white/10" />
                      <div className="h-12 w-12 animate-pulse rounded-full bg-white/10" />
                    </div>
                  </ClerkLoading>
                  <ClerkLoaded>
                    <Show when="signed-out">
                      <div className="flex items-center gap-5">
                        <Link
                          href={signInHref}
                          className="text-base font-semibold text-white/88 transition hover:text-white"
                        >
                          Log in
                        </Link>
                        <Link
                          href={signUpHref}
                          className="inline-flex h-12 min-w-[7.5rem] items-center justify-center rounded-xl bg-[#009ab6] px-8 text-base font-bold text-white shadow-lg shadow-black/25 transition hover:bg-[#00a8c5] hover:shadow-xl"
                        >
                          Sign up
                        </Link>
                      </div>
                    </Show>
                    <Show when="signed-in">
                      <>
                        <button
                          type="button"
                          className="rounded-lg p-2 text-white/55 transition-colors hover:bg-white/8 hover:text-white disabled:opacity-40"
                          aria-label="Favorites (coming soon)"
                          disabled
                        >
                          <Heart size={26} aria-hidden />
                        </button>
                        <button
                          type="button"
                          className="rounded-lg p-2 text-white/55 transition-colors hover:bg-white/8 hover:text-white disabled:opacity-40"
                          aria-label="Cart (coming soon)"
                          disabled
                        >
                          <ShoppingCart size={26} aria-hidden />
                        </button>
                        <Link
                          href="/dashboard"
                          className="flex items-center gap-2.5 text-base font-semibold text-white/88 transition hover:text-white"
                        >
                          <User size={22} aria-hidden />
                          <span className="hidden min-[900px]:inline">Dashboard</span>
                        </Link>
                        <UserButton appearance={clerkAppearance} />
                      </>
                    </Show>
                  </ClerkLoaded>
                </>
              ) : (
                <div className="flex items-center gap-5">
                  <Link
                    href={signInHref}
                    className="text-base font-semibold text-white/88 transition hover:text-white"
                  >
                    Log in
                  </Link>
                  <Link
                    href={signUpHref}
                    className="inline-flex h-12 min-w-[7.5rem] items-center justify-center rounded-xl bg-[#009ab6] px-8 text-base font-bold text-white shadow-lg transition hover:bg-[#00a8c5]"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="inline-flex min-h-[48px] min-w-[48px] touch-manipulation items-center justify-center rounded-xl text-white transition hover:bg-white/10 md:hidden"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-menu"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X size={28} aria-hidden /> : <Menu size={28} aria-hidden />}
          </button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen ? (
            <motion.div
              id="mobile-nav-menu"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-white/10 bg-[#0d1b30] md:hidden"
            >
              <div className="space-y-1 py-5">
                <Link
                  href="/browse"
                  className="block px-5 py-3 text-lg font-semibold text-white/88 hover:bg-white/[0.06] hover:text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Browse
                </Link>
                <Link
                  href="/gallery"
                  className="block px-5 py-3 text-lg font-semibold text-white/88 hover:bg-white/[0.06] hover:text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Gallery
                </Link>
                <Link
                  href="/pricing"
                  title="Compare plans — Paddle checkout"
                  className="flex items-center gap-3 px-5 py-3 text-lg font-semibold text-white/88 hover:bg-white/[0.06] hover:text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Crown size={22} className="text-[#5ce1f7]" aria-hidden />
                  Pricing
                </Link>

                <NavbarAdminNav clerkUiEnabled={clerkUiEnabled} legacyUser={user} onNavigate={() => setMobileMenuOpen(false)} />

                {user ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="block px-5 py-3 text-lg font-semibold text-white/88 hover:bg-white/[0.06] hover:text-white"
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
                      className="block w-full px-5 py-3 text-left text-lg font-semibold text-white/88 hover:bg-white/[0.06]"
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
                            className="flex min-h-[3.25rem] w-full items-center justify-center rounded-xl bg-[#009ab6] py-3.5 text-center text-lg font-bold text-white hover:bg-[#00a8c5]"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            Sign up
                          </Link>
                        </div>
                      </Show>
                      <Show when="signed-in">
                        <div className="mt-4 space-y-4 px-5 pb-4">
                          <Link
                            href="/dashboard"
                            className="block py-2 text-lg font-semibold text-white/88 hover:text-white"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            Dashboard
                          </Link>
                          <div className="flex items-center justify-between">
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
                      className="flex min-h-[3.25rem] items-center justify-center rounded-xl bg-[#009ab6] py-3.5 text-center text-lg font-bold text-white hover:bg-[#00a8c5]"
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

/** Clerk: show when allow-list matches any linked email (see admin-email.ts / middleware). Legacy: JWT user.role === 'admin`. */
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
      className="inline-flex items-center gap-2 rounded-xl border border-[#5ce1f7]/55 bg-[#009ab6]/10 px-4 py-2.5 text-sm font-semibold text-[#9cf3ff] transition hover:border-[#5ce1f7] hover:bg-[#009ab6]/25 lg:text-[0.95rem]"
      title="Admin panel"
      onClick={onNavigate}
    >
      <Globe size={20} aria-hidden />
      <span className="hidden sm:inline">Admin</span>
    </Link>
  );
}
