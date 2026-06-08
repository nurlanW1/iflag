import { Flag, Search, BookOpen, Download, CreditCard, FileText, MessageCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const helpTopics = [
  {
    title: 'Getting started',
    description: 'Browse the gallery, download official flags, and understand the free tier.',
    icon: BookOpen,
    href: '/gallery',
    color: 'text-[var(--brand-blue)]',
    bg: 'bg-[var(--brand-blue-soft)]',
  },
  {
    title: 'Downloading assets',
    description: 'How to save SVG, PNG, and WebP files — from free flags to premium designs.',
    icon: Download,
    href: '/gallery',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    title: 'Account & billing',
    description: 'Manage your profile, view purchase history, and understand one-time pricing.',
    icon: CreditCard,
    href: '/dashboard/purchases',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    title: 'Licensing',
    description: 'Understand what free and paid licenses allow for personal and commercial projects.',
    icon: FileText,
    href: '/licenses',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
  },
];

const faqs = [
  {
    q: 'Are the country flags really free?',
    a: 'Yes — all 200+ official flat country flags are free to download in SVG, PNG, and WebP. No account required.',
  },
  {
    q: 'What does a paid design include?',
    a: 'Premium designs unlock additional variant styles (3D, wave, embossed, etc.) for a one-time $1 payment per design. You own it forever.',
  },
  {
    q: 'Can I use flags commercially?',
    a: 'Free flags may be used for personal and editorial use. Paid designs include a commercial license. Check the Licensing page for details.',
  },
  {
    q: 'How do I re-download a purchase?',
    a: 'Go to Dashboard → Purchased files. Every design you\'ve paid for is available for re-download at any time, with no expiry.',
  },
];

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-[#fafaf9]">
      {/* Hero */}
      <div className="bg-gradient-to-b from-white to-[#fafaf9] border-b border-neutral-200">
        <div className="marketplace-shell py-14 sm:py-16">
          <div className="flex items-center gap-2 mb-4">
            <Flag size={20} className="text-[var(--brand-blue)]" strokeWidth={1.75} aria-hidden />
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">Help center</p>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#2a2a2a] sm:text-4xl">
            How can we help?
          </h1>
          <p className="mt-3 max-w-lg text-base text-neutral-500">
            Answers to common questions about downloading flags, licensing, and managing your account.
          </p>

          {/* Search bar — decorative, not wired */}
          <div className="mt-8 max-w-xl">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
                size={18}
                aria-hidden
              />
              <input
                type="search"
                placeholder="Search help articles…"
                className="w-full rounded-xl border border-neutral-200 bg-white py-3 pl-11 pr-4 text-sm text-[#2a2a2a] shadow-sm placeholder:text-neutral-400 focus:border-[var(--brand-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]/20"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="marketplace-shell py-12 sm:py-16 space-y-16">
        {/* Topic cards */}
        <section aria-labelledby="topics-heading">
          <h2 id="topics-heading" className="mb-6 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Browse by topic
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {helpTopics.map((topic) => (
              <Link
                key={topic.title}
                href={topic.href}
                className="group flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:border-[var(--brand-blue)]/30 hover:shadow-md"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${topic.bg}`}>
                  <topic.icon className={`h-5 w-5 ${topic.color}`} aria-hidden />
                </div>
                <div>
                  <h3 className="font-semibold text-[#2a2a2a] group-hover:text-[var(--brand-blue)] transition-colors">
                    {topic.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-500">{topic.description}</p>
                </div>
                <ArrowRight
                  className="mt-auto h-4 w-4 text-neutral-300 transition-all group-hover:translate-x-1 group-hover:text-[var(--brand-blue)]"
                  aria-hidden
                />
              </Link>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="mb-6 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Frequently asked
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {faqs.map((faq) => (
              <div
                key={faq.q}
                className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
              >
                <p className="font-semibold text-[#2a2a2a]">{faq.q}</p>
                <p className="mt-2 text-sm leading-relaxed text-neutral-500">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm sm:p-10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-blue-soft)]">
                <MessageCircle className="h-5 w-5 text-[var(--brand-blue)]" aria-hidden />
              </div>
              <div>
                <p className="font-semibold text-[#2a2a2a]">Still need help?</p>
                <p className="mt-1 text-sm text-neutral-500">
                  Can&apos;t find your answer above? Our support team is happy to assist.
                </p>
              </div>
            </div>
            <Link
              href="/contact"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[var(--brand-blue)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--brand-blue-hover)]"
            >
              Contact support
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
