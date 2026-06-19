'use client';

import { useState, useEffect } from 'react';
import { FreeStockCard } from '@/components/flags/FreeStockCard';

interface FreeStockImage {
  id: string;
  thumbUrl: string;
  description: string;
  photographer: string;
  sourceUrl: string;
  source: 'pexels' | 'pixabay';
}

interface Props {
  countryName: string;
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/+$/, '');

async function fetchPexels(countryName: string): Promise<FreeStockImage[]> {
  try {
    const res = await fetch(
      `${API_BASE}/pexels/search?q=${encodeURIComponent(countryName + ' flag')}&per_page=6`,
    );
    const data = res.ok ? await res.json() : {};
    return (data.results ?? []) as FreeStockImage[];
  } catch {
    return [];
  }
}

async function fetchPixabay(countryName: string): Promise<FreeStockImage[]> {
  try {
    const res = await fetch(
      `${API_BASE}/pixabay/search?q=${encodeURIComponent(countryName + ' flag')}&per_page=6`,
    );
    const data = res.ok ? await res.json() : {};
    return (data.results ?? []) as FreeStockImage[];
  } catch {
    return [];
  }
}

export function FreeStockSection({ countryName }: Props) {
  const [images, setImages] = useState<FreeStockImage[]>([]);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (!countryName) return;
    setImages([]);
    setFetched(false);

    void Promise.all([fetchPexels(countryName), fetchPixabay(countryName)]).then(
      ([pexels, pixabay]) => {
        const combined = [...pexels, ...pixabay]
          .sort(() => Math.random() - 0.5)
          .slice(0, 12);
        setImages(combined);
        setFetched(true);
      },
    );
  }, [countryName]);

  if (!fetched || images.length === 0) return null;

  return (
    <div className="mt-10 border-t border-neutral-200/60 pt-8">
      <div className="mb-5 flex items-center gap-2.5">
        <h3 className="text-base font-semibold text-[#2a2a2a]">
          Free {countryName} flag photos
        </h3>
        <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700 ring-1 ring-green-200">
          Free to use
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
        {images.map((item) => (
          <FreeStockCard key={item.id} {...item} />
        ))}
      </div>

      <p className="mt-4 text-[11px] text-neutral-400">
        * Free stock photos from Pexels and Pixabay. Click to view source and download.
      </p>
    </div>
  );
}
