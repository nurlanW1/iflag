'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { Search, User, LogOut, Crown, Flag, Menu, X, Globe, Heart, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { openModal } = useAuthModal();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#006d7a]/10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-black font-black text-xl hover:opacity-90 transition">
            <Flag size={28} className="text-[#009ab6]" />
            <span>FlagStock</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {/* Main Nav Links */}
            <div className="flex items-center gap-6">
              <Link href="/gallery" className="text-black/70 hover:text-black text-sm font-medium transition-colors">
                Gallery
              </Link>
              <Link href="/subscriptions" className="text-black/70 hover:text-black text-sm font-medium transition-colors flex items-center gap-1">
                <Crown size={16} className="text-[#009ab6]" />
                Premium
              </Link>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-4 pl-6 border-l border-[#006d7a]/10">
              {/* Admin Button - Always visible for development */}
              <Link 
                href="/admin" 
                className="flex items-center gap-2 text-[#009ab6] hover:text-[#007a8a] transition-colors font-medium text-sm px-3 py-1.5 rounded-lg hover:bg-[#009ab6]/10 border border-[#009ab6]/20" 
                title="Admin Panel"
              >
                <Globe size={18} />
                <span className="hidden xl:inline">Admin</span>
              </Link>
              
              {user ? (
                <>
                  <button className="text-black/70 hover:text-black transition-colors">
                    <Heart size={20} />
                  </button>
                  <button className="text-black/70 hover:text-black transition-colors">
                    <ShoppingCart size={20} />
                  </button>
                  <div className="flex items-center gap-3">
                    <Link href="/profile" className="flex items-center gap-2 text-black/70 hover:text-black text-sm transition-colors">
                      <User size={18} />
                      <span className="hidden xl:inline">{user.full_name || user.email}</span>
                    </Link>
                    <button
                      onClick={logout}
                      className="text-black/70 hover:text-black transition-colors"
                    >
                      <LogOut size={18} />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <button
                    onClick={() => openModal('signin')}
                    className="text-black/70 hover:text-black text-sm font-medium transition-colors"
                  >
                    Log in
                  </button>
                  <button
                    onClick={() => openModal('signup')}
                    className="bg-[#009ab6] hover:bg-[#007a8a] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                  >
                    Sign up
                  </button>
                </>
              )}
            </div>
          </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-black p-2"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="lg:hidden overflow-hidden border-t border-[#006d7a]/10 bg-white"
              >
                <div className="py-4 space-y-4">
                  <Link href="/gallery" className="block px-4 text-black/70 hover:text-black">
                    Gallery
                  </Link>
                  <Link href="/subscriptions" className="block px-4 text-black/70 hover:text-black flex items-center gap-2">
                    <Crown size={18} className="text-[#009ab6]" />
                    Premium
                  </Link>
                  <Link href="/admin" className="block px-4 text-black/70 hover:text-black flex items-center gap-2">
                    <Globe size={18} />
                    Admin
                  </Link>
                  {user ? (
                    <>
                      <Link href="/profile" className="block px-4 text-black/70 hover:text-black">
                        Profile
                      </Link>
                      <button
                        onClick={logout}
                        className="block w-full text-left px-4 text-black/70 hover:text-black"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          openModal('signin');
                          setMobileMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 text-black/70 hover:text-black"
                      >
                        Log in
                      </button>
                      <button
                        onClick={() => {
                          openModal('signup');
                          setMobileMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 text-black/70 hover:text-black"
                      >
                        Sign up
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>
  );
}
