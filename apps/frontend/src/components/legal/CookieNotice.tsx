'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageShell } from '@/components/layout';
import { X } from 'lucide-react';

const STORAGE_KEY = 'flagswing_cookie_notice_v1';

/**
 * Basic cookie / privacy banner for trust and ad-platform readiness.
 * Stores consent choice in localStorage; extend to server-side preferences if you add analytics.
 */
export function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const dismissed = window.localStorage.getItem(STORAGE_KEY);
      if (!dismissed) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const dismiss = (value: 'essential' | 'acknowledged') => {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-notice-title"
      aria-describedby="cookie-notice-desc"
      className="fixed bottom-0 left-0 right-0 z-[100] border-t border-gray-200 bg-white/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur-md sm:pb-5 md:px-6 md:pb-6"
    >
      <PageShell className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 flex-1 pr-8 md:pr-4">
          <p id="cookie-notice-title" className="font-semibold text-gray-900">
            Cookies &amp; privacy
          </p>
          <p id="cookie-notice-desc" className="mt-1 text-sm text-gray-600">
            We use essential cookies to run the site (e.g. session / security). If you add analytics or
            ads, document them in our{' '}
            <Link href="/cookies" className="font-medium text-[#2563eb] hover:underline">
              Cookie Policy
            </Link>{' '}
            and{' '}
            <Link href="/privacy-policy" className="font-medium text-[#2563eb] hover:underline">
              Privacy Policy
            </Link>
            , and update this banner accordingly.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => dismiss('essential')}
            className="min-h-11 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold leading-snug text-gray-800 hover:bg-gray-50"
          >
            Essential only
          </button>
          <button
            type="button"
            onClick={() => dismiss('acknowledged')}
            className="min-h-11 rounded-xl bg-[#2563eb] px-5 py-3 text-sm font-semibold leading-snug text-white hover:bg-[#1d4ed8]"
          >
            OK
          </button>
          <button
            type="button"
            onClick={() => dismiss('acknowledged')}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </PageShell>
    </div>
  );
}
