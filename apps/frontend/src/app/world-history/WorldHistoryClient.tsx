'use client';

import { useState } from 'react';
import Link from 'next/link';
import worldData from '../../../content/world-history.json';

type YearKey = '1900' | '1920' | '1945' | '1991' | '2024';

export function WorldHistoryClient() {
  const [selectedYear, setSelectedYear] = useState<YearKey>('2024');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  const years = worldData.years as number[];
  const countries = worldData.countries;

  const selected = selectedCountry
    ? countries.find((c) => c.id === selectedCountry)
    : null;

  const selectedYearData = selected?.years[selectedYear];

  return (
    <main className="min-h-screen bg-stone-950 text-white">
      {/* Header */}
      <div className="border-b border-stone-800 px-4 py-8 text-center">
        <h1 className="text-3xl font-bold sm:text-4xl">World Flag History</h1>
        <p className="mt-2 text-stone-400">
          See how flags changed across history — from empires to modern nations
        </p>
      </div>

      {/* Year Slider */}
      <div className="sticky top-0 z-10 border-b border-stone-800 bg-stone-950/95 px-4 py-4 backdrop-blur">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-between gap-4">
            <span className="text-2xl font-bold text-[#2563eb]">{selectedYear}</span>
            <input
              type="range"
              min={0}
              max={years.length - 1}
              value={years.indexOf(Number(selectedYear))}
              onChange={(e) => setSelectedYear(String(years[Number(e.target.value)]) as YearKey)}
              className="flex-1 accent-[#2563eb]"
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-stone-500">
            {years.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => setSelectedYear(String(y) as YearKey)}
                className={`rounded px-2 py-0.5 transition ${
                  String(y) === selectedYear
                    ? 'bg-[#2563eb] text-white'
                    : 'hover:text-stone-300'
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Country Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {countries.map((country) => {
            const yearData = country.years[selectedYear];
            return (
              <button
                key={country.id}
                type="button"
                onClick={() => setSelectedCountry(
                  selectedCountry === country.id ? null : country.id
                )}
                className={`rounded-xl border p-3 text-left transition ${
                  selectedCountry === country.id
                    ? 'border-[#2563eb] bg-[#2563eb]/10'
                    : 'border-stone-700 bg-stone-900 hover:border-stone-500'
                }`}
              >
                {/* Color indicator */}
                <div
                  className="mb-2 h-10 w-full rounded-lg opacity-80"
                  style={{ backgroundColor: yearData.color }}
                />
                <p className="text-xs font-semibold text-stone-200 line-clamp-1">{country.name}</p>
                <p className="mt-0.5 text-[10px] text-stone-500 line-clamp-1">{yearData.name}</p>
              </button>
            );
          })}
        </div>

        {/* Detail panel */}
        {selected && selectedYearData && (
          <div className="mt-8 rounded-2xl border border-stone-700 bg-stone-900 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#2563eb]">
                  {selectedYear}
                </p>
                <h2 className="mt-1 text-2xl font-bold">{selectedYearData.name}</h2>
                <p className="mt-1 text-stone-400">{selected.name}</p>
              </div>
              <div
                className="h-16 w-24 shrink-0 rounded-lg"
                style={{ backgroundColor: selectedYearData.color }}
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {worldData.years.map((y) => {
                const yd = selected.years[String(y) as YearKey];
                return (
                  <button
                    key={y}
                    type="button"
                    onClick={() => setSelectedYear(String(y) as YearKey)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                      String(y) === selectedYear
                        ? 'border-[#2563eb] bg-[#2563eb] text-white'
                        : 'border-stone-600 text-stone-400 hover:border-stone-400'
                    }`}
                  >
                    {y}: {yd.name}
                  </button>
                );
              })}
            </div>

            <Link
              href={`/gallery/${selectedYearData.flag}`}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d4ed8]"
            >
              View &amp; Download Flag →
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
