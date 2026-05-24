'use client';

import { Flag, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { PRICING_MARKETING } from '@/lib/marketing/pricing-config';

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'What file formats are available?',
      answer:
        'We offer flags in multiple formats including SVG, PNG, JPG, AI, EPS, and video formats. Vector formats are perfect for scalable designs, while raster formats work great for web and print.',
    },
    {
      question: 'How are subscriptions and purchases billed?',
      answer: `We use Paddle as Merchant of Record. Current plans: ${PRICING_MARKETING.plansLine}. Paddle runs secure checkout, calculates tax where required, and sends receipts. You manage cards and invoices through the Paddle customer portal.`,
    },
    {
      question: 'Can I use flags for commercial projects?',
      answer:
        'Yes — with an active Pro subscription you can download catalog assets for commercial use while your plan is active. One-time purchases at the listed per-asset price keep Pro files in your account without an ongoing subscription. Free previews may have narrower terms; see our license page.',
    },
    {
      question: 'How do I download flags?',
      answer: `Search for the flag you need, pick a format, then subscribe (${PRICING_MARKETING.monthlyPerMonth} or ${PRICING_MARKETING.weeklyPerWeek}) for catalog-wide access, or buy a single asset for ${PRICING_MARKETING.oneTimeShort}. Free previews download where we publish them at no charge.`,
    },
    {
      question: 'What is the difference between free and premium?',
      answer: `Free tier: previews where available. Premium: unlimited Pro downloads while subscribed (${PRICING_MARKETING.weeklyPerWeek} or ${PRICING_MARKETING.monthlyPerMonth}), or ${PRICING_MARKETING.oneTimePerAsset} to own one asset outright.`,
    },
    {
      question: 'Can I request a specific flag?',
      answer:
        "Absolutely! We're constantly adding new flags. If you need a specific flag that isn't available, contact us at support@flagstock.com and we'll do our best to add it.",
    },
    {
      question: 'Are the flags updated regularly?',
      answer:
        'Yes — we regularly update the collection with new designs, corrections, and formats. Pro subscribers get access to new Pro-tier files as they are published.',
    },
  ];

  return (
    <main className="min-h-screen bg-white">
      <div className="marketplace-shell py-14 sm:py-16 lg:py-20">
        <div className="mb-12 flex items-center gap-3">
          <Flag size={32} className="text-[#2563eb]" />
          <h1 className="text-4xl font-black text-black">Frequently Asked Questions</h1>
        </div>

        <p className="mb-8 max-w-3xl text-gray-600">{PRICING_MARKETING.plansLine}</p>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-gray-50"
              >
                <span className="pr-4 font-semibold text-black">{faq.question}</span>
                <ChevronDown
                  className={`flex-shrink-0 text-[#2563eb] transition-transform ${
                    openIndex === idx ? 'rotate-180 transform' : ''
                  }`}
                  size={20}
                />
              </button>
              {openIndex === idx ? (
                <div className="px-6 pb-4">
                  <p className="text-gray-700">{faq.answer}</p>
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-xl bg-gray-50 p-8 text-center">
          <h2 className="mb-4 text-2xl font-bold text-black">Still have questions?</h2>
          <p className="mb-4 text-gray-700">
            See live checkout amounts on the{' '}
            <Link href="/pricing" className="font-semibold text-[#2563eb] hover:underline">
              pricing page
            </Link>{' '}
            or email support.
          </p>
          <a
            href="mailto:support@flagstock.com"
            className="inline-block rounded-lg bg-[#2563eb] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#1d4ed8]"
          >
            Contact Support
          </a>
        </div>
      </div>
    </main>
  );
}
