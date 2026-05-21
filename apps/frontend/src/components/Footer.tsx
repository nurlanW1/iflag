'use client';

import Link from 'next/link';
import { Flag, Mail, Twitter, Facebook, Instagram, Linkedin, Github, X, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SITE_NAME } from '@/lib/seo/site-config';
import { getPublicContactEmail, P } from '@/lib/legal/legal-placeholders';
import { PageShell } from '@/components/layout';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const contactEmail = getPublicContactEmail();
  const [email, setEmail] = useState('');
  const [showNotification, setShowNotification] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setShowNotification(true);
      setEmail('');
    }
  };

  return (
    <footer className="bg-black text-white">
      {/* Newsletter Notification */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed left-4 right-4 top-4 z-50 mx-auto max-w-md rounded-lg border border-gray-200 bg-white p-4 shadow-xl sm:left-auto sm:right-4 sm:mx-0 supports-[padding:max(0px)]:top-[max(1rem,env(safe-area-inset-top))]"
          >
            <div className="flex items-start gap-3">
              <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <p className="text-black font-semibold mb-1">Subscribed!</p>
                <p className="text-gray-600 text-sm">
                  Thank you for subscribing to our newsletter.
                </p>
              </div>
              <button
                onClick={() => setShowNotification(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                aria-label="Close notification"
              >
                <X size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PageShell className="py-14 sm:py-16 md:py-20 supports-[padding:max(0px)]:pb-[max(3rem,env(safe-area-inset-bottom))]">
        <div className="mb-16 grid grid-cols-1 gap-14 md:grid-cols-2 md:gap-16 lg:grid-cols-5 lg:gap-14 xl:gap-20">
          {/* Brand Column */}
          <div>
            <div className="mb-5 flex items-center gap-2.5">
              <Flag size={36} className="text-[#009ab6]" />
              <span className="text-2xl font-black tracking-tight sm:text-3xl">{SITE_NAME}</span>
            </div>
            <p className="mb-7 text-base text-white/65">
              High-quality flag, symbol, and related digital assets for creative and professional projects.
            </p>
            <div className="flex gap-4">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-colors">
                <Twitter size={20} />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-colors">
                <Facebook size={20} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-colors">
                <Instagram size={20} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-colors">
                <Linkedin size={20} />
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-colors">
                <Github size={20} />
              </a>
            </div>
          </div>

          {/* Products Column */}
          <div>
            <h3 className="mb-5 text-xl font-bold text-[#009ab6]">Products</h3>
            <ul className="space-y-4">
              <li>
                <Link href="/assets" className="text-base text-white/65 transition-colors hover:text-white">
                  Browse Flags
                </Link>
              </li>
              <li>
                <Link href="/assets?asset_type=vector" className="text-base text-white/65 transition-colors hover:text-white">
                  Vector Assets
                </Link>
              </li>
              <li>
                <Link href="/assets?asset_type=raster" className="text-base text-white/65 transition-colors hover:text-white">
                  Raster Images
                </Link>
              </li>
              <li>
                <Link href="/assets?asset_type=video" className="text-base text-white/65 transition-colors hover:text-white">
                  Video Assets
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  title="Plans and Paddle checkout"
                  className="text-base text-white/65 transition-colors hover:text-white"
                >
                  Pricing (Paddle)
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="mb-5 text-xl font-bold text-[#009ab6]">Company</h3>
            <ul className="space-y-4">
              <li>
                <Link href="/about" className="text-base text-white/65 transition-colors hover:text-white">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-base text-white/65 transition-colors hover:text-white">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-base text-white/65 transition-colors hover:text-white">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-base text-white/65 transition-colors hover:text-white">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/press" className="text-base text-white/65 transition-colors hover:text-white">
                  Press Kit
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h3 className="mb-5 text-xl font-bold text-[#009ab6]">Legal</h3>
            <ul className="space-y-4">
              <li>
                <Link href="/privacy-policy" className="text-base text-white/65 transition-colors hover:text-white">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms-of-service" className="text-base text-white/65 transition-colors hover:text-white">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/refunds" className="text-base text-white/65 transition-colors hover:text-white">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/licenses" className="text-base text-white/65 transition-colors hover:text-white">
                  Licensing &amp; usage
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-base text-white/65 transition-colors hover:text-white">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-base text-white/65 transition-colors hover:text-white">
                  Legal &amp; privacy contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Column */}
          <div>
            <h3 className="mb-5 text-xl font-bold text-[#009ab6]">Support</h3>
            <ul className="space-y-4">
              <li>
                <Link href="/help" className="text-base text-white/65 transition-colors hover:text-white">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-base text-white/65 transition-colors hover:text-white">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="border-t border-white/10 pt-12 mb-12">
          <div className="w-full max-w-none">
            <h3 className="mb-3 text-2xl font-bold text-white/90">Stay Updated</h3>
            <p className="mb-5 text-base text-white/65">
              Get the latest flags, updates, and exclusive offers delivered to your inbox.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col gap-3 xs:flex-row xs:items-stretch">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="min-h-[48px] flex-1 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-base text-white placeholder:text-white/45 transition-colors focus:border-[#009ab6] focus:outline-none focus:ring-2 focus:ring-[#009ab6]/30"
                required
              />
              <button
                type="submit"
                className="min-h-[48px] shrink-0 touch-manipulation rounded-xl bg-[#009ab6] px-7 py-3 text-base font-semibold text-white transition-colors hover:bg-[#007a8a] xs:w-auto"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <p className="mb-6 max-w-none text-sm leading-relaxed text-white/55 sm:text-base">
          Trust &amp; billing transparency: payments and subscriptions may be processed by {P.PAYMENT_PROCESSOR}. Legal
          pages are published as customizable templates — replace bracketed placeholders with your finalized
          information and have counsel review for each market you serve.
        </p>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-base text-white/65">
            © {currentYear} {SITE_NAME}. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <Link href="/terms-of-service" className="text-base text-white/65 transition-colors hover:text-white">
              Terms
            </Link>
            <Link href="/privacy-policy" className="text-base text-white/65 transition-colors hover:text-white">
              Privacy
            </Link>
            <Link href="/refunds" className="text-base text-white/65 transition-colors hover:text-white">
              Refunds
            </Link>
            <Link href="/licenses" className="text-base text-white/65 transition-colors hover:text-white">
              Licenses
            </Link>
            <Link href="/cookies" className="text-base text-white/65 transition-colors hover:text-white">
              Cookies
            </Link>
            <Link href="/contact" className="text-base text-white/65 transition-colors hover:text-white">
              Contact
            </Link>
            <div className="flex items-center gap-2 text-base text-white/90">
              <Mail size={16} />
              <a
                href={`mailto:${contactEmail}`}
                className="text-white hover:text-white/80 transition-colors"
              >
                {contactEmail}
              </a>
            </div>
          </div>
        </div>
      </PageShell>
    </footer>
  );
}
