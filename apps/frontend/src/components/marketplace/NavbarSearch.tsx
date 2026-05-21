'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Search } from 'lucide-react';

type NavbarSearchProps = {
  /** Smaller row on mobile secondary placement */
  compact?: boolean;
  className?: string;
};

export function NavbarSearch({ compact = false, className = '' }: NavbarSearchProps) {
  const router = useRouter();
  const [q, setQ] = useState('');

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    router.push(term ? `/browse?q=${encodeURIComponent(term)}` : '/browse');
  }

  const height = compact ? 'min-h-[44px]' : 'min-h-[52px] lg:min-h-[56px]';

  return (
    <form onSubmit={onSubmit} className={`w-full ${className}`.trim()} role="search" aria-label="Search catalog">
      <div
        className={`flex w-full items-center gap-3 rounded-2xl border border-white/14 bg-white/[0.07] px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md transition-colors focus-within:border-[#5ce1f7]/45 focus-within:bg-white/[0.11] ${height}`}
      >
        <Search className={`shrink-0 text-[#9cf3ff]/75 ${compact ? 'h-5 w-5' : 'h-6 w-6'}`} aria-hidden />
        <label htmlFor="navbar-market-search" className="sr-only">
          Search flags and vectors
        </label>
        <input
          id="navbar-market-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search flags, countries, vectors…"
          autoComplete="off"
          className="min-w-0 flex-1 border-0 bg-transparent text-base text-white placeholder:text-white/45 focus:outline-none focus:ring-0 lg:text-[1.0625rem]"
        />
        <button
          type="submit"
          className="hidden shrink-0 rounded-xl bg-[#009ab6] px-5 py-2 text-base font-semibold text-white shadow-lg shadow-black/20 transition hover:bg-[#00a8c5] sm:inline-flex sm:items-center sm:justify-center lg:px-6 lg:py-2.5"
        >
          Search
        </button>
      </div>
    </form>
  );
}
