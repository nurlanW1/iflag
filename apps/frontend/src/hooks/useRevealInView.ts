'use client';

import { useInView, type UseInViewOptions } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

/**
 * After mount, combines IntersectionObserver with a client-only gate so the first
 * client paint matches SSR (avoids Framer Motion + whileInView hydration mismatches).
 */
export function useRevealInView<T extends Element = HTMLDivElement>(options?: UseInViewOptions) {
  const ref = useRef<T | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const inView = useInView(ref, {
    once: true,
    margin: '0px 0px -40px 0px',
    ...options,
  });
  const isRevealed = mounted && inView;
  return { ref, isRevealed };
}

export function useHasMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
