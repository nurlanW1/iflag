import { Flag, Briefcase, MapPin, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { getPublicContactEmail } from '@/lib/legal/legal-placeholders';
import { SITE_NAME } from '@/lib/seo/site-config';

const openPositions = [
  {
    title: 'Senior Frontend Developer',
    location: 'Remote',
    type: 'Full-time',
    department: 'Engineering',
    accent: 'text-[var(--brand-blue)] bg-[var(--brand-blue-soft)]',
  },
  {
    title: 'UI/UX Designer',
    location: 'Remote',
    type: 'Full-time',
    department: 'Design',
    accent: 'text-violet-600 bg-violet-50',
  },
  {
    title: 'Content Manager',
    location: 'Remote',
    type: 'Part-time',
    department: 'Content',
    accent: 'text-emerald-600 bg-emerald-50',
  },
];

const perks = [
  { label: '100% remote', icon: MapPin },
  { label: 'Flexible hours', icon: Clock },
  { label: 'Meaningful work', icon: Sparkles },
];

export default function CareersPage() {
  const contactEmail = getPublicContactEmail();

  return (
    <main className="min-h-screen bg-[#fafaf9]">
      {/* Hero */}
      <div className="bg-gradient-to-b from-white to-[#fafaf9] border-b border-neutral-200">
        <div className="marketplace-shell py-14 sm:py-16">
          <div className="flex items-center gap-2 mb-4">
            <Flag size={18} className="text-[var(--brand-blue)]" strokeWidth={1.75} aria-hidden />
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">Careers</p>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#2a2a2a] sm:text-4xl">
            Join {SITE_NAME}
          </h1>
          <p className="mt-3 max-w-lg text-base text-neutral-500">
            We&apos;re building a calm, world-class marketplace for flag assets. If you love design,
            craftsmanship, and working remotely — we&apos;d like to meet you.
          </p>
          {/* Perks row */}
          <div className="mt-6 flex flex-wrap gap-3">
            {perks.map((p) => (
              <span
                key={p.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-600 shadow-sm"
              >
                <p.icon className="h-3.5 w-3.5 text-neutral-400" aria-hidden />
                {p.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="marketplace-shell py-12 sm:py-16 space-y-12">
        {/* Open roles */}
        <section aria-labelledby="positions-heading">
          <h2 id="positions-heading" className="mb-6 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Open positions
          </h2>
          <div className="flex flex-col gap-3">
            {openPositions.map((pos) => (
              <div
                key={pos.title}
                className="group flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:border-[var(--brand-blue)]/30 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${pos.accent}`}>
                    <Briefcase className="h-5 w-5" aria-hidden />
                  </div>
                  <div>
                    <p className="font-semibold text-[#2a2a2a]">{pos.title}</p>
                    <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-neutral-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" aria-hidden />
                        {pos.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" aria-hidden />
                        {pos.type}
                      </span>
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3.5 w-3.5" aria-hidden />
                        {pos.department}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[var(--brand-blue)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--brand-blue-hover)] sm:self-center"
                >
                  Apply now
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* General inquiry */}
        <section className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm sm:p-10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-[#2a2a2a]">Don&apos;t see a match?</p>
              <p className="mt-1 text-sm text-neutral-500">
                Send us your resume and a note about what you&apos;d bring to the team.
              </p>
            </div>
            <a
              href={`mailto:${contactEmail}`}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-800 shadow-sm transition-colors hover:bg-neutral-50"
            >
              {contactEmail}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
