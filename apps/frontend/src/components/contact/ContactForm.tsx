'use client';

import { Flag, Mail, MessageSquare, Send, X, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
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
    <main className="min-h-screen bg-white">
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 right-4 z-50 max-w-md rounded-lg border border-gray-200 bg-white p-4 shadow-xl"
          >
            <div className="flex items-start gap-3">
              <CheckCircle className="mt-0.5 flex-shrink-0 text-green-500" size={20} />
              <div className="flex-1">
                <p className="mb-1 font-semibold text-black">Message recorded</p>
                <p className="text-sm text-gray-600">
                  This demo form does not send email yet. Wire it to your support inbox or ticket
                  system, or contact us directly at{' '}
                  <a href={`mailto:${contactEmail}`} className="font-medium text-[#009ab6] hover:underline">
                    {contactEmail}
                  </a>
                  .
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNotification(false)}
                className="flex-shrink-0 text-gray-400 transition-colors hover:text-gray-600"
                aria-label="Close notification"
              >
                <X size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="mb-8 flex items-center gap-3">
          <Flag size={32} className="text-[#009ab6]" />
          <h1 className="text-4xl font-black text-black">Contact</h1>
        </div>

        <p className="mb-10 text-sm text-gray-600">
          For legal notices, privacy requests, and refund questions, use the contact details below and
          reference our{' '}
          <Link href="/privacy-policy" className="font-medium text-[#009ab6] hover:underline">
            Privacy Policy
          </Link>
          ,{' '}
          <Link href="/terms-of-service" className="font-medium text-[#009ab6] hover:underline">
            Terms
          </Link>
          , and{' '}
          <Link href="/refunds" className="font-medium text-[#009ab6] hover:underline">
            Refund Policy
          </Link>
          .
        </p>

        <div className="grid gap-12 md:grid-cols-2">
          <div>
            <h2 className="mb-6 text-2xl font-bold text-black">Get in touch</h2>
            <p className="mb-8 text-gray-700">
              Questions about {SITE_NAME}, licensing, billing, or account access? We aim to respond to
              routine inquiries within a reasonable time. [PLACEHOLDER: set your target response SLA,
              business hours, and languages supported.]
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <Mail className="mt-1 text-[#009ab6]" size={20} />
                <div>
                  <h3 className="mb-1 font-semibold text-black">Email</h3>
                  <a href={`mailto:${contactEmail}`} className="text-[#009ab6] hover:underline">
                    {contactEmail}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <MessageSquare className="mt-1 text-[#009ab6]" size={20} />
                <div>
                  <h3 className="mb-1 font-semibold text-black">Postal / registered office</h3>
                  <p className="text-gray-600">
                    [PLACEHOLDER: only publish if required in your jurisdiction — legal entity name and
                    address from your records; do not invent.]
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-medium text-black">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#009ab6] focus:outline-none"
                  required
                  autoComplete="name"
                />
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-black">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#009ab6] focus:outline-none"
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label htmlFor="subject" className="mb-2 block text-sm font-medium text-black">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#009ab6] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label htmlFor="message" className="mb-2 block text-sm font-medium text-black">
                  Message
                </label>
                <textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={5}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#009ab6] focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#009ab6] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#007a8a]"
              >
                <Send size={18} />
                Send message
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
