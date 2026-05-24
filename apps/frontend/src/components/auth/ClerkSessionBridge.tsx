'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useRef } from 'react';

/**
 * After Clerk sign-in, link the account to backend JWT cookies when bridge env is configured.
 * Checkout uses Clerk session tokens directly — this is best-effort for dashboard/purchases APIs.
 */
export function ClerkSessionBridge() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const lastUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId) {
      lastUserId.current = null;
      return;
    }
    if (lastUserId.current === userId) return;
    lastUserId.current = userId;

    void (async () => {
      try {
        const linkRes = await fetch('/api/auth/session-linked', {
          cache: 'no-store',
          credentials: 'include',
        });
        const linkJson = (await linkRes.json()) as { linked?: boolean; reason?: string };
        if (linkJson.linked || linkJson.reason === 'clerk_disabled') return;

        await fetch('/api/auth/clerk-sync', {
          method: 'POST',
          credentials: 'include',
        });
      } catch {
        /* optional — Clerk Bearer checkout still works without backend cookies */
      }
    })();
  }, [isLoaded, isSignedIn, userId]);

  return null;
}
