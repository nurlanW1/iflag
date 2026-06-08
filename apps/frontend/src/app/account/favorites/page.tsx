'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/favorites')
      .then((r) => r.json())
      .then((d) => setFavorites(d.favorites ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const remove = async (id: string) => {
    await fetch('/api/favorites', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flagId: id }),
    });
    setFavorites((f) => f.filter((x) => x !== id));
  };

  if (loading) return <div className="h-40 animate-pulse rounded-xl bg-stone-200" />;

  if (favorites.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
        <Heart className="mx-auto h-10 w-10 text-stone-300" />
        <p className="mt-4 font-semibold text-stone-600">No saved flags yet</p>
        <Link
          href="/gallery"
          className="mt-4 inline-flex items-center rounded-xl bg-[var(--brand-blue)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-blue-hover)]"
        >
          Browse flags →
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {favorites.map((id) => (
        <div key={id} className="relative rounded-xl border border-stone-200 bg-white p-3">
          <p className="truncate text-xs font-medium text-stone-700">{id}</p>
          <button
            type="button"
            onClick={() => remove(id)}
            className="mt-2 w-full rounded-lg border border-red-200 px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50"
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}
