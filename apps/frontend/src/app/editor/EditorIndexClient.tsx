'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, PenTool, ArrowRight } from 'lucide-react';
import { countryCodeToName } from '@/lib/country-code-to-name';

// country-flag-icons/3x2 uses UPPERCASE codes (US.svg, UZ.svg)
// editor slug uses lowercase
const COUNTRIES = Object.entries(countryCodeToName)
  .map(([code, name]) => ({ code: code.toLowerCase(), upperCode: code, name }))
  .sort((a, b) => a.name.localeCompare(b.name));

function FlagCard({ code, upperCode, name }: { code: string; upperCode: string; name: string }) {
  // Official rectangular 3:2 SVG from country-flag-icons
  const flagSrc = `/flags/${upperCode}.svg`;

  return (
    <Link
      href={`/editor/${code}`}
      className="group relative flex flex-col items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:border-purple-300 hover:shadow-md"
    >
      {/* Official rectangular flag */}
      <div className="relative w-full overflow-hidden rounded-lg shadow-sm ring-1 ring-neutral-100 group-hover:ring-purple-200 transition" style={{ aspectRatio: '3/2' }}>
        <img
          src={flagSrc}
          alt={`${name} flag`}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://flagcdn.com/w160/${code}.png`;
          }}
        />
      </div>

      <span className="text-center text-sm font-semibold text-neutral-700 leading-tight">{name}</span>

      <span className="flex items-center gap-1 text-xs font-medium text-purple-600 opacity-0 transition group-hover:opacity-100">
        Customize <ArrowRight size={12} />
      </span>
    </Link>
  );
}

export default function EditorIndexClient() {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.includes(q),
    );
  }, [query]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-700">
          <PenTool size={16} aria-hidden />
          Flag Editor
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl lg:text-5xl">
          Customize Any Flag
        </h1>
        <p className="mt-3 text-base text-neutral-500 sm:text-lg">
          Add text, shapes, and effects to any flag.{' '}
          <span className="font-medium text-neutral-700">Free preview</span>, HD download for $5.
        </p>
      </div>

      {/* Search */}
      <div className="mx-auto mb-8 max-w-md">
        <div className="relative">
          <Search
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search countries…"
            className="h-11 w-full rounded-xl border border-neutral-200 bg-white pl-10 pr-4 text-sm shadow-sm outline-none ring-0 transition placeholder:text-neutral-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
          />
        </div>
        {query && (
          <p className="mt-2 text-center text-xs text-neutral-400">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center text-neutral-400">No countries found for "{query}"</div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-6 lg:gap-5">
          {filtered.map((c) => (
            <li key={c.code} className="list-none">
              <FlagCard code={c.code} upperCode={c.upperCode} name={c.name} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
