'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { User, LogOut, Crown, Flag, Menu, X, Globe, Heart, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SITE_NAME } from '@/lib/seo/site-config';

const isDev = process.env.NODE_ENV === 'development';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const showAdminLink = isDev || user?.role === 'admin';

  return (
    <nav className="sticky top-0 z-50 border-b border-[#006d7a]/10 bg-white/95 shadow-sm backdrop-blur-md" aria-label="Primary">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between">
          <Link            href="/"
            className="flex items-center gap-2 text-xl font-black text-black transition hover:opacity-90"
          >
            <Flag size={28} className="text-[#009ab6]" aria-hidden />
            <span>{SITE_NAME}</span>
          </Link>

          <div className="hidden items-center gap-8 lg:flex">
            <div className="flex items-center gap-6">
              <Link
                href="/browse"
                className="text-sm font-medium text-black/70 transition-colors hover:text-black"
              >
                Browse
              </Link>
              <Link
                href="/gallery"
                className="text-sm font-medium text-black/70 transition-colors hover:text-black"
              >
                Gallery
              </Link>
              <Link
                href="/pricing"
                className="flex items-center gap-1 text-sm font-medium text-black/70 transition-colors hover:text-black"
              >
                <Crown size={16} className="text-[#009ab6]" aria-hidden />
                Pricing
              </Link>
            </div>

            <div className="flex items-center gap-4 border-l border-[#006d7a]/10 pl-6">
              {showAdminLink ? (
                <Link
                  href="/admin"
                  className="flex items-center gap-2 rounded-lg border border-[#009ab6]/20 px-3 py-1.5 text-sm font-medium text-[#009ab6] transition-colors hover:bg-[#009ab6]/10 hover:text-[#007a8a]"
                  title="Admin panel"
                >
                  <Globe size={18} aria-hidden />
                  <span className="hidden xl:inline">Admin</span>
                </Link>
              ) : null}

              {user ? (
                <>
                  <button
                    type="button"
                    className="text-black/70 transition-colors hover:text-black"
                    aria-label="Favorites (coming soon)"
                    disabled
                  >
                    <Heart size={20} aria-hidden />
                  </button>
                  <button
                    type="button"
                    className="text-black/70 transition-colors hover:text-black"
                    aria-label="Cart (coming soon)"
                    disabled
                  >
                    <ShoppingCart size={20} aria-hidden />
                  </button>
                  <div className="flex items-center gap-3">
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2 text-sm text-black/70 transition-colors hover:text-black"
                    >
                      <User size={18} aria-hidden />
                      <span className="hidden xl:inline">{user.full_name || user.email}</span>
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
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-sm font-medium text-black/70 transition-colors hover:text-black"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-lg bg-[#009ab6] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#007a8a]"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="p-2 text-black lg:hidden"
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
              className="overflow-hidden border-t border-[#006d7a]/10 bg-white lg:hidden"
            >
              <div className="space-y-4 py-4">
                <Link
                  href="/browse"
                  className="block px-4 text-black/70 hover:text-black"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Browse
                </Link>
                <Link
                  href="/gallery"
                  className="block px-4 text-black/70 hover:text-black"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Gallery
                </Link>
                <Link
                  href="/pricing"
                  className="flex items-center gap-2 px-4 text-black/70 hover:text-black"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Crown size={18} className="text-[#009ab6]" aria-hidden />
                  Pricing
                </Link>
                {showAdminLink ? (
                  <Link
                    href="/admin"
                    className="flex items-center gap-2 px-4 text-black/70 hover:text-black"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Globe size={18} aria-hidden />
                    Admin
                  </Link>
                ) : null}
                {user ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="block px-4 text-black/70 hover:text-black"
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
                      className="block w-full px-4 text-left text-black/70 hover:text-black"
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="block px-4 text-black/70 hover:text-black"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Log in
                    </Link>
                    <Link
                      href="/register"
                      className="block px-4 text-black/70 hover:text-black"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign up
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </nav>
  );
}
