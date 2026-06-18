import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Developer Documentation | Flagswing',
  description:
    'Integrate Flagswing flags into your app using our CDN, REST API, or React package.',
};

const CDN_BASE =
  process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL || 'https://cdn.flagswing.com';

const NAV_SECTIONS = [
  { id: 'getting-started', label: 'Getting Started' },
  { id: 'cdn-reference', label: 'CDN Reference' },
  { id: 'api-reference', label: 'API Reference' },
  { id: 'rate-limits', label: 'Rate Limits' },
  { id: 'examples', label: 'Examples' },
];

function CodeBlock({ code, lang = '' }: { code: string; lang?: string }) {
  return (
    <div className="relative my-4 rounded-xl overflow-hidden">
      {lang && (
        <div className="bg-[#1e293b] px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-400 border-b border-[#334155]">
          {lang}
        </div>
      )}
      <div className="bg-[#0f172a] p-4 font-mono text-sm text-[#e2e8f0] overflow-x-auto">
        <pre>{code}</pre>
      </div>
    </div>
  );
}

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-24 text-2xl font-bold text-[#2a2a2a] mb-4 pt-4">
      {children}
    </h2>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-lg font-bold text-[#2a2a2a] mb-3 mt-6">{children}</h3>;
}

function Prose({ children }: { children: React.ReactNode }) {
  return <div className="text-neutral-600 leading-relaxed space-y-3">{children}</div>;
}

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Page header */}
      <div className="border-b border-neutral-200 bg-neutral-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-400 mb-2">
            <Link href="/developers" className="hover:text-[var(--brand-blue)] transition-colors">
              Developers
            </Link>
            <span>/</span>
            <span className="text-neutral-700 font-semibold">Docs</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#2a2a2a]">Developer Documentation</h1>
          <p className="text-neutral-500 mt-1.5 text-lg">
            Everything you need to integrate Flagswing flags into your app.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex gap-10 items-start">
          {/* ── Sidebar ── */}
          <aside className="hidden lg:block w-52 shrink-0 sticky top-24 self-start">
            <nav aria-label="Documentation sections">
              <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-3">
                On this page
              </p>
              <ul className="space-y-1">
                {NAV_SECTIONS.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="block rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-[var(--brand-blue-soft)] hover:text-[var(--brand-blue)]"
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
              <div className="mt-8 rounded-xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-bold text-blue-700 mb-2">Need an API key?</p>
                <Link
                  href="/developers/api-keys"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand-blue)] hover:underline"
                >
                  Get one free
                  <ArrowRight size={12} aria-hidden />
                </Link>
              </div>
            </nav>
          </aside>

          {/* ── Main content ── */}
          <div className="flex-1 min-w-0 space-y-12">
            {/* Getting Started */}
            <section aria-labelledby="getting-started">
              <SectionHeading id="getting-started">Getting Started</SectionHeading>
              <Prose>
                <p>
                  Flagswing provides country flags in SVG, PNG, and EPS formats via a global CDN. For simple
                  embedding, <strong>no account or API key is required</strong>. The CDN is free forever.
                </p>
                <p>
                  If you need flag metadata (name, colors, formats) or want higher request limits, generate a
                  free API key from your{' '}
                  <Link href="/developers/api-keys" className="text-[var(--brand-blue)] font-semibold hover:underline">
                    developer dashboard
                  </Link>
                  .
                </p>
              </Prose>

              <SubHeading>Quick start — CDN embed</SubHeading>
              <CodeBlock
                lang="html"
                code={`<!-- No signup required -->
<img
  src="${CDN_BASE}/flags/svg/uz.svg"
  alt="Uzbekistan flag"
  width="32"
  height="24"
  loading="lazy"
/>`}
              />

              <SubHeading>Quick start — API request</SubHeading>
              <CodeBlock
                lang="bash"
                code={`curl -H "X-API-Key: YOUR_KEY" \\
  https://api.flagswing.com/v1/flags/uz`}
              />
            </section>

            <hr className="border-neutral-100" />

            {/* CDN Reference */}
            <section aria-labelledby="cdn-reference">
              <SectionHeading id="cdn-reference">CDN Reference</SectionHeading>
              <Prose>
                <p>
                  All flags are served from a globally distributed edge network. Files are cached at the CDN
                  layer — typical response times are under 50 ms worldwide.
                </p>
              </Prose>

              <SubHeading>URL format</SubHeading>
              <CodeBlock
                code={`${CDN_BASE}/flags/{format}/{code}.{format}

Examples:
  ${CDN_BASE}/flags/svg/uz.svg
  ${CDN_BASE}/flags/png/us.png
  ${CDN_BASE}/flags/eps/gb.eps`}
              />

              <SubHeading>Supported formats</SubHeading>
              <div className="rounded-2xl border border-neutral-200 overflow-hidden mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-200">
                      <th className="text-left px-4 py-3 font-semibold text-neutral-600">Format</th>
                      <th className="text-left px-4 py-3 font-semibold text-neutral-600">Extension</th>
                      <th className="text-left px-4 py-3 font-semibold text-neutral-600">Best for</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    <tr>
                      <td className="px-4 py-3 font-semibold text-neutral-700">SVG</td>
                      <td className="px-4 py-3 font-mono text-neutral-500">.svg</td>
                      <td className="px-4 py-3 text-neutral-500">Web, any size, Retina displays</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-neutral-700">PNG</td>
                      <td className="px-4 py-3 font-mono text-neutral-500">.png</td>
                      <td className="px-4 py-3 text-neutral-500">Email templates, legacy browsers</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-neutral-700">EPS</td>
                      <td className="px-4 py-3 font-mono text-neutral-500">.eps</td>
                      <td className="px-4 py-3 text-neutral-500">Print, Illustrator, Photoshop</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <SubHeading>React example</SubHeading>
              <CodeBlock
                lang="tsx"
                code={`const CDN = '${CDN_BASE}';

function FlagImage({ code, size = 32 }: { code: string; size?: number }) {
  return (
    <img
      src={\`\${CDN}/flags/svg/\${code}.svg\`}
      alt={\`\${code.toUpperCase()} flag\`}
      width={size}
      height={Math.round(size * 0.75)}
      loading="lazy"
    />
  );
}

// Usage
<FlagImage code="uz" size={48} />`}
              />

              <SubHeading>Vue 3 example</SubHeading>
              <CodeBlock
                lang="vue"
                code={`<template>
  <img
    :src="\`${CDN_BASE}/flags/svg/\${code}.svg\`"
    :alt="\`\${code.toUpperCase()} flag\`"
    width="32"
    height="24"
    loading="lazy"
  />
</template>

<script setup lang="ts">
defineProps<{ code: string }>();
</script>`}
              />
            </section>

            <hr className="border-neutral-100" />

            {/* API Reference */}
            <section aria-labelledby="api-reference">
              <SectionHeading id="api-reference">API Reference</SectionHeading>
              <Prose>
                <p>
                  The REST API returns JSON. All endpoints require an <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-sm">X-API-Key</code> header
                  except where noted.
                </p>
              </Prose>

              <SubHeading>Authentication</SubHeading>
              <CodeBlock
                lang="bash"
                code={`# Pass your API key as a header
curl -H "X-API-Key: fs_live_xxxxxxxxxxxx" \\
  https://api.flagswing.com/v1/flags/uz`}
              />

              <SubHeading>GET /v1/flags/:code</SubHeading>
              <Prose>
                <p>Returns metadata for a single flag identified by its ISO 3166-1 alpha-2 code.</p>
              </Prose>
              <CodeBlock
                lang="bash"
                code={`curl -H "X-API-Key: YOUR_KEY" \\
  https://api.flagswing.com/v1/flags/uz`}
              />
              <CodeBlock
                lang="json"
                code={`{
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
    { "name": "White",     "hex": "#FFFFFF" },
    { "name": "Green",     "hex": "#1EB53A" }
  ],
  "license": "free",
  "premium_shapes": ["sphere", "heart", "star", "wave"]
}`}
              />

              <SubHeading>GET /v1/flags/:code?format=png</SubHeading>
              <Prose>
                <p>
                  Same as above but the <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-sm">formats</code> object is filtered to the
                  requested format. Valid values: <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-sm">svg</code>,{' '}
                  <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-sm">png</code>,{' '}
                  <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-sm">eps</code>.
                </p>
              </Prose>

              <SubHeading>GET /v1/flags?region=europe&amp;limit=20</SubHeading>
              <Prose>
                <p>List flags, optionally filtered by region and paginated.</p>
              </Prose>
              <CodeBlock
                lang="bash"
                code={`# List up to 20 European flags
curl -H "X-API-Key: YOUR_KEY" \\
  "https://api.flagswing.com/v1/flags?region=europe&limit=20"`}
              />

              <SubHeading>GET /v1/flags/search?q=uzb</SubHeading>
              <Prose>
                <p>Full-text search over flag names and ISO codes.</p>
              </Prose>
              <CodeBlock
                lang="bash"
                code={`curl -H "X-API-Key: YOUR_KEY" \\
  "https://api.flagswing.com/v1/flags/search?q=uzb"`}
              />
            </section>

            <hr className="border-neutral-100" />

            {/* Rate Limits */}
            <section aria-labelledby="rate-limits">
              <SectionHeading id="rate-limits">Rate Limits</SectionHeading>
              <Prose>
                <p>
                  Rate limits are applied per API key. The CDN has no rate limit. Limits reset at midnight UTC
                  each day.
                </p>
              </Prose>
              <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden my-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-200">
                      <th className="text-left px-5 py-3 font-semibold text-neutral-600">Plan</th>
                      <th className="text-left px-5 py-3 font-semibold text-neutral-600">Requests / day</th>
                      <th className="text-left px-5 py-3 font-semibold text-neutral-600">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {[
                      { plan: 'Free', reqs: '100', price: '$0' },
                      { plan: 'Basic', reqs: '1,000', price: '$9/mo' },
                      { plan: 'Pro', reqs: '10,000', price: '$29/mo' },
                      { plan: 'Enterprise', reqs: 'Unlimited', price: 'Contact' },
                    ].map((r) => (
                      <tr key={r.plan} className="hover:bg-neutral-50">
                        <td className="px-5 py-3 font-semibold text-neutral-800">{r.plan}</td>
                        <td className="px-5 py-3 text-neutral-600">{r.reqs}</td>
                        <td className="px-5 py-3 text-neutral-600">{r.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-neutral-500">
                When you exceed the limit, the API returns <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs">429 Too Many Requests</code>.{' '}
                <Link href="/pricing" className="text-[var(--brand-blue)] font-semibold hover:underline">
                  Upgrade your plan
                </Link>{' '}
                for higher limits.
              </p>
            </section>

            <hr className="border-neutral-100" />

            {/* Examples */}
            <section aria-labelledby="examples">
              <SectionHeading id="examples">Examples</SectionHeading>

              <SubHeading>Fetch all flags and display a grid (React)</SubHeading>
              <CodeBlock
                lang="tsx"
                code={`const CDN = '${CDN_BASE}';

interface FlagItem {
  code: string;
  name: string;
}

async function fetchFlags(region: string): Promise<FlagItem[]> {
  const res = await fetch(
    \`https://api.flagswing.com/v1/flags?region=\${region}&limit=50\`,
    { headers: { 'X-API-Key': process.env.FLAGSWING_API_KEY ?? '' } }
  );
  if (!res.ok) throw new Error('Failed to fetch flags');
  const data = (await res.json()) as { flags: FlagItem[] };
  return data.flags;
}

export default async function FlagGrid() {
  const flags = await fetchFlags('europe');
  return (
    <ul className="grid grid-cols-8 gap-2">
      {flags.map((f) => (
        <li key={f.code} title={f.name}>
          <img
            src={\`\${CDN}/flags/svg/\${f.code}.svg\`}
            alt={\`\${f.name} flag\`}
            width={48}
            height={36}
            loading="lazy"
          />
        </li>
      ))}
    </ul>
  );
}`}
              />

              <SubHeading>Dynamic flag in Next.js App Router</SubHeading>
              <CodeBlock
                lang="tsx"
                code={`// app/country/[code]/page.tsx
const CDN = '${CDN_BASE}';

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function CountryPage({ params }: PageProps) {
  const { code } = await params;
  return (
    <main>
      <img
        src={\`\${CDN}/flags/svg/\${code}.svg\`}
        alt={\`\${code.toUpperCase()} flag\`}
        width={64}
        height={48}
      />
    </main>
  );
}`}
              />

              <SubHeading>Search flags with the API</SubHeading>
              <CodeBlock
                lang="ts"
                code={`async function searchFlags(q: string) {
  const res = await fetch(
    \`https://api.flagswing.com/v1/flags/search?q=\${encodeURIComponent(q)}\`,
    { headers: { 'X-API-Key': process.env.FLAGSWING_API_KEY ?? '' } }
  );
  if (!res.ok) throw new Error(\`Search failed: \${res.status}\`);
  return res.json() as Promise<{ flags: Array<{ code: string; name: string }> }>;
}

const results = await searchFlags('uzb');
console.log(results.flags); // [{ code: "uz", name: "Uzbekistan" }, ...]`}
              />
            </section>

            {/* Footer CTA */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-bold text-blue-800">Ready to build?</p>
                <p className="text-sm text-blue-600">Generate a free API key — takes 10 seconds.</p>
              </div>
              <Link
                href="/developers/api-keys"
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-blue)] px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[var(--brand-blue-hover)]"
              >
                Get API Key
                <ArrowRight size={14} aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
