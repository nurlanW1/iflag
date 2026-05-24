'use client';

import { createContext, useContext, type ReactNode } from 'react';

const ClerkUiContext = createContext(false);

export function ClerkUiProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  return <ClerkUiContext.Provider value={enabled}>{children}</ClerkUiContext.Provider>;
}

/** Matches root layout ClerkProvider — avoids client-only env mismatches for checkout routing. */
export function useClerkUiEnabled(): boolean {
  return useContext(ClerkUiContext);
}
