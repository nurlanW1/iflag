'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { getPublicContactEmail } from '@/lib/legal/legal-placeholders';

type FaqItem = { q: string; a: React.ReactNode };
type FaqSection = { id: string; title: string; items: FaqItem[] };

function getFaqSections(contactEmail: string): FaqSection[] {
  return [
  {
    id: 'general',
    title: 'General',
    items: [
      {
        q: 'What is Flagswing?',
        a: 'Flagswing is the world’s most comprehensive flag asset library — SVG, PNG, EPS, video, historical flags, and creative compositions, all properly licensed for designers, journalists, and developers.',
      },
      {
        q: 'How many flags do you have?',
        a: '250+ assets covering 195 independent states, 50 US states, autonomous regions, and 20+ historical empires. New flags added weekly.',
      },
      {
        q: 'What makes Flagswing different?',
        a: 'Specialization. Official color codes (HEX, CMYK, Pantone), multiple shapes, 4K video, historical archives, and clear commercial licensing — all focused exclusively on flags.',
      },
    ],
  },
  {
    id: 'downloads',
    title: 'Downloads',
    items: [
      {
        q: 'How do I download a free flag?',
        a: 'Click “Download Free” — no account, no email required. Instant download.',
      },
      {
        q: 'What formats are included?',
        a: 'Free: SVG + PNG. Premium: SVG, PNG, EPS, PDF. Video: MP4 + MOV.',
      },
      {
        q: 'What is the maximum resolution?',
        a: 'SVG/EPS: infinitely scalable vector. PNG: up to 4000×2667 px. Video: 4K (3840×2160 px).',
      },
    ],
  },
  {
    id: 'licensing',
    title: 'Licensing',
    items: [
      {
        q: 'Can I use flags commercially?',
        a: 'Free flags: yes, personal and commercial, no attribution needed. Premium: full commercial license included.',
      },
      {
        q: 'Do I need to credit Flagswing?',
        a: 'No attribution required for any asset — free or premium.',
      },
      {
        q: 'Can I use flags on merchandise?',
        a: (
          <>
            Yes with Premium license (up to 500 units). For bulk orders:{' '}
            <a
              href={`mailto:${contactEmail}`}
              className="font-medium text-[var(--brand-blue)] underline-offset-2 hover:underline"
            >
              {contactEmail}
            </a>
          </>
        ),
      },
    ],
  },
  {
    id: 'billing',
    title: 'Billing',
    items: [
      {
        q: 'What payment methods do you accept?',
        a: 'All major cards (Visa, Mastercard, Amex) via Paddle secure checkout.',
      },
      {
        q: 'Can I get a refund?',
        a: (
          <>
            Corrupted file or wrong delivery — yes, within 7 days. Email{' '}
            <a
              href={`mailto:${contactEmail}`}
              className="font-medium text-[var(--brand-blue)] underline-offset-2 hover:underline"
            >
              {contactEmail}
            </a>{' '}
            with your order ID.
          </>
        ),
      },
      {
        q: 'Do you provide invoices?',
        a: 'Yes, automatically emailed after every purchase.',
      },
    ],
  },
  {
    id: 'technical',
    title: 'Technical',
    items: [
      {
        q: 'What software opens SVG files?',
        a: 'Illustrator, Figma, Inkscape, Sketch, Affinity Designer, any modern browser.',
      },
      {
        q: 'Colors look different on screen vs print. Why?',
        a: 'Use our CMYK values for accurate print output. Find color codes on each flag’s detail page.',
      },
      {
        q: 'Can I embed flags via CDN?',
        a: 'Yes — CDN links available on each flag page under the “For Developers” section.',
      },
    ],
  },
  ];
}

function AccordionItem({
  q,
  a,
  open,
  onToggle,
}: {
  q: string;
  a: React.ReactNode;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-neutral-200/80 last:border-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 py-4 text-left transition-colors hover:text-[var(--brand-blue)]"
        aria-expanded={open}
      >
        <span className="text-[0.95rem] font-semibold leading-snug text-[#2a2a2a]">{q}</span>
        <ChevronDown
          size={18}
          aria-hidden
          className={`shrink-0 text-neutral-400 transition-transform duration-300 ${
            open ? 'rotate-180 text-[var(--brand-blue)]' : ''
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          open ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <p className="pb-5 pr-8 text-sm leading-relaxed text-neutral-500">{a}</p>
      </div>
    </div>
  );
}

export default function FaqPage() {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const contactEmail = getPublicContactEmail();
  const faqSections = getFaqSections(contactEmail);

  const toggle = (key: string) =>
    setOpenKey((cur) => (cur === key ? null : key));

  return (
    <main className="marketplace-shell min-h-screen bg-[#fafaf9] pb-20 pt-10 sm:pb-24 sm:pt-12">
      {/* Page header */}
      <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-12">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
          Help center
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-[#2a2a2a] sm:text-4xl">
          Frequently asked questions
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-neutral-500 sm:text-base">
          Can&apos;t find your answer?{' '}
          <Link
            href="/contact"
            className="font-semibold text-[var(--brand-blue)] underline-offset-2 hover:underline"
          >
            Contact us
          </Link>
          .
        </p>
      </div>

      {/* FAQ sections */}
      <div className="mx-auto max-w-2xl space-y-8">
        {faqSections.map((section) => (
          <section key={section.id} aria-labelledby={`faq-${section.id}`}>
            <h2
              id={`faq-${section.id}`}
              className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400"
            >
              {section.title}
            </h2>
            <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white px-5 shadow-sm">
              {section.items.map((item, idx) => {
                const key = `${section.id}-${idx}`;
                return (
                  <AccordionItem
                    key={key}
                    q={item.q}
                    a={item.a}
                    open={openKey === key}
                    onToggle={() => toggle(key)}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="mx-auto mt-14 max-w-2xl rounded-2xl border border-neutral-200/80 bg-white px-6 py-8 text-center shadow-sm sm:mt-16">
        <p className="text-base font-semibold text-[#2a2a2a]">Still have questions?</p>
        <p className="mt-1.5 text-sm text-neutral-500">
          Our team responds within one business day.
        </p>
        <Link
          href="/contact"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--brand-blue)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--brand-blue-hover)]"
        >
          Get in touch
        </Link>
      </div>
    </main>
  );
}
