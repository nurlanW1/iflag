'use client';

import { useEffect } from 'react';
import Script from 'next/script';
import { useSearchParams } from 'next/navigation';

declare global {
  interface Window {
    Paddle?: {
      Initialize: (opts: { token: string; pwCustomer?: { email?: string } }) => void;
      Checkout?: {
        open: (opts: { transactionId?: string; items?: unknown[] }) => void;
      };
    };
  }
}

const CLIENT_TOKEN = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ?? '';

/**
 * Loads Paddle.js v2 and initializes it.
 * When the page URL contains `?_ptxn=txn_...` (from Paddle checkout redirect),
 * Paddle.js automatically intercepts and opens the checkout overlay.
 */
function PaddleAutoOpen() {
  const sp = useSearchParams();

  useEffect(() => {
    const ptxn = sp.get('_ptxn')?.trim();
    if (!ptxn || !CLIENT_TOKEN) return;

    // Wait for Paddle.js to be ready then open checkout
    const tryOpen = () => {
      if (window.Paddle?.Checkout) {
        window.Paddle.Checkout.open({ transactionId: ptxn });
      }
    };

    // Give Paddle.js time to initialize
    const t = setTimeout(tryOpen, 800);
    return () => clearTimeout(t);
  }, [sp]);

  return null;
}

export function PaddleInitializer() {
  if (!CLIENT_TOKEN) return null;

  return (
    <>
      <Script
        src="https://cdn.paddle.com/paddle/v2/paddle.js"
        strategy="afterInteractive"
        onLoad={() => {
          if (window.Paddle && CLIENT_TOKEN) {
            window.Paddle.Initialize({ token: CLIENT_TOKEN });
          }
        }}
      />
      <PaddleAutoOpen />
    </>
  );
}
