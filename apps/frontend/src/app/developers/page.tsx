import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Code2,
  BookOpen,
  Package,
  Figma,
  Github,
  ExternalLink,
  Zap,
  Search,
  Layers,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import CdnSection from './CdnSection';
import WaitlistForm from './WaitlistForm';

export const metadata: Metadata = {
  title: 'For Developers — Flag CDN & API | Flagswing',
  description:
    'Embed country flags in your app with Flagswing CDN, REST API, or React package. Free tier available, no signup required for CDN.',
};

const CDN_BASE =
  process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL || 'https://cdn.flagswing.com';

const RESPONSE_EXAMPLE = `{
  "code": "uz",
  "name": "Uzbekistan",
  "slug": "uzbekistan",
  "formats": {
    "svg": "${CDN_BASE}/flags/svg/uz.svg",
    "png": "${CDN_BASE}/flags/png/uz.png",
    "eps": "${CDN_BASE}/flags/eps/uz.eps"
  },
  "colors": [
    { "name": "Teal Blue", "hex": "#1EBFAE" },
    { "name": "White", "hex": "#FFFFFF" },
    { "name": "Green", "hex": "#1EB53A" }
  ],
  "license": "free",
  "premium_shapes": ["sphere", "heart", "star", "wave"]
}`;

const NPM_INSTALL = `npm install flagswing-react`;

const NPM_USAGE = `import { Flag, FlagIcon } from 'flagswing-react'

// Basic rectangular flag
<Flag country="uz" size={32} />

// Premium shape — sphere
<Flag country="uz" shape="sphere" size={64} />

// Compact icon variant
<FlagIcon country="us" />`;

const ENDPOINTS = [
  {
    method: 'GET',
    path: 'https://api.flagswing.com/v1/flags/{code}',
    desc: 'Single flag by ISO code',
  },
  {
    method: 'GET',
    path: 'https://api.flagswing.com/v1/flags/{code}?format=png',
    desc: 'Single flag, specific format',
  },
  {
    method: 'GET',
    path: 'https://api.flagswing.com/v1/flags?region=europe&limit=20',
    desc: 'List flags by region',
  },
  {
    method: 'GET',
    path: 'https://api.flagswing.com/v1/flags/search?q=uzb',
    desc: 'Search flags by name or code',
  },
];

const RATE_LIMITS = [
  { plan: 'Free', requests: '100', price: '$0' },
  { plan: 'Basic', requests: '1,000', price: '$9/mo' },
  { plan: 'Pro', requests: '10,000', price: '$29/mo' },
  { plan: 'Enterprise', requests: 'Unlimited', price: 'Contact' },
];

const OSS_REPOS = [
  {
    name: 'circle-flags',
    license: 'MIT',
    desc: '400+ minimalist circular SVG flags, pixel-perfect at any size.',
    url: 'https://github.com/HatScripts/circle-flags',
    stars: '3.5k',
  },
  {
    name: 'flag-icons',
    license: 'MIT',
    desc: 'CSS class–based flag library with 250+ country flags.',
    url: 'https://github.com/lipis/flag-icons',
    stars: '9.8k',
  },
  {
    name: 'flagpack-core',
    license: 'MIT',
    desc: 'React components for country flags — part of the flagpack ecosystem.',
    url: 'https://github.com/Yummygum/flagpack-core',
    stars: '740',
  },
];

const FIGMA_FEATURES = [
  'Search 250+ flags directly in Figma',
  'Insert as SVG or PNG',
  'Premium shapes for Pro users',
  'Auto-update when flags change',
];

