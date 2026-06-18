'use client';

import { ClerkLoaded, ClerkLoading, Show, UserButton, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { clientClerkUserMatchesAdmin } from '@/lib/auth/admin-email';
import { PRICING_MARKETING } from '@/lib/marketing/pricing-config';
import {
  User,
  LogOut,
  Crown,
  Flag,
  Menu,
  X,
  Globe,
  ShoppingCart,
  LayoutGrid,
  Search,
  Gamepad2,
  PenTool,
  Code2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SITE_NAME } from '@/lib/seo/site-config';
import { PageShell } from '@/components/layout';
import { FlagGame } from '@/components/FlagGame';

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

function NavbarCartIcon({
  variant = 'desktop',
  onNavigate,
  hoverClass = 'hover:bg-[var(--brand-blue-soft)]',
}: {
  variant?: 'desktop' | 'mobile';
  onNavigate?: () => void;
  hoverClass?: string;
}) {
  const { totalItems, ready } = useCart();
  const badge = ready && totalItems > 0 ? (totalItems > 99 ? '99+' : String(totalItems)) : null;

  const ariaLabel =
    ready && totalItems > 0 ? (`Shopping cart, ${totalItems} items` as const) : ('Shopping cart' as const);

  if (variant === 'mobile') {
    return (
      <Link
        href="/cart"
        aria-label={ariaLabel}
        onClick={() => onNavigate?.()}
        className="flex items-center justify-between gap-4 px-4 py-3.5 text-base font-semibold text-[var(--nav-link-text)] hover:bg-[var(--brand-blue-soft)] hover:text-[var(--nav-link-hover)]"
      >
        <span className="flex items-center gap-3">
          <ShoppingCart size={22} aria-hidden />
          Cart
        </span>
        {badge !== null ? (
          <span className="rounded-full bg-[var(--brand-blue)] px-2.5 py-1 text-[12px] font-bold tabular-nums leading-none text-white">
            {badge}
          </span>
        ) : null}
      </Link>
    );
  }

  return (
    <Link
      href="/cart"
      className={`relative inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg p-2 text-[var(--nav-link-text)] transition-colors ${hoverClass} hover:text-[var(--nav-link-hover)]`}
      aria-label={ariaLabel}
      title="Shopping cart"
    >
      <ShoppingCart size={24} aria-hidden />
      {badge !== null ? (
        <span className="pointer-events-none absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--brand-blue)] px-[5px] text-[10px] font-bold tabular-nums leading-none text-white">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}

const navTextMd =
  'text-sm font-semibold tracking-tight text-[var(--nav-link-text)] transition-colors duration-200 hover:text-[var(--nav-link-hover)] lg:text-base';
const navLogin =
  'text-base font-semibold tracking-tight text-[var(--nav-link-text)] underline-offset-4 transition-colors duration-200 hover:text-[var(--nav-link-hover)] hover:underline';

export default function Navbar({ clerkUiEnabled = true }: NavbarProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname() ?? '/';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [gameOpen, setGameOpen] = useState(false);
  const { signInHref, signUpHref } = useAuthPageLinks();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileMenuOpen]);

  // Blue hero mode: only on "/" when not scrolled
  const isHero = pathname === '/' && !scrolled;

  const clerkAppearance = {
    elements: {
      avatarBox: 'h-11 w-11 lg:h-12 lg:w-12 ring-2 ring-[rgba(12,39,72,0.35)]',
    },
  } as const;

  const shellClass = isHero
    ? 'border-transparent'
    : scrolled
      ? 'border-neutral-200 bg-white shadow-[0_4px_20px_-8px_rgba(30,58,95,0.12)] backdrop-blur-md'
      : 'border-neutral-200/80 bg-white/95 shadow-[0_1px_0_rgba(30,58,95,0.06)] backdrop-blur-md';

  const iconHover = isHero ? 'hover:bg-white/15' : 'hover:bg-[var(--brand-blue-soft)]';
  const dividerBorder = isHero ? 'border-white/20' : 'border-neutral-200';
  const skeletonBg = isHero ? 'bg-white/20' : 'bg-neutral-200/80';
  const logoColor = isHero ? 'text-white' : 'text-[var(--brand-blue)]';

  const signUpClass = isHero
    ? 'inline-flex h-11 min-h-[44px] min-w-[8rem] items-center justify-center rounded-lg border-2 border-white/70 px-7 text-base font-semibold text-white transition-all hover:border-white hover:bg-white/10'
    : 'inline-flex h-11 min-h-[44px] min-w-[8rem] items-center justify-center rounded-lg bg-[var(--brand-blue)] px-7 text-base font-semibold text-white shadow-md transition-colors hover:bg-[var(--brand-blue-hover)]';

  function DesktopAuthCluster() {
    return (
      <>
        <NavbarAdminNav clerkUiEnabled={clerkUiEnabled} legacyUser={user} />

        {user ? (
          <>
            <NavbarCartIcon hoverClass={iconHover} />
            <div className={`flex items-center gap-4 border-l ${dividerBorder} pl-6`}>
              <Link
                href="/dashboard"
                className="flex max-w-[14rem] items-center gap-2.5 text-base font-semibold text-[var(--nav-link-text)] transition hover:text-[var(--nav-link-hover)]"
              >
                <User size={22} aria-hidden />
                <span className="hidden min-[900px]:inline truncate">{user.full_name || user.email}</span>
              </Link>
              <button
                type="button"
                onClick={() => logout()}
                className={`rounded-lg p-2.5 text-[var(--nav-link-text)] opacity-85 transition ${iconHover} hover:opacity-100 hover:text-[var(--nav-link-hover)]`}
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
                <div className={`h-11 w-[4.5rem] animate-pulse rounded-lg ${skeletonBg}`} />
                <div className={`h-11 w-28 animate-pulse rounded-lg ${skeletonBg}`} />
                <div className={`h-11 w-11 animate-pulse rounded-full ${skeletonBg}`} />
              </div>
            </ClerkLoading>
            <ClerkLoaded>
              <Show when="signed-out">
                <div className="flex items-center gap-4">
                  <NavbarCartIcon hoverClass={iconHover} />
                  <Link href={signInHref} className={`${navLogin} whitespace-nowrap`}>
                    Log in
                  </Link>
                  <Link href={signUpHref} className={signUpClass}>
                    Sign up
                  </Link>
                </div>
              </Show>
              <Show when="signed-in">
                <>
                  <NavbarCartIcon hoverClass={iconHover} />
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 text-base font-semibold text-[var(--nav-link-text)] transition hover:text-[var(--nav-link-hover)]"
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
            <NavbarCartIcon hoverClass={iconHover} />
            <Link href={signInHref} className={navLogin}>
              Log in
            </Link>
            <Link href={signUpHref} className={signUpClass}>
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
      style={
        {
          '--nav-link-text': isHero ? 'rgba(255,255,255,0.88)' : '#334155',
          '--nav-link-hover': isHero ? '#ffffff' : 'var(--brand-blue)',
          backgroundColor: isHero ? 'transparent' : undefined,
          transition: 'background-color 0.3s, color 0.3s',
        } as React.CSSProperties
      }
    >
      <PageShell className="!py-0">
        {/* Phones: logo + search + cart + menu */}
        <div className="flex items-center justify-between gap-2 py-2.5 md:hidden">
          <Link
            href="/"
            className="flex min-h-11 min-w-0 flex-1 touch-manipulation items-center gap-2 transition hover:opacity-90"
          >
            <Flag
              size={28}
              className={`h-7 w-7 shrink-0 ${logoColor}`}
              aria-hidden
              strokeWidth={1.75}
            />
            <span className={`truncate text-lg font-bold tracking-tight ${logoColor}`}>{SITE_NAME}</span>
          </Link>
          <div className="flex shrink-0 items-center gap-0.5">
            <Link
              href="/gallery"
              aria-label="Search gallery"
              title="Country gallery"
              className={`inline-flex min-h-11 min-w-11 touch-manipulation items-center justify-center rounded-lg text-[var(--nav-link-text)] transition-colors ${iconHover} hover:text-[var(--nav-link-hover)]`}
            >
              <Search size={22} aria-hidden strokeWidth={2} />
            </Link>
            <NavbarCartIcon />
            <button
              type="button"
              onClick={() => setMobileMenuOpen((o) => !o)}
              className={`inline-flex min-h-11 min-w-11 touch-manipulation items-center justify-center rounded-lg text-[var(--nav-link-text)] transition ${iconHover} hover:text-[var(--nav-link-hover)]`}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav-menu"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X size={26} aria-hidden /> : <Menu size={26} aria-hidden />}
            </button>
          </div>
        </div>

        {/* Tablets & desktop */}
        <div className="hidden min-h-[64px] flex-row items-center gap-4 py-3 md:flex lg:min-h-[72px] lg:gap-7 lg:py-4 xl:gap-8">
          <Link href="/" className="flex shrink-0 items-center gap-2 transition hover:opacity-90 lg:gap-3">
            <Flag size={34} className={`h-8 w-8 shrink-0 ${logoColor} lg:h-10 lg:w-10`} aria-hidden strokeWidth={1.75} />
            <span className={`text-lg font-bold tracking-tight ${logoColor} lg:text-[1.65rem]`}>{SITE_NAME}</span>
          </Link>

          <nav
            className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-x-4 gap-y-1 lg:flex-none lg:justify-start lg:gap-x-8 xl:gap-x-9"
            aria-label="Main navigation"
          >
            <Link href="/developers" className={`flex items-center gap-1.5 ${navTextMd}`}>
              <Code2 size={16} className="shrink-0" aria-hidden />
              Developers
            </Link>
            <Link href="/pricing" className={`flex items-center gap-2 ${navTextMd}`} title={PRICING_MARKETING.plansLine}>
              <Crown size={18} className="h-[18px] w-[18px] shrink-0 text-amber-500 lg:h-[19px] lg:w-[19px]" aria-hidden strokeWidth={1.75} />
              Pricing
            </Link>
            <Link href="/gallery" className={navTextMd}>
              Collections
            </Link>
            <Link
              href="/editor/blank"
              className={`relative flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold tracking-tight transition-colors duration-200 ${isHero ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'}`}
            >
              <PenTool size={14} className="shrink-0" aria-hidden />
              Flag Editor
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-bold uppercase leading-none text-white">
                NEW
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setGameOpen(true)}
              className={`relative flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold tracking-tight transition-colors duration-200 ${isHero ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-orange-50 text-orange-700 hover:bg-orange-100'}`}
            >
              <Gamepad2 size={14} className="shrink-0" aria-hidden />
              Flag Game
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-bold uppercase leading-none text-white">
                NEW
              </span>
            </button>
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-3 lg:gap-5">
            <DesktopAuthCluster />
          </div>
        </div>

        <AnimatePresence mode="sync">
          {mobileMenuOpen ? (
            <>
              <motion.div
                key="nav-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[60] bg-black/45 backdrop-blur-[1px] md:hidden"
                onClick={() => setMobileMenuOpen(false)}
                aria-hidden
              />
              <motion.aside
                key="nav-drawer"
                id="mobile-nav-menu"
                role="dialog"
                aria-modal="true"
                aria-label="Navigation menu"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'tween', duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="fixed inset-y-0 right-0 z-[61] flex w-[min(100%,300px)] max-w-[100vw] flex-col border-l border-neutral-200 bg-white shadow-[0_0_40px_-12px_rgba(30,58,95,0.35)] md:hidden"
                style={{ '--nav-link-text': '#334155', '--nav-link-hover': '#1d4ed8' } as React.CSSProperties}
              >
                <div className="flex shrink-0 items-center justify-between border-b border-neutral-100 px-4 py-3">
                  <span className="text-sm font-bold uppercase tracking-wide text-neutral-600">Navigate</span>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-[var(--nav-link-text)] hover:bg-[var(--brand-blue-soft)]"
                    aria-label="Close menu"
                  >
                    <X size={24} aria-hidden />
                  </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain py-3">
                  <Link
                    href="/editor/blank"
                    className="relative flex min-h-[3rem] items-center gap-3 px-4 py-2 text-base font-semibold text-purple-700 hover:bg-purple-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <PenTool size={20} aria-hidden />
                    Flag Editor
                    <span className="ml-auto flex h-5 items-center justify-center rounded-full bg-emerald-500 px-2 text-[10px] font-bold uppercase text-white">
                      NEW
                    </span>
                  </Link>
                  <Link
                    href="/gallery"
                    className="flex min-h-[3rem] items-center gap-3 px-4 py-2 text-base font-semibold text-[var(--nav-link-text)] hover:bg-[var(--brand-blue-soft)] hover:text-[var(--nav-link-hover)]"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Search size={20} aria-hidden />
                    Gallery
                  </Link>
                  <Link
                    href="/developers"
                    className="flex min-h-[3rem] items-center gap-3 px-4 py-2 text-base font-semibold text-[var(--nav-link-text)] hover:bg-[var(--brand-blue-soft)] hover:text-[var(--nav-link-hover)]"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Code2 size={20} aria-hidden />
                    Developers
                  </Link>
                  <Link
                    href="/pricing"
                    className="flex min-h-[3rem] items-center gap-3 px-4 py-2 text-base font-semibold text-[var(--nav-link-text)] hover:bg-[var(--brand-blue-soft)] hover:text-[var(--nav-link-hover)]"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Crown size={20} className="shrink-0 text-amber-500" aria-hidden />
                    Pricing
                  </Link>
                  <Link
                    href="/gallery"
                    className="flex min-h-[3rem] items-center gap-3 px-4 py-2 text-base font-semibold text-[var(--nav-link-text)] hover:bg-[var(--brand-blue-soft)] hover:text-[var(--nav-link-hover)]"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LayoutGrid size={20} aria-hidden />
                    Collections
                  </Link>
                  <button
                    type="button"
                    className="relative flex min-h-[3rem] w-full items-center gap-3 px-4 py-2 text-base font-semibold text-orange-700 hover:bg-orange-50"
                    onClick={() => { setMobileMenuOpen(false); setGameOpen(true); }}
                  >
                    <Gamepad2 size={20} aria-hidden />
                    Flag Game
                    <span className="ml-auto flex h-5 items-center justify-center rounded-full bg-emerald-500 px-2 text-[10px] font-bold uppercase text-white">
                      NEW
                    </span>
                  </button>

                  <NavbarAdminNav clerkUiEnabled={clerkUiEnabled} legacyUser={user} onNavigate={() => setMobileMenuOpen(false)} />

                  {user ? (
                    <>
                      <NavbarCartIcon variant="mobile" onNavigate={() => setMobileMenuOpen(false)} />
                      <Link
                        href="/dashboard"
                        className="flex min-h-[3rem] items-center px-4 py-2 text-base font-semibold text-[var(--nav-link-text)] hover:bg-[var(--brand-blue-soft)] hover:text-[var(--nav-link-hover)]"
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
                        className="flex min-h-[3rem] w-full items-center px-4 py-2 text-left text-base font-semibold text-[var(--nav-link-text)] opacity-90 hover:bg-[var(--brand-blue-soft)] hover:opacity-100"
                      >
                        Sign out
                      </button>
                    </>
                  ) : clerkUiEnabled ? (
                    <>
                      <ClerkLoading>
                        <div className="space-y-2 px-4 pt-4" aria-hidden>
                          <div className="h-11 w-full animate-pulse rounded-lg bg-neutral-200/80" />
                          <div className="h-11 w-full animate-pulse rounded-lg bg-neutral-200/80" />
                        </div>
                      </ClerkLoading>
                      <ClerkLoaded>
                        <Show when="signed-out">
                          <div className="mt-4 flex flex-col gap-2 border-t border-neutral-100 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] pt-4">
                            <Link
                              href={signInHref}
                              className="flex min-h-11 items-center text-base font-semibold text-[var(--nav-link-text)] hover:text-[var(--nav-link-hover)]"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              Log in
                            </Link>
                            <Link
                              href={signUpHref}
                              className="flex min-h-11 w-full items-center justify-center rounded-lg bg-[var(--brand-blue)] py-3 text-center text-base font-semibold text-white shadow-sm hover:bg-[var(--brand-blue-hover)]"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              Sign up
                            </Link>
                          </div>
                        </Show>
                        <Show when="signed-in">
                          <div className="mt-4 space-y-1 border-t border-neutral-100 px-4 pb-6 pt-4">
                            <NavbarCartIcon variant="mobile" onNavigate={() => setMobileMenuOpen(false)} />
                            <Link
                              href="/dashboard"
                              className="flex min-h-11 items-center text-base font-semibold text-[var(--nav-link-text)] hover:text-[var(--nav-link-hover)]"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              Dashboard
                            </Link>
                            <div className="flex min-h-11 items-center justify-between pt-2">
                              <span className="text-base font-medium text-[var(--nav-link-text)] opacity-75">Account</span>
                              <UserButton appearance={clerkAppearance} />
                            </div>
                          </div>
                        </Show>
                      </ClerkLoaded>
                    </>
                  ) : (
                    <div className="mt-4 flex flex-col gap-2 border-t border-neutral-100 px-4 pb-6 pt-4">
                      <NavbarCartIcon variant="mobile" onNavigate={() => setMobileMenuOpen(false)} />
                      <Link
                        href={signInHref}
                        className="flex min-h-11 items-center text-base font-semibold text-[var(--nav-link-text)] hover:text-[var(--nav-link-hover)]"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Log in
                      </Link>
                      <Link
                        href={signUpHref}
                        className="flex min-h-11 items-center justify-center rounded-lg bg-[var(--brand-blue)] py-3 text-center text-base font-semibold text-white shadow-sm hover:bg-[var(--brand-blue-hover)]"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Sign up
                      </Link>
                    </div>
                  )}
                </div>
              </motion.aside>
            </>
          ) : null}
        </AnimatePresence>
      </PageShell>

      <AnimatePresence>
        {gameOpen && <FlagGame onClose={() => setGameOpen(false)} />}
      </AnimatePresence>
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
        className="flex items-center gap-3 px-4 py-3 text-base font-semibold text-[var(--nav-link-text)] hover:bg-[var(--brand-blue-soft)] hover:text-[var(--nav-link-hover)]"
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
      className="inline-flex items-center gap-2 rounded-lg border-2 border-[rgba(23,37,84,0.2)] bg-[var(--brand-blue-soft)] px-4 py-2 text-base font-semibold text-[var(--nav-link-text)] shadow-sm transition hover:border-[var(--brand-blue)] hover:text-[var(--nav-link-hover)]"
      title="Admin panel"
      onClick={onNavigate}
    >
      <Globe size={20} aria-hidden />
      <span className="hidden sm:inline">Admin</span>
    </Link>
  );
}
