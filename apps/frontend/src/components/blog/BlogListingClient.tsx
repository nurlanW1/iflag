'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Calendar } from 'lucide-react';
import { ALL_POSTS, CATEGORIES, type Category, formatDate } from '@/lib/blog/posts';

const CATEGORY_COLORS: Record<string, string> = {
  History:      'bg-red-100 text-red-700',
  Design:       'bg-blue-100 text-blue-700',
  Tutorials:    'bg-slate-100 text-slate-700',
  Geopolitics:  'bg-emerald-100 text-emerald-700',
};

export default function BlogListingClient() {
  const [active, setActive] = useState<Category>('All');

  const posts =
    active === 'All' ? ALL_POSTS : ALL_POSTS.filter((p) => p.category === active);

  return (
    <main className="marketplace-shell min-h-screen bg-[#fafaf9] pb-20 pt-10 sm:pb-24 sm:pt-12">
      {/* Hero */}
      <div className="mx-auto mb-10 max-w-3xl sm:mb-12">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
          Flagswing Blog
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
          Flag Stories &amp; Design Resources
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-500 sm:text-base">
          Insights on flags, history, design, and visual storytelling.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="mb-8 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActive(cat)}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              active === cat
                ? 'bg-[#2563eb] text-white shadow-sm shadow-[#2563eb]/30'
                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat}
            {cat !== 'All' && (
              <span className="ml-1.5 opacity-60">
                {ALL_POSTS.filter((p) => p.category === cat).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Grid */}
      {posts.length === 0 ? (
        <p className="py-16 text-center text-sm text-slate-400">No posts in this category yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              {/* Cover */}
              <div
                className={`h-44 w-full bg-gradient-to-br ${post.coverGradient} sm:h-48`}
                aria-hidden
              />
              {/* Body */}
              <div className="flex flex-1 flex-col gap-3 p-5">
                <span
                  className={`inline-self-start w-fit rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    CATEGORY_COLORS[post.category] ?? 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {post.category}
                </span>
                <h2 className="line-clamp-2 text-[1rem] font-bold leading-snug text-slate-900 group-hover:text-[#2563eb]">
                  {post.title}
                </h2>
                <p className="line-clamp-2 text-sm leading-relaxed text-slate-500">
                  {post.excerpt}
                </p>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                    <Calendar size={12} aria-hidden />
                    {formatDate(post.date)}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563eb] opacity-0 transition-opacity group-hover:opacity-100">
                    Read more <ArrowRight size={13} aria-hidden />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
