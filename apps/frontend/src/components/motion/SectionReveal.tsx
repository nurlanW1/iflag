'use client';

import { motion, type Transition, type UseInViewOptions } from 'framer-motion';
import type { ReactNode } from 'react';
import { useRevealInView } from '@/hooks/useRevealInView';

type Target = {
  opacity?: number;
  y?: number;
  x?: number;
  scale?: number;
};

type SectionRevealProps = {
  children: ReactNode;
  className?: string;
  hidden?: Target;
  visible?: Target;
  transition?: Transition;
  viewport?: UseInViewOptions;
};

export function SectionReveal({
  children,
  className,
  hidden = { opacity: 0, y: 20 },
  visible = { opacity: 1, y: 0, x: 0, scale: 1 },
  transition,
  viewport,
}: SectionRevealProps) {
  const { ref, isRevealed } = useRevealInView<HTMLDivElement>(viewport);
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={false}
      animate={isRevealed ? visible : hidden}
      transition={transition}
    >
      {children}
    </motion.div>
  );
}
