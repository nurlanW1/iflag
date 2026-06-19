'use client';

import { useEffect } from 'react';
import Script from 'next/script';
import { useSearchParams } from 'next/navigation';

declare global {
  interface Window {
    Paddle?: {
      Initialize: (opts: {
        token: string;
        pwCustomer?: { email?: string };
        eventCallback?: (data: { name: string; data?: unknown }) => void;
        checkout?: { settings?: Record<string, unknown> };
      }) => void;
      Checkout?: {
        open: (opts: {
          transactionId?: string;
          settings?: {
            successUrl?: string;
            displayMode?: 'overlay' | 'inline';
            frameTarget?: string;
          };
        }) => void;
      };
    };
  }
}

const CLIENT_TOKEN = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ?? '';

function PaddleAutoOpen() {
  const sp = useSearchParams();

  useEffect(() => {
    const ptxn = sp.get('_ptxn')?.trim();
    if (!ptxn || !CLIENT_TOKEN) return;

    const tryOpen = () => {
      if (window.Paddle?.Checkout) {
        window.Paddle.Checkout.open({
          transactionId: ptxn,
          settings: {
            displayMode: 'overlay',
            successUrl: `${window.location.origin}/thank-you`,
          },
        });
      }
    };

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
            window.Paddle.Initialize({
              token: CLIENT_TOKEN,
            });
          }
        }}
      />
      <PaddleAutoOpen />
    </>
  );
}
