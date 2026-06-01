'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useRef } from 'react';
import {
  clearClerkBridgeClientCache,
  scheduleClerkBackendSessionBridge,
} from '@/lib/auth/clerk-session-bridge.client';

/**
 * After Clerk sign-in, link the account to backend JWT cookies when bridge env is configured.
 * Checkout uses Clerk session tokens directly — this is best-effort for dashboard/purchases APIs.
 */
export function ClerkSessionBridge() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const lastUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !userId) {
      if (lastUserId.current) {
        clearClerkBridgeClientCache(lastUserId.current);
      }
      lastUserId.current = null;
      return;
    }

    if (lastUserId.current === userId) return;
    lastUserId.current = userId;

    scheduleClerkBackendSessionBridge(userId);
  }, [isLoaded, isSignedIn, userId]);

  return null;
}
