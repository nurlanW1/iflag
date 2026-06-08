import { Flag, Download, FileText, Image as ImageIcon, Mail, ArrowRight } from 'lucide-react';
import { SITE_NAME } from '@/lib/seo/site-config';

export default function PressPage() {
  return (
    <main className="min-h-screen bg-[#fafaf9]">
      {/* Hero */}
      <div className="bg-gradient-to-b from-white to-[#fafaf9] border-b border-neutral-200">
        <div className="marketplace-shell py-14 sm:py-16">
          <div className="flex items-center gap-2 mb-4">
            <Flag size={18} className="text-[var(--brand-blue)]" strokeWidth={1.75} aria-hidden />
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">Press</p>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#2a2a2a] sm:text-4xl">
            Press kit
          </h1>
          <p className="mt-3 max-w-lg text-base text-neutral-500">
            Logos, brand assets, and media resources for {SITE_NAME}. Free to use in editorial coverage.
          </p>
        </div>
      </div>

      <div className="marketplace-shell py-12 sm:py-16 space-y-12">
        {/* Asset cards */}
        <section aria-labelledby="assets-heading">
          <h2 id="assets-heading" className="mb-6 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Brand assets
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-5 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-blue-soft)]">
                <ImageIcon className="h-5 w-5 text-[var(--brand-blue)]" aria-hidden />
              </div>
              <div>
                <h3 className="font-semibold text-[#2a2a2a]">Logos</h3>
                <p className="mt-1 text-sm leading-relaxed text-neutral-500">
                  Download our logo in SVG, PNG, and dark/light variants for articles and publications.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex w-fit items-center gap-2 rounded-xl bg-[var(--brand-blue)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--brand-blue-hover)]"
              >
                <Download className="h-4 w-4" aria-hidden />
                Download logos
              </button>
            </div>

            <div className="flex flex-col gap-5 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                <FileText className="h-5 w-5 text-emerald-600" aria-hidden />
              </div>
              <div>
                <h3 className="font-semibold text-[#2a2a2a]">Brand guidelines</h3>
                <p className="mt-1 text-sm leading-relaxed text-neutral-500">
                  Color palette, typography, spacing rules, and correct usage of the {SITE_NAME} brand.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex w-fit items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 shadow-sm transition-colors hover:bg-neutral-50"
              >
                <Download className="h-4 w-4" aria-hidden />
                Download guidelines
              </button>
            </div>
          </div>
        </section>

        {/* Media inquiries */}
        <section className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm sm:p-10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-blue-soft)]">
                <Mail className="h-5 w-5 text-[var(--brand-blue)]" aria-hidden />
              </div>
              <div>
                <p className="font-semibold text-[#2a2a2a]">Media inquiries</p>
                <p className="mt-1 text-sm text-neutral-500">
                  Interview requests, additional press materials, or partnership inquiries.
                </p>
              </div>
            </div>
            <a
              href="mailto:press@flagstock.com"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[var(--brand-blue)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--brand-blue-hover)]"
            >
              press@flagstock.com
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
