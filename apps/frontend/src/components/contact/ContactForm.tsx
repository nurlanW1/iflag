'use client';

import { Flag, Mail, MessageSquare, Send, X, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { PageShell } from '@/components/layout';
import { getPublicContactEmail } from '@/lib/legal/legal-placeholders';
import { SITE_NAME } from '@/lib/seo/site-config';

export default function ContactForm() {
  const contactEmail = getPublicContactEmail();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [showNotification, setShowNotification] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowNotification(true);
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <main className="min-h-screen bg-[#fafaf9]">
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 right-4 z-50 max-w-md rounded-2xl border border-emerald-100 bg-white p-4 shadow-xl"
          >
            <div className="flex items-start gap-3">
              <CheckCircle className="mt-0.5 flex-shrink-0 text-emerald-500" size={20} />
              <div className="flex-1">
                <p className="mb-1 font-semibold text-[#2a2a2a]">Message recorded</p>
                <p className="text-sm text-neutral-500">
                  This demo form does not send email yet. Contact us directly at{' '}
                  <a href={`mailto:${contactEmail}`} className="font-medium text-[var(--brand-blue)] hover:underline">
                    {contactEmail}
                  </a>
                  .
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNotification(false)}
                className="flex-shrink-0 text-neutral-400 transition-colors hover:text-neutral-600"
                aria-label="Close notification"
              >
                <X size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PageShell className="py-14 sm:py-16">
        <div className="mb-4 flex items-center gap-2">
          <Flag size={18} className="text-[var(--brand-blue)]" strokeWidth={1.75} aria-hidden />
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">Contact</p>
        </div>
        <h1 className="mb-8 text-3xl font-semibold tracking-tight text-[#2a2a2a] sm:text-4xl">Get in touch</h1>

        <p className="mb-10 text-sm text-neutral-500">
          For legal notices, privacy requests, and refund questions, use the contact details below and
          reference our{' '}
          <Link href="/privacy-policy" className="font-medium text-[var(--brand-blue)] hover:underline">
            Privacy Policy
          </Link>
          ,{' '}
          <Link href="/terms-of-service" className="font-medium text-[var(--brand-blue)] hover:underline">
            Terms
          </Link>
          , and{' '}
          <Link href="/refunds" className="font-medium text-[var(--brand-blue)] hover:underline">
            Refund Policy
          </Link>
          .
        </p>

        <div className="grid gap-12 md:grid-cols-2">
          <div>
            <h2 className="mb-4 text-lg font-semibold text-[#2a2a2a]">Contact details</h2>
            <p className="mb-8 text-sm leading-relaxed text-neutral-500">
              Questions about {SITE_NAME}, licensing, billing, or account access? We aim to respond to
              routine inquiries within a reasonable time.
            </p>

            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-blue-soft)]">
                  <Mail className="h-4 w-4 text-[var(--brand-blue)]" aria-hidden />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Email</p>
                  <a href={`mailto:${contactEmail}`} className="mt-0.5 text-sm font-medium text-[var(--brand-blue)] hover:underline">
                    {contactEmail}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-100">
                  <MessageSquare className="h-4 w-4 text-neutral-500" aria-hidden />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Postal address</p>
                  <p className="mt-0.5 text-sm text-neutral-500">
                    Available on request for legal matters.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-medium text-[#2a2a2a]">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-[#2a2a2a] shadow-sm placeholder:text-neutral-400 focus:border-[var(--brand-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]/15"
                  required
                  autoComplete="name"
                />
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-[#2a2a2a]">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-[#2a2a2a] shadow-sm placeholder:text-neutral-400 focus:border-[var(--brand-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]/15"
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label htmlFor="subject" className="mb-2 block text-sm font-medium text-[#2a2a2a]">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-[#2a2a2a] shadow-sm placeholder:text-neutral-400 focus:border-[var(--brand-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]/15"
                  required
                />
              </div>

              <div>
                <label htmlFor="message" className="mb-2 block text-sm font-medium text-[#2a2a2a]">
                  Message
                </label>
                <textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={5}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-[#2a2a2a] shadow-sm placeholder:text-neutral-400 focus:border-[var(--brand-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]/15"
                  required
                />
              </div>

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-blue)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--brand-blue-hover)]"
              >
                <Send size={16} aria-hidden />
                Send message
              </button>
            </form>
          </div>
        </div>
      </PageShell>
    </main>
  );
}
