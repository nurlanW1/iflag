'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';

const CDN_BASE = 'https://pub-d7a1861fd19b400ab91b028d5ffa0d27.r2.dev';

type Tab = 'HTML' | 'CSS' | 'React' | 'Markdown';

export function EmbedCode({ slug, countryName }: { slug: string; countryName: string }) {
  const [activeTab, setActiveTab] = useState<Tab>('HTML');
  const [copied, setCopied] = useState(false);

  const svgUrl = `${CDN_BASE}/${encodeURIComponent(countryName)}/${encodeURIComponent(countryName)}.svg`;

  const snippets: Record<Tab, string> = {
    HTML: `<img src="${svgUrl}" alt="${countryName} flag" width="60" height="40" loading="lazy">`,
    CSS: `.flag-${slug} {\n  background-image: url('${svgUrl}');\n  width: 60px;\n  height: 40px;\n  background-size: contain;\n  background-repeat: no-repeat;\n}`,
    React: `<img\n  src="${svgUrl}"\n  alt="${countryName} flag"\n  width={60}\n  height={40}\n  loading="lazy"\n/>`,
    Markdown: `![${countryName} flag](${svgUrl})`,
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippets[activeTab]);
      setCopied(true);
      toast.success('Code copied!');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const tabs: Tab[] = ['HTML', 'CSS', 'React', 'Markdown'];

  return (
    <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between border-b border-stone-100 px-4 py-2">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                activeTab === tab
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-500 hover:bg-stone-100 hover:text-stone-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 transition hover:bg-stone-50"
        >
          {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
          Copy Code
        </button>
      </div>
      <pre className="overflow-x-auto bg-stone-950 p-4 text-xs leading-relaxed text-emerald-400">
        <code>{snippets[activeTab]}</code>
      </pre>
    </div>
  );
}
