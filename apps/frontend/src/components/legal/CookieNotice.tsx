'use client';

import { useEffect, useRef, useState } from 'react';
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
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const dismissed = window.localStorage.getItem(STORAGE_KEY);
      if (!dismissed) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const reset = () => root.style.setProperty('--cookie-banner-h', '0px');

    if (!visible) {
      reset();
      return;
    }

    const el = bannerRef.current;
    if (!el) {
      reset();
      return;
    }

    const sync = () => {
      root.style.setProperty('--cookie-banner-h', `${Math.ceil(el.getBoundingClientRect().height)}px`);
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    window.addEventListener('resize', sync);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', sync);
      reset();
    };
  }, [visible]);

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
      ref={bannerRef}
      id="site-cookie-banner"
      role="dialog"
      aria-labelledby="cookie-notice-title"
      aria-describedby="cookie-notice-desc"
      className="fixed bottom-0 left-0 right-0 z-[100] border-t border-gray-200 bg-white/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur-md sm:pb-5 md:px-6 md:pb-6"
    >
      <PageShell className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 flex-1 pr-8 md:pr-4">
          <p id="cookie-notice-title" className="font-semibold text-[#2a2a2a]">
            Cookies &amp; privacy
          </p>
          <p id="cookie-notice-desc" className="mt-1 text-sm text-neutral-500">
            We use essential cookies for sign-in, account security, and <strong>Paddle checkout</strong> (they
            keep your billing session tied to your login). If you add analytics or ads, document them in our{' '}
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
            className="min-h-11 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold leading-snug text-neutral-800 shadow-sm hover:bg-neutral-50"
          >
            Essential only
          </button>
          <button
            type="button"
            onClick={() => dismiss('acknowledged')}
            className="min-h-11 rounded-xl bg-[var(--brand-blue)] px-5 py-3 text-sm font-semibold leading-snug text-white shadow-sm hover:bg-[var(--brand-blue-hover)]"
          >
            OK
          </button>
          <button
            type="button"
            onClick={() => dismiss('acknowledged')}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </PageShell>
    </div>
  );
}
