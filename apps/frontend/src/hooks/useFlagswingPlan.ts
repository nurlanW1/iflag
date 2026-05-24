'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

export function useFlagswingPlan() {
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const [hasActivePlan, setHasActivePlan] = useState(false);
  const [planLoaded, setPlanLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadPlan() {
      if (!authLoaded) return;
      if (!isSignedIn) {
        setHasActivePlan(false);
        setPlanLoaded(true);
        return;
      }
      setPlanLoaded(false);
      try {
        const r = await fetch('/api/account/flagswing-plan', { credentials: 'include' });
        const j = (await r.json()) as { hasActivePlan?: boolean };
        if (!cancelled) setHasActivePlan(Boolean(j.hasActivePlan));
      } catch {
        if (!cancelled) setHasActivePlan(false);
      } finally {
        if (!cancelled) setPlanLoaded(true);
      }
    }

    void loadPlan();
    return () => {
      cancelled = true;
    };
  }, [isSignedIn, authLoaded]);

  return { isSignedIn: Boolean(isSignedIn), authLoaded, hasActivePlan, planLoaded };
}
