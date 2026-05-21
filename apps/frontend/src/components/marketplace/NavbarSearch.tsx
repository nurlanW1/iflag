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
        className={`flex w-full items-center gap-3 rounded-xl border border-neutral-200/95 bg-white px-4 shadow-[0_10px_36px_-28px_rgba(42,52,65,0.35)] transition-[border-color,box-shadow] duration-200 focus-within:border-neutral-400 focus-within:shadow-[0_14px_42px_-26px_rgba(42,52,65,0.28)] ${height}`}
      >
        <Search className={`shrink-0 text-neutral-400 ${compact ? 'h-5 w-5' : 'h-6 w-6'}`} aria-hidden />
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
          className="min-w-0 flex-1 border-0 bg-transparent text-base text-[#2a2a2a] placeholder:text-neutral-400 focus:outline-none focus:ring-0 lg:text-[1.0625rem]"
        />
        <button
          type="submit"
          className="hidden shrink-0 rounded-lg bg-[#3d4f61] px-5 py-2 text-base font-semibold text-[#fafaf9] shadow-sm transition-colors duration-200 hover:bg-[#354558] sm:inline-flex sm:items-center sm:justify-center lg:px-6 lg:py-2.5"
        >
          Search
        </button>
      </div>
    </form>
  );
}
