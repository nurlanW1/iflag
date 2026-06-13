'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, CheckCircle, XCircle } from 'lucide-react';

const COUNTRIES = [
  { name: 'Afghanistan', code: 'af' },
  { name: 'Albania', code: 'al' },
  { name: 'Algeria', code: 'dz' },
  { name: 'Argentina', code: 'ar' },
  { name: 'Armenia', code: 'am' },
  { name: 'Australia', code: 'au' },
  { name: 'Austria', code: 'at' },
  { name: 'Azerbaijan', code: 'az' },
  { name: 'Bangladesh', code: 'bd' },
  { name: 'Belgium', code: 'be' },
  { name: 'Bolivia', code: 'bo' },
  { name: 'Brazil', code: 'br' },
  { name: 'Bulgaria', code: 'bg' },
  { name: 'Cambodia', code: 'kh' },
  { name: 'Canada', code: 'ca' },
  { name: 'Chile', code: 'cl' },
  { name: 'China', code: 'cn' },
  { name: 'Colombia', code: 'co' },
  { name: 'Croatia', code: 'hr' },
  { name: 'Cuba', code: 'cu' },
  { name: 'Czech Republic', code: 'cz' },
  { name: 'Denmark', code: 'dk' },
  { name: 'Ecuador', code: 'ec' },
  { name: 'Egypt', code: 'eg' },
  { name: 'Ethiopia', code: 'et' },
  { name: 'Finland', code: 'fi' },
  { name: 'France', code: 'fr' },
  { name: 'Georgia', code: 'ge' },
  { name: 'Germany', code: 'de' },
  { name: 'Ghana', code: 'gh' },
  { name: 'Greece', code: 'gr' },
  { name: 'Hungary', code: 'hu' },
  { name: 'India', code: 'in' },
  { name: 'Indonesia', code: 'id' },
  { name: 'Iran', code: 'ir' },
  { name: 'Iraq', code: 'iq' },
  { name: 'Ireland', code: 'ie' },
  { name: 'Israel', code: 'il' },
  { name: 'Italy', code: 'it' },
  { name: 'Jamaica', code: 'jm' },
  { name: 'Japan', code: 'jp' },
  { name: 'Jordan', code: 'jo' },
  { name: 'Kazakhstan', code: 'kz' },
  { name: 'Kenya', code: 'ke' },
  { name: 'South Korea', code: 'kr' },
  { name: 'Kuwait', code: 'kw' },
  { name: 'Kyrgyzstan', code: 'kg' },
  { name: 'Lebanon', code: 'lb' },
  { name: 'Libya', code: 'ly' },
  { name: 'Lithuania', code: 'lt' },
  { name: 'Malaysia', code: 'my' },
  { name: 'Mexico', code: 'mx' },
  { name: 'Mongolia', code: 'mn' },
  { name: 'Morocco', code: 'ma' },
  { name: 'Netherlands', code: 'nl' },
  { name: 'New Zealand', code: 'nz' },
  { name: 'Nigeria', code: 'ng' },
  { name: 'Norway', code: 'no' },
  { name: 'Pakistan', code: 'pk' },
  { name: 'Peru', code: 'pe' },
  { name: 'Philippines', code: 'ph' },
  { name: 'Poland', code: 'pl' },
  { name: 'Portugal', code: 'pt' },
  { name: 'Romania', code: 'ro' },
  { name: 'Russia', code: 'ru' },
  { name: 'Saudi Arabia', code: 'sa' },
  { name: 'Serbia', code: 'rs' },
  { name: 'Slovakia', code: 'sk' },
  { name: 'South Africa', code: 'za' },
  { name: 'Spain', code: 'es' },
  { name: 'Sweden', code: 'se' },
  { name: 'Switzerland', code: 'ch' },
  { name: 'Syria', code: 'sy' },
  { name: 'Tajikistan', code: 'tj' },
  { name: 'Thailand', code: 'th' },
  { name: 'Tunisia', code: 'tn' },
  { name: 'Turkey', code: 'tr' },
  { name: 'Turkmenistan', code: 'tm' },
  { name: 'Ukraine', code: 'ua' },
  { name: 'United Arab Emirates', code: 'ae' },
  { name: 'United Kingdom', code: 'gb' },
  { name: 'United States', code: 'us' },
  { name: 'Uzbekistan', code: 'uz' },
  { name: 'Venezuela', code: 've' },
  { name: 'Vietnam', code: 'vn' },
  { name: 'Yemen', code: 'ye' },
  { name: 'Zimbabwe', code: 'zw' },
] as const;

