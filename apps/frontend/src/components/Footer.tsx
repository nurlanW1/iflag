'use client';

import Link from 'next/link';
import { Flag, Mail, Twitter, Facebook, Instagram, Linkedin, Github, X, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SITE_NAME } from '@/lib/seo/site-config';
import { getPublicContactEmail, P } from '@/lib/legal/legal-placeholders';
import { PageShell } from '@/components/layout';

const linkMuted =
  'text-sm text-neutral-600 transition-colors hover:text-[var(--brand-blue)]';

function LinkColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
        {title}
      </h3>
      <ul className="space-y-1.5">{children}</ul>
    </div>
  );
}

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
                <p className="mb-1 text-sm font-semibold text-[#2a2a2a]">Subscribed</p>
                <p className="text-sm leading-snug text-neutral-600">
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

      <PageShell className="py-8 sm:py-10 md:py-11 supports-[padding:max(0px)]:pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-6 lg:gap-x-8 lg:gap-y-6">
          <div className="col-span-2 sm:col-span-3 lg:col-span-2">
            <div className="mb-3 flex items-center gap-2.5">
              <Flag size={28} className="text-[var(--brand-blue)]" aria-hidden strokeWidth={1.75} />
              <span className="text-lg font-semibold tracking-tight">{SITE_NAME}</span>
            </div>
            <p className="mb-4 max-w-sm text-sm leading-snug text-neutral-600">
              Flags, vectors, archives, and symbols — structured for licensing-conscious teams.
            </p>
            <div className="flex flex-wrap gap-1">
              {[
                { href: 'https://twitter.com', label: 'Twitter', Icon: Twitter },
                { href: 'https://facebook.com', label: 'Facebook', Icon: Facebook },
                { href: 'https://instagram.com', label: 'Instagram', Icon: Instagram },
                { href: 'https://linkedin.com', label: 'LinkedIn', Icon: Linkedin },
                { href: 'https://github.com', label: 'GitHub', Icon: Github },
              ].map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-200/60 hover:text-[#2a2a2a]"
                  aria-label={label}
                >
                  <Icon size={17} aria-hidden />
                </a>
              ))}
            </div>
          </div>

          <LinkColumn title="Products">
            <li>
              <Link href="/categories/country-flags" className={linkMuted}>
                Country flags
              </Link>
            </li>
            <li>
              <Link href="/categories/flag-videos" className={linkMuted}>
                Flag videos
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
          </LinkColumn>

          <LinkColumn title="Company">
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
          </LinkColumn>

          <LinkColumn title="Legal">
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
          </LinkColumn>

          <LinkColumn title="Support">
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
          </LinkColumn>
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-neutral-200/90 pt-6 lg:mt-7 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <div className="min-w-0 lg:max-w-xs">
            <h3 className="text-sm font-semibold text-[#2a2a2a]">Occasional notes</h3>
            <p className="mt-1 text-xs leading-snug text-neutral-600">
              Product updates and curated drops — low frequency, straight to inbox.
            </p>
          </div>
          <form
            onSubmit={handleNewsletterSubmit}
            className="flex w-full min-w-0 flex-col gap-2 sm:max-w-md sm:flex-row sm:items-center lg:max-w-lg lg:flex-1 lg:justify-end"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="min-h-10 flex-1 rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-sm text-[#2a2a2a] placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300/80"
              required
            />
            <button
              type="submit"
              className="min-h-10 shrink-0 rounded-lg bg-[var(--brand-blue)] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-blue-hover)] sm:px-6"
            >
              Subscribe
            </button>
          </form>
        </div>

        <p className="mt-5 text-xs leading-relaxed text-neutral-500">
          Trust &amp; billing transparency: payments and subscriptions may be processed by {P.PAYMENT_PROCESSOR}. Legal
          pages are published as customizable templates — replace bracketed placeholders with your finalized information
          and have counsel review for each market you serve.
        </p>

        <div className="mt-5 flex flex-col gap-3 border-t border-neutral-200/90 pt-5 text-sm md:flex-row md:items-center md:justify-between">
          <p className="text-neutral-600">
            © {currentYear} {SITE_NAME}. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
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
            <a
              href={`mailto:${contactEmail}`}
              className="inline-flex items-center gap-1.5 text-sm text-neutral-600 underline-offset-4 hover:text-[var(--brand-blue)] hover:underline"
            >
              <Mail size={14} aria-hidden />
              {contactEmail}
            </a>
          </div>
        </div>
      </PageShell>
    </footer>
  );
}
