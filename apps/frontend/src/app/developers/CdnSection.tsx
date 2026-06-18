'use client';

import { useState } from 'react';
import { Copy, Check, Eye } from 'lucide-react';

const CDN_BASE =
  process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL || 'https://cdn.flagswing.com';

type Tab = 'html' | 'css' | 'react' | 'vue';

function getCodeForTab(tab: Tab, code: string): string {
  const url = `${CDN_BASE}/flags/svg/${code}.svg`;
  switch (tab) {
    case 'html':
      return `<!-- Flagswing CDN — no signup required -->
<img
  src="${url}"
  alt="${code.toUpperCase()} flag"
  width="32"
  height="24"
  loading="lazy"
/>`;
    case 'css':
      return `.flag-${code} {
  background-image: url('${url}');
  background-size: cover;
  background-repeat: no-repeat;
  width: 32px;
  height: 24px;
  display: inline-block;
}`;
    case 'react':
      return `// React — via <img> tag (no package needed)
export function FlagImage({ code = '${code}' }: { code: string }) {
  return (
    <img
      src={\`${CDN_BASE}/flags/svg/\${code}.svg\`}
      alt={\`\${code.toUpperCase()} flag\`}
      width={32}
      height={24}
      loading="lazy"
    />
  );
}

// Usage
<FlagImage code="${code}" />`;
    case 'vue':
      return `<!-- Vue 3 -->
<template>
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
</script>`;
  }
}

const TAB_LABELS: { key: Tab; label: string }[] = [
  { key: 'html', label: 'HTML' },
  { key: 'css', label: 'CSS' },
  { key: 'react', label: 'React' },
  { key: 'vue', label: 'Vue' },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-1.5 rounded-lg border border-neutral-600 bg-neutral-700 px-3 py-1.5 text-xs font-semibold text-neutral-200 transition hover:bg-neutral-600"
      aria-label="Copy code"
    >
      {copied ? <Check size={13} aria-hidden /> : <Copy size={13} aria-hidden />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

export default function CdnSection() {
  const [activeTab, setActiveTab] = useState<Tab>('html');
  const [countryCode, setCountryCode] = useState('uz');
  const [previewCode, setPreviewCode] = useState('uz');
  const [showPreview, setShowPreview] = useState(false);

  const code = getCodeForTab(activeTab, previewCode);
  const flagUrl = `${CDN_BASE}/flags/svg/${previewCode}.svg`;

  return (
    <section className="py-16">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-[#2a2a2a] mb-2">CDN — Zero Config</h2>
        <p className="text-neutral-500 mb-8 text-lg">
          Drop any flag into your HTML with a single <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-sm font-mono text-[#2563eb]">&lt;img&gt;</code> tag.
          No API key required.
        </p>

        {/* Tabs */}
        <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
          <div className="flex border-b border-neutral-200 bg-neutral-50">
            {TAB_LABELS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`px-5 py-3 text-sm font-semibold transition-colors ${
                  activeTab === key
                    ? 'border-b-2 border-[var(--brand-blue)] text-[var(--brand-blue)] bg-white'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="bg-[#0f172a] rounded-b-2xl relative">
            <div className="flex items-center justify-between px-4 pt-3 pb-1">
              <span className="text-xs font-mono text-neutral-400 uppercase tracking-wide">{activeTab}</span>
              <CopyButton text={code} />
            </div>
            <pre className="overflow-x-auto p-4 pt-2 text-[#e2e8f0] font-mono text-sm leading-relaxed">
              <code>{code}</code>
            </pre>
          </div>
        </div>

        {/* Live preview */}
        <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-[#2a2a2a] mb-4">Live Preview</h3>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[160px]">
              <label htmlFor="cdn-country-input" className="block text-sm font-semibold text-neutral-600 mb-1.5">
                Country code (ISO 3166-1 alpha-2)
              </label>
              <input
                id="cdn-country-input"
                type="text"
                value={countryCode}
                maxLength={3}
                onChange={(e) => setCountryCode(e.target.value.toLowerCase().trim())}
                placeholder="e.g. uz, us, de"
                className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-mono focus:border-[var(--brand-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]/20"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setPreviewCode(countryCode || 'uz');
                setShowPreview(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-[var(--brand-blue)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--brand-blue-hover)]"
            >
              <Eye size={15} aria-hidden />
              Try it live
            </button>
          </div>

          {showPreview && (
            <div className="mt-5 flex items-center gap-5 rounded-xl border border-neutral-100 bg-neutral-50 p-4">
              <img
                src={flagUrl}
                alt={`${previewCode.toUpperCase()} flag`}
                width={64}
                height={48}
                className="rounded shadow"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.opacity = '0.3';
                }}
              />
              <div>
                <div className="text-xs text-neutral-400 font-mono mb-1">URL</div>
                <code className="text-xs text-neutral-700 break-all">{flagUrl}</code>
              </div>
            </div>
          )}
        </div>

        {/* URL format info */}
        <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <p className="text-sm font-semibold text-blue-800 mb-2">CDN URL format</p>
          <code className="text-sm text-blue-700 font-mono">
            {CDN_BASE}/flags/<span className="text-blue-500">svg</span>/<span className="text-blue-500">{'{code}'}</span>.svg
          </code>
          <p className="text-xs text-blue-600 mt-2">
            Replace <code className="bg-blue-100 px-1 rounded">svg</code> with <code className="bg-blue-100 px-1 rounded">png</code> or{' '}
            <code className="bg-blue-100 px-1 rounded">eps</code> for other formats.
          </p>
        </div>
      </div>
    </section>
  );
}
