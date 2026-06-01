'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useRef } from 'react';
import {
  clearClerkBridgeClientCache,
  ensureClerkBackendSession,
} from '@/lib/auth/clerk-session-bridge.client';

/**
 * After Clerk sign-in, link the account to backend JWT cookies when bridge env is configured.
 * Checkout uses Clerk session tokens directly — this is best-effort for dashboard/purchases APIs.
 */
export function ClerkSessionBridge() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const activeUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !userId) {
      if (activeUserId.current) {
        clearClerkBridgeClientCache(activeUserId.current);
      }
      activeUserId.current = null;
      return;
    }

    if (activeUserId.current === userId) return;
    activeUserId.current = userId;

    void ensureClerkBackendSession(userId).catch(() => {
      /* optional — Clerk Bearer checkout still works without backend cookies */
    });
  }, [isLoaded, isSignedIn, userId]);

  return null;
}
