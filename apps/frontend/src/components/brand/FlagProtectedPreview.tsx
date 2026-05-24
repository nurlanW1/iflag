'use client';

import type { ReactNode } from 'react';
import { ProductPreviewImage } from '@/components/brand/ProductPreviewImage';

type Props = {
  children: ReactNode;
  /** Extra Tailwind/classes; wrapper is typically `relative`/`absolute inset-0` fill. */
  className?: string;
};

/** @deprecated Prefer {@link ProductPreviewImage} with explicit `watermarkEnabled` / `protectEnabled`. */
export function FlagProtectedPreview({ children, className }: Props) {
  return (
    <ProductPreviewImage className={className} watermarkEnabled={false} protectEnabled>
      {children}
    </ProductPreviewImage>
  );
}