export default function DevelopersPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1e3a8a] via-[#2563eb] to-[#0f172a] py-20 md:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(circle at 70% 30%, #60a5fa 0%, transparent 60%), radial-gradient(circle at 20% 80%, #818cf8 0%, transparent 50%)',
          }}
        />
        <div className="relative max-w-6xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-semibold text-blue-100 mb-6">
            <Code2 size={15} aria-hidden />
            Developer Tools
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-5 leading-tight">
            Flagswing for{' '}
            <span className="text-blue-300">Developers</span>
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-10 leading-relaxed">
            Embed any flag in seconds. CDN, API, React package, and Figma plugin — free tier available, no signup required for CDN.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/developers/api-keys"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-base font-bold text-[#2563eb] shadow-lg transition hover:bg-blue-50"
            >
              Get API Key — Free
              <ArrowRight size={16} aria-hidden />
            </Link>
            <Link
              href="/developers/docs"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white/40 bg-white/10 px-7 py-3.5 text-base font-bold text-white transition hover:bg-white/20"
            >
              <BookOpen size={16} aria-hidden />
              View Docs
            </Link>
          </div>
        </div>
      </section>

      {/* ── SECTION A — CDN (client component) ── */}
      <CdnSection />

      {/* ── SECTION B — REST API ── */}
      <section className="py-16 bg-neutral-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-bold text-[#2a2a2a] mb-2">REST API</h2>
              <p className="text-neutral-500 text-lg">
                Fetch flag metadata, formats, and colors from our JSON API.
              </p>
            </div>
            <Link
              href="/developers/api-keys"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-blue)] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[var(--brand-blue-hover)] whitespace-nowrap"
            >
              Get Free API Key
              <ArrowRight size={14} aria-hidden />
            </Link>
          </div>

          {/* Endpoints */}
          <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden mb-8">
            <div className="px-5 py-3 bg-neutral-50 border-b border-neutral-200">
              <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Endpoints</span>
            </div>
            <div className="divide-y divide-neutral-100">
              {ENDPOINTS.map((ep) => (
                <div key={ep.path} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                  <span className="shrink-0 rounded-md bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700">
                    {ep.method}
                  </span>
                  <code className="flex-1 min-w-0 text-sm font-mono text-neutral-700 break-all">{ep.path}</code>
                  <span className="text-sm text-neutral-400 whitespace-nowrap">{ep.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Response example */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-[#2a2a2a] mb-3">Example Response</h3>
            <div className="bg-[#0f172a] rounded-xl p-4 font-mono text-sm text-[#e2e8f0] overflow-x-auto">
              <pre>{RESPONSE_EXAMPLE}</pre>
            </div>
          </div>

          {/* Rate limits */}
          <div>
            <h3 className="text-lg font-bold text-[#2a2a2a] mb-3">Rate Limits</h3>
            <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50">
                    <th className="text-left px-5 py-3 font-semibold text-neutral-600">Plan</th>
                    <th className="text-left px-5 py-3 font-semibold text-neutral-600">Requests / day</th>
                    <th className="text-left px-5 py-3 font-semibold text-neutral-600">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {RATE_LIMITS.map((row) => (
                    <tr key={row.plan} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-5 py-3 font-semibold text-neutral-800">{row.plan}</td>
                      <td className="px-5 py-3 text-neutral-600">{row.requests}</td>
                      <td className="px-5 py-3 text-neutral-600">
                        {row.plan === 'Free' ? (
                          <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700">
                            {row.price}
                          </span>
                        ) : (
                          row.price
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION C — NPM Package ── */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <h2 className="text-3xl font-bold text-[#2a2a2a]">React Package</h2>
            <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-orange-600">
              Coming Soon
            </span>
          </div>
          <p className="text-neutral-500 text-lg mb-8">
            Install the official <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-sm font-mono text-[#2563eb]">flagswing-react</code> package and render flags with a single component.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Install</span>
                <Package size={16} className="text-neutral-400" aria-hidden />
              </div>
              <div className="bg-[#0f172a] rounded-xl p-4 font-mono text-sm text-[#e2e8f0]">
                <pre>{NPM_INSTALL}</pre>
              </div>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Usage</span>
                <Code2 size={16} className="text-neutral-400" aria-hidden />
              </div>
              <div className="bg-[#0f172a] rounded-xl p-4 font-mono text-sm text-[#e2e8f0] overflow-x-auto">
                <pre>{NPM_USAGE}</pre>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-[#2a2a2a] mb-3">Join the waitlist</h3>
            <p className="text-sm text-neutral-500 mb-4">
              Be the first to know when <code className="font-mono text-[#2563eb]">flagswing-react</code> launches.
            </p>
            <WaitlistForm type="npm-package" placeholder="your@email.com" buttonLabel="Notify me when ready" />
          </div>
        </div>
      </section>

      {/* ── SECTION D — Figma Plugin ── */}
      <section className="py-16 bg-neutral-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <h2 className="text-3xl font-bold text-[#2a2a2a]">Figma Plugin</h2>
            <span className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-purple-600">
              Coming Soon
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div>
              <p className="text-neutral-500 text-lg mb-6">
                Search and insert any flag directly inside Figma — no copy-paste, no file management.
              </p>
              <ul className="space-y-3 mb-8">
                {FIGMA_FEATURES.map((feat) => (
                  <li key={feat} className="flex items-center gap-3 text-neutral-700">
                    <CheckCircle2 size={18} className="shrink-0 text-green-500" aria-hidden />
                    {feat}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                disabled
                className="inline-flex items-center gap-2 rounded-xl border-2 border-neutral-200 bg-neutral-100 px-6 py-3 text-sm font-bold text-neutral-400 cursor-not-allowed"
                aria-label="Install from Figma Community — coming soon"
              >
                <Figma size={16} aria-hidden />
                Install from Figma Community
                <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-bold text-neutral-500">
                  Soon
                </span>
              </button>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-bold text-[#2a2a2a] mb-3">Get notified at launch</h3>
              <p className="text-sm text-neutral-500 mb-4">
                {"We'll email you the moment the plugin goes live on Figma Community."}
              </p>
              <WaitlistForm type="figma-plugin" placeholder="designer@company.com" buttonLabel="Notify me" />
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION E — Open Source ── */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[#2a2a2a] mb-2">Open Source Ecosystem</h2>
            <p className="text-neutral-500 text-lg">
              We stand on the shoulders of great open-source work. All repos below are MIT licensed and included in our free tier.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {OSS_REPOS.map((repo) => (
              <div key={repo.name} className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm flex flex-col">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Github size={18} className="shrink-0 text-neutral-600" aria-hidden />
                    <span className="font-bold text-[#2a2a2a] text-base">{repo.name}</span>
                  </div>
                  <span className="shrink-0 rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-xs font-bold text-green-700">
                    {repo.license}
                  </span>
                </div>
                <p className="text-sm text-neutral-500 flex-1 mb-4">{repo.desc}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-lg">
                    ✓ Included in free tier
                  </span>
                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--brand-blue)] hover:underline"
                  >
                    View on GitHub
                    <ExternalLink size={13} aria-hidden />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="py-16 bg-gradient-to-br from-[#1e3a8a] to-[#0f172a]">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to embed flags?</h2>
          <p className="text-blue-200 text-lg mb-8">
            CDN is free forever — no account needed. API key unlocks higher limits and metadata.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/developers/api-keys"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-base font-bold text-[#2563eb] shadow-lg transition hover:bg-blue-50"
            >
              <Zap size={16} aria-hidden />
              Get Free API Key
            </Link>
            <Link
              href="/developers/docs"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white/40 bg-white/10 px-7 py-3.5 text-base font-bold text-white transition hover:bg-white/20"
            >
              <BookOpen size={16} aria-hidden />
              Read the Docs
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
