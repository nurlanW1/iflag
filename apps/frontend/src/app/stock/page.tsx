'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, X, ExternalLink, Loader2, ImageOff } from 'lucide-react';
import { env } from '@/lib/env';

interface StockImage {
  id: string;
  description: string;
  contributor: string;
  previewUrl: string;
  largeThumbUrl: string;
  affiliateUrl: string;
}

interface SearchResult {
  images: StockImage[];
  total: number;
  page: number;
  per_page: number;
}

const PER_PAGE = 24;

function ImageCard({ img }: { img: StockImage }) {
  const [imgError, setImgError] = useState(false);

  return (
    <a
      href={img.affiliateUrl}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="group relative overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md"
    >
      <div className="aspect-[4/3] overflow-hidden bg-neutral-100">
        {imgError ? (
          <div className="flex h-full items-center justify-center text-neutral-400">
            <ImageOff size={28} />
          </div>
        ) : (
          <img
            src={img.largeThumbUrl || img.previewUrl}
            alt={img.description || 'Stock image'}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        )}
      </div>
      <div className="p-3">
        <p className="line-clamp-2 text-xs text-neutral-600">
          {img.description || 'Flag stock image'}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[10px] text-neutral-400">Shutterstock</span>
          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[var(--brand-blue)]">
            View <ExternalLink size={10} />
          </span>
        </div>
      </div>
    </a>
  );
}

export default function StockPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialQ = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(initialQ);
  const [inputVal, setInputVal] = useState(initialQ);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchImages = useCallback(async (q: string, p: number) => {
    if (!q.trim()) {
      setResult(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const apiBase = env.apiUrl;
      const url = `${apiBase}/shutterstock/search?q=${encodeURIComponent(q)}&page=${p}&per_page=${PER_PAGE}`;
      const res = await fetch(url);
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json() as SearchResult;
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load images');
    } finally {
      setLoading(false);
    }
  }, []);

  // On query/page change fetch
  useEffect(() => {
    fetchImages(query, page);
  }, [query, page, fetchImages]);

  // Debounce input → query
  const handleInput = (val: string) => {
    setInputVal(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      setQuery(val);
      // Sync URL
      const params = new URLSearchParams();
      if (val.trim()) params.set('q', val.trim());
      router.replace(`/stock${params.size > 0 ? `?${params.toString()}` : ''}`, { scroll: false });
    }, 400);
  };

  const clearSearch = () => {
    setInputVal('');
    setQuery('');
    setPage(1);
    setResult(null);
    router.replace('/stock', { scroll: false });
  };

  const totalPages = result ? Math.ceil(result.total / PER_PAGE) : 0;

  return (
    <main className="min-h-screen bg-[#fafaf9]">
      {/* Header */}
      <div className="border-b border-neutral-200/80 bg-white">
        <div className="marketplace-shell py-8 sm:py-10">
          <h1 className="text-2xl font-bold tracking-tight text-[#2a2a2a] sm:text-3xl">
            Stock Flag Images
          </h1>
          <p className="mt-1.5 text-sm text-neutral-500">
            Powered by Shutterstock · High-quality flag photography for every project
          </p>

          {/* Search bar */}
          <div className="mt-5 flex max-w-2xl overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm ring-1 ring-neutral-200/60">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
                size={17}
                aria-hidden
              />
              <input
                type="text"
                value={inputVal}
                onChange={(e) => handleInput(e.target.value)}
                placeholder='Search flag images… e.g. "France flag"'
                aria-label="Search stock images"
                className="w-full border-0 bg-transparent py-3.5 pl-10 pr-10 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none"
              />
              {inputVal && (
                <button
                  type="button"
                  onClick={clearSearch}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="marketplace-shell py-8">
        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-neutral-400" />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center">
            <p className="text-sm font-semibold text-red-700">{error}</p>
            <button
              onClick={() => fetchImages(query, page)}
              className="mt-3 text-sm font-medium text-red-600 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && !result && (
          <div className="py-20 text-center">
            <p className="text-neutral-500">Search for flag images above to get started.</p>
          </div>
        )}

        {/* Results */}
        {!loading && result && result.images.length === 0 && (
          <div className="py-20 text-center">
            <p className="font-semibold text-neutral-700">No images found for "{query}"</p>
            <p className="mt-1 text-sm text-neutral-400">Try a different search term.</p>
          </div>
        )}

        {!loading && result && result.images.length > 0 && (
          <>
            <p className="mb-4 text-sm text-neutral-500">
              Showing {result.images.length} of {result.total.toLocaleString()} results for{' '}
              <span className="font-semibold text-neutral-800">"{query}"</span>
            </p>

            {/* Grid — 2 cols on mobile, 3 on md, 4 on lg */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
              {result.images.map((img) => (
                <ImageCard key={img.id} img={img} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <button
                  onClick={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  disabled={page <= 1}
                  className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm transition hover:bg-neutral-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-sm text-neutral-500">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  disabled={page >= totalPages}
                  className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm transition hover:bg-neutral-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}

            {/* Attribution */}
            <p className="mt-8 text-center text-xs text-neutral-400">
              Images provided by{' '}
              <a
                href="https://www.shutterstock.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-neutral-600"
              >
                Shutterstock
              </a>
              . Clicking an image takes you to Shutterstock to license it.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
