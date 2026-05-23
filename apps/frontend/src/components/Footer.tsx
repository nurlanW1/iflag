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

  const linkMuted =
    'text-base text-neutral-600 transition-colors hover:text-[var(--brand-blue)]';

  return (
    <footer className="border-t border-neutral-200/90 bg-[#f4f4f2] text-[#2a2a2a]">
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed left-4 right-4 top-4 z-50 mx-auto max-w-md rounded-xl border border-neutral-200 bg-white p-4 shadow-xl sm:left-auto sm:right-4 sm:mx-0 supports-[padding:max(0px)]:top-[max(1rem,env(safe-area-inset-top))]"
          >
            <div className="flex items-start gap-3">
              <CheckCircle className="mt-0.5 shrink-0 text-emerald-600" size={20} aria-hidden />
              <div className="flex-1">
                <p className="mb-1 font-semibold text-[#2a2a2a]">Subscribed</p>
                <p className="text-base leading-snug text-neutral-600">
                  Thank you for subscribing to our newsletter.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNotification(false)}
                className="shrink-0 text-neutral-400 transition-colors hover:text-neutral-700"
                aria-label="Close notification"
              >
                <X size={18} aria-hidden />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PageShell className="py-16 sm:py-20 md:py-24 supports-[padding:max(0px)]:pb-[max(3rem,env(safe-area-inset-bottom))]">
        <div className="mb-14 grid grid-cols-1 gap-14 md:grid-cols-2 md:gap-16 lg:grid-cols-5 lg:gap-14 xl:gap-16">
          <div className="lg:col-span-1">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <Flag size={44} className="text-[var(--brand-blue)]" aria-hidden strokeWidth={1.75} />
              <span className="text-[1.65rem] font-semibold tracking-tight">{SITE_NAME}</span>
            </div>
            <p className="mb-8 max-w-md text-base leading-relaxed text-neutral-600">
              Flags, vectors, archives, and symbols — structured for licensing-conscious teams.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-200/70 hover:text-[#2a2a2a]"
                aria-label="Twitter"
              >
                <Twitter size={22} aria-hidden />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-200/70 hover:text-[#2a2a2a]"
                aria-label="Facebook"
              >
                <Facebook size={22} aria-hidden />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-200/70 hover:text-[#2a2a2a]"
                aria-label="Instagram"
              >
                <Instagram size={22} aria-hidden />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-200/70 hover:text-[#2a2a2a]"
                aria-label="LinkedIn"
              >
                <Linkedin size={22} aria-hidden />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-200/70 hover:text-[#2a2a2a]"
                aria-label="GitHub"
              >
                <Github size={22} aria-hidden />
              </a>
            </div>
          </div>

          <div>
            <h3 className="mb-5 text-base font-semibold tracking-tight text-[#2a2a2a]">Products</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/browse" className={linkMuted}>
                  Browse catalog
                </Link>
              </li>
              <li>
                <Link href="/browse?q=vector" className={linkMuted}>
                  Vector assets
                </Link>
              </li>
              <li>
                <Link href="/gallery" className={linkMuted}>
                  Country collections
                </Link>
              </li>
              <li>
                <Link href="/gallery?kind=historical" className={linkMuted}>
                  Historical archives
                </Link>
              </li>
              <li>
                <Link href="/pricing" title="Plans and Paddle checkout" className={linkMuted}>
                  Pricing (Paddle)
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-5 text-base font-semibold tracking-tight text-[#2a2a2a]">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className={linkMuted}>
                  About
                </Link>
              </li>
              <li>
                <Link href="/blog" className={linkMuted}>
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/careers" className={linkMuted}>
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/contact" className={linkMuted}>
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/press" className={linkMuted}>
                  Press kit
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-5 text-base font-semibold tracking-tight text-[#2a2a2a]">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/privacy-policy" className={linkMuted}>
                  Privacy policy
                </Link>
              </li>
              <li>
                <Link href="/terms-of-service" className={linkMuted}>
                  Terms of service
                </Link>
              </li>
              <li>
                <Link href="/refunds" className={linkMuted}>
                  Refund policy
                </Link>
              </li>
              <li>
                <Link href="/licenses" className={linkMuted}>
                  Licensing &amp; usage
                </Link>
              </li>
              <li>
                <Link href="/cookies" className={linkMuted}>
                  Cookie policy
                </Link>
              </li>
              <li>
                <Link href="/contact" className={linkMuted}>
                  Legal contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-5 text-base font-semibold tracking-tight text-[#2a2a2a]">Support</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/help" className={linkMuted}>
                  Help center
                </Link>
              </li>
              <li>
                <Link href="/faq" className={linkMuted}>
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-neutral-200/90 pt-12 pb-10">
          <div className="w-full max-w-none">
            <h3 className="mb-3 text-xl font-semibold tracking-tight text-[#2a2a2a]">Occasional notes</h3>
            <p className="mb-6 max-w-xl text-base leading-relaxed text-neutral-600">
              Product updates and curated drops — low frequency, straight to inbox.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col gap-3 xs:flex-row xs:items-stretch">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="min-h-12 flex-1 rounded-xl border border-neutral-300 bg-white px-5 py-3 text-base text-[#2a2a2a] placeholder:text-neutral-400 transition-colors focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300/80"
                required
              />
              <button
                type="submit"
                className="min-h-12 shrink-0 touch-manipulation rounded-xl bg-[var(--brand-blue)] px-10 py-3 text-base font-semibold text-[#fafaf9] transition-colors hover:bg-[var(--brand-blue-hover)] xs:w-auto"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <p className="mb-8 max-w-none text-sm leading-relaxed text-neutral-600 sm:text-base">
          Trust &amp; billing transparency: payments and subscriptions may be processed by {P.PAYMENT_PROCESSOR}. Legal
          pages are published as customizable templates — replace bracketed placeholders with your finalized information
          and have counsel review for each market you serve.
        </p>

        <div className="flex flex-col items-start justify-between gap-6 border-t border-neutral-200/90 pt-8 md:flex-row md:items-center">
          <p className="text-base text-neutral-600">
            © {currentYear} {SITE_NAME}. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/terms-of-service" className={linkMuted}>
              Terms
            </Link>
            <Link href="/privacy-policy" className={linkMuted}>
              Privacy
            </Link>
            <Link href="/refunds" className={linkMuted}>
              Refunds
            </Link>
            <Link href="/licenses" className={linkMuted}>
              Licenses
            </Link>
            <Link href="/cookies" className={linkMuted}>
              Cookies
            </Link>
            <Link href="/contact" className={linkMuted}>
              Contact
            </Link>
            <div className="flex items-center gap-2 text-base text-neutral-700">
              <Mail size={16} aria-hidden />
              <a href={`mailto:${contactEmail}`} className="underline-offset-4 hover:underline">
                {contactEmail}
              </a>
            </div>
          </div>
        </div>
      </PageShell>
    </footer>
  );
}