type Country = (typeof COUNTRIES)[number];

function fisherYatesShuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuestion(): { correct: Country; options: Country[] } {
  const shuffled = fisherYatesShuffle(COUNTRIES);
  const correct = shuffled[0];
  const options = fisherYatesShuffle([correct, ...shuffled.slice(1, 4)]);
  return { correct, options };
}

export function FlagGame({ onClose }: { onClose: () => void }) {
  const [{ correct, options }, setQuestion] = useState(buildQuestion);
  const [selected, setSelected] = useState<Country | null>(null);

  const next = useCallback(() => {
    setQuestion(buildQuestion());
    setSelected(null);
  }, []);

  const handleSelect = (option: Country) => {
    if (selected) return;
    setSelected(option);
    if (option.code === correct.code) {
      setTimeout(next, 1100);
    }
  };

  const answered = selected !== null;
  const isCorrectAnswer = selected?.code === correct.code;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 300 }}
        className="relative w-full max-w-[22rem] rounded-2xl bg-white p-6 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.35)]"
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
          aria-label="Close game"
        >
          <X size={18} />
        </button>

        <p className="mb-1 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
          Flag Quiz
        </p>
        <p className="mb-4 text-center text-sm font-semibold text-neutral-700">
          Which country does this flag belong to?
        </p>

        {/* Flag image */}
        <div className="mx-auto mb-4 flex h-[7.5rem] w-[13rem] items-center justify-center overflow-hidden rounded-xl shadow-[0_4px_16px_-4px_rgba(0,0,0,0.18)]">
          <img
            key={correct.code}
            src={`https://flagcdn.com/w320/${correct.code}.webp`}
            alt="Country flag"
            className="h-full w-full object-cover"
            loading="eager"
            draggable={false}
          />
        </div>

        {/* Result banner */}
        <AnimatePresence>
          {answered && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="overflow-hidden"
            >
              <div
                className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${
                  isCorrectAnswer
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-red-50 text-red-600'
                }`}
              >
                {isCorrectAnswer ? (
                  <>
                    <CheckCircle size={15} className="shrink-0 text-emerald-500" />
                    Correct!
                  </>
                ) : (
                  <>
                    <XCircle size={15} className="shrink-0 text-red-400" />
                    The answer is <strong>{correct.name}</strong>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Options 2×2 */}
        <div className="grid grid-cols-2 gap-2">
          {options.map((option) => {
            const isSelected = selected?.code === option.code;
            const isCorrectOpt = option.code === correct.code;

            let cls =
              'relative flex min-h-[3rem] items-center justify-center gap-1.5 rounded-xl border-2 px-2 py-2.5 text-xs font-semibold transition-all duration-150 text-center leading-tight ';

            if (!answered) {
              cls +=
                'border-neutral-200 bg-white text-neutral-700 hover:border-[var(--brand-blue)] hover:bg-blue-50 cursor-pointer';
            } else if (isCorrectOpt) {
              cls += 'border-emerald-400 bg-emerald-50 text-emerald-700';
            } else if (isSelected) {
              cls += 'border-red-300 bg-red-50 text-red-500';
            } else {
              cls += 'border-neutral-100 bg-neutral-50 text-neutral-400 cursor-default';
            }

            return (
              <button
                key={option.code}
                onClick={() => handleSelect(option)}
                disabled={answered}
                className={cls}
              >
                {answered && isCorrectOpt && (
                  <CheckCircle size={13} className="shrink-0 text-emerald-500" />
                )}
                {answered && isSelected && !isCorrectOpt && (
                  <XCircle size={13} className="shrink-0 text-red-400" />
                )}
                <span>{option.name}</span>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-[10px] font-medium text-neutral-400">
            {COUNTRIES.length} countries
          </span>
          <button
            onClick={next}
            className="flex items-center gap-1.5 rounded-xl bg-[var(--brand-blue)] px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
          >
            Next flag <ChevronRight size={14} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
