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
      avatarBox: 'h-10 w-10',
    },
  } as const;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[#006d7a]/10 bg-white/95 shadow-sm backdrop-blur-md supports-[padding:max(0px)]:pt-[env(safe-area-inset-top)]" aria-label="Primary">
      <PageShell>
        <div className="flex w-full min-w-0 items-center justify-between gap-3 py-4 md:gap-8">
          <Link
            href="/"
            className="flex min-h-[44px] items-center gap-2.5 text-xl font-black text-black transition hover:opacity-90 sm:text-2xl"
          >
            <Flag size={32} className="text-[#009ab6]" aria-hidden />
            <span>{SITE_NAME}</span>
          </Link>

          <div className="hidden items-center md:flex md:gap-10 lg:gap-12">
            <div className="flex items-center gap-8 lg:gap-10">
              <Link
                href="/browse"
                className="text-[0.9375rem] font-medium text-black/75 transition-colors hover:text-black lg:text-base"
              >
                Browse
              </Link>
              <Link
                href="/gallery"
                className="text-[0.9375rem] font-medium text-black/75 transition-colors hover:text-black lg:text-base"
              >
                Gallery
              </Link>
              <Link
                href="/pricing"
                title="Compare plans — Paddle checkout"
                className="flex items-center gap-1.5 text-[0.9375rem] font-medium text-black/75 transition-colors hover:text-black lg:text-base"
              >
                <Crown size={18} className="text-[#009ab6]" aria-hidden />
                Pricing
              </Link>
            </div>

            <div className="flex items-center gap-5 border-l border-[#006d7a]/10 pl-10">
              {/* --- Admin link: Clerk path = email must match ADMIN_EMAIL; legacy = JWT role admin --- */}
              <NavbarAdminNav clerkUiEnabled={clerkUiEnabled} legacyUser={user} />

              {user ? (
                <>
                  <button
                    type="button"
                    className="text-black/70 transition-colors hover:text-black"
                    aria-label="Favorites (coming soon)"
                    disabled
                  >
                    <Heart size={22} aria-hidden />
                  </button>
                  <button
                    type="button"
                    className="text-black/70 transition-colors hover:text-black"
                    aria-label="Cart (coming soon)"
                    disabled
                  >
                    <ShoppingCart size={22} aria-hidden />
                  </button>
                  <div className="flex items-center gap-3">
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2 text-sm font-medium text-black/75 transition-colors hover:text-black lg:text-[0.9375rem]"
                    >
                      <User size={18} aria-hidden />
                      <span className="hidden min-[900px]:inline">{user.full_name || user.email}</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => logout()}
                      className="text-black/70 transition-colors hover:text-black"
                      aria-label="Sign out"
                    >
                      <LogOut size={18} aria-hidden />
                    </button>
                  </div>
                </>
              ) : clerkUiEnabled ? (
                <>
                  <ClerkLoading>
                    <div className="flex items-center gap-3" aria-hidden>
                      <div className="h-10 w-[4.25rem] animate-pulse rounded-md bg-gray-100" />
                      <div className="h-10 w-24 animate-pulse rounded-xl bg-gray-100" />
                      <div className="h-10 w-10 animate-pulse rounded-full bg-gray-100" />
                    </div>
                  </ClerkLoading>
                  <ClerkLoaded>
                    <Show when="signed-out">
                      <div className="flex items-center gap-4">
                        <Link
                          href={signInHref}
                          className="text-[0.9375rem] font-medium text-black/75 transition-colors hover:text-black lg:text-base"
                        >
                          Log in
                        </Link>
                        <Link
                          href={signUpHref}
                          className="rounded-xl bg-[#009ab6] px-5 py-2.5 text-[0.9375rem] font-semibold text-white transition-colors hover:bg-[#007a8a] lg:text-base"
                        >
                          Sign up
                        </Link>
                      </div>
                    </Show>
                    <Show when="signed-in">
                      <>
                        <button
                          type="button"
                          className="text-black/70 transition-colors hover:text-black"
                          aria-label="Favorites (coming soon)"
                          disabled
                        >
                          <Heart size={22} aria-hidden />
                        </button>
                        <button
                          type="button"
                          className="text-black/70 transition-colors hover:text-black"
                          aria-label="Cart (coming soon)"
                          disabled
                        >
                          <ShoppingCart size={22} aria-hidden />
                        </button>
                        <Link
                          href="/dashboard"
                          className="flex items-center gap-2 text-sm font-medium text-black/75 transition-colors hover:text-black lg:text-[0.9375rem]"
                        >
                          <User size={18} aria-hidden />
                          <span className="hidden min-[900px]:inline">Dashboard</span>
                        </Link>
                        <UserButton appearance={clerkAppearance} />
                      </>
                    </Show>
                  </ClerkLoaded>
                </>
              ) : (
                <div className="flex items-center gap-4">
                  <Link
                    href={signInHref}
                    className="text-[0.9375rem] font-medium text-black/75 transition-colors hover:text-black lg:text-base"
                  >
                    Log in
                  </Link>
                  <Link
                    href={signUpHref}
                    className="rounded-xl bg-[#009ab6] px-5 py-2.5 text-[0.9375rem] font-semibold text-white transition-colors hover:bg-[#007a8a] lg:text-base"
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
            className="inline-flex min-h-[44px] min-w-[44px] touch-manipulation items-center justify-center rounded-lg text-black md:hidden"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-menu"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X size={24} aria-hidden /> : <Menu size={24} aria-hidden />}
          </button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen ? (
            <motion.div
              id="mobile-nav-menu"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-[#006d7a]/10 bg-white md:hidden"
            >
              <div className="space-y-4 py-4">
                <Link
                  href="/browse"
                  className="block px-4 py-1.5 text-base font-medium text-black/75 hover:text-black"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Browse
                </Link>
                <Link
                  href="/gallery"
                  className="block px-4 py-1.5 text-base font-medium text-black/75 hover:text-black"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Gallery
                </Link>
                <Link
                  href="/pricing"
                  title="Compare plans — Paddle checkout"
                  className="flex items-center gap-2 px-4 py-1.5 text-base font-medium text-black/75 hover:text-black"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Crown size={18} className="text-[#009ab6]" aria-hidden />
                  Pricing
                </Link>
                  <NavbarAdminNav
                  clerkUiEnabled={clerkUiEnabled}
                  legacyUser={user}
                  onNavigate={() => setMobileMenuOpen(false)}
                />
                {user ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="block px-4 py-1.5 text-base font-medium text-black/75 hover:text-black"
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
                      className="block w-full px-4 py-1.5 text-left text-base font-medium text-black/75 hover:text-black"
                    >
                      Sign out
                    </button>
                  </>
                ) : clerkUiEnabled ? (
                  <>
                    <ClerkLoading>
                      <div className="space-y-2 px-4" aria-hidden>
                        <div className="h-10 w-full animate-pulse rounded-lg bg-gray-100" />
                        <div className="h-10 w-full animate-pulse rounded-lg bg-gray-100" />
                      </div>
                    </ClerkLoading>
                    <ClerkLoaded>
                      <Show when="signed-out">
                        <div className="flex flex-col gap-2 px-4">
                          <Link
                            href={signInHref}
                            className="block text-base font-medium text-black/75 hover:text-black"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            Log in
                          </Link>
                          <Link
                            href={signUpHref}
                            className="block w-full rounded-xl bg-[#009ab6] px-4 py-3 text-center text-base font-semibold text-white hover:bg-[#007a8a]"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            Sign up
                          </Link>
                        </div>
                      </Show>
                      <Show when="signed-in">
                        <div className="space-y-3 px-4">
                          <Link
                            href="/dashboard"
                            className="block text-base font-medium text-black/75 hover:text-black"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            Dashboard
                          </Link>
                          <div className="flex items-center justify-between">
                            <span className="text-base font-medium text-black/75">Account</span>
                            <UserButton appearance={clerkAppearance} />
                          </div>
                        </div>
                      </Show>
                    </ClerkLoaded>
                  </>
                ) : (
                  <div className="flex flex-col gap-2 px-4">
                    <Link
                      href={signInHref}
                      className="block text-base font-medium text-black/75 hover:text-black"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Log in
                    </Link>
                    <Link
                      href={signUpHref}
                      className="block w-full rounded-xl bg-[#009ab6] px-4 py-3 text-center text-base font-semibold text-white hover:bg-[#007a8a]"
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
        className="flex items-center gap-2 px-4 py-1.5 text-base font-medium text-black/75 hover:text-black"
        title="Admin panel"
        onClick={onNavigate}
      >
        <Globe size={18} aria-hidden />
        Admin Panel
      </Link>
    );
  }
  return (
    <Link
      href="/admin"
      className="flex items-center gap-2 rounded-xl border border-[#009ab6]/25 px-4 py-2 text-sm font-semibold text-[#009ab6] transition-colors hover:bg-[#009ab6]/10 hover:text-[#007a8a] lg:text-[0.9375rem]"
      title="Admin panel"
      onClick={onNavigate}
    >
      <Globe size={18} aria-hidden />
      <span className="hidden sm:inline">Admin Panel</span>
    </Link>
  );
}
