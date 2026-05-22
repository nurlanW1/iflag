'use client';

import { Toaster } from 'sonner';

/** Global stacked toasts — use `toast.success` etc. from `sonner`. */
export function AppToaster() {
  return (
    <Toaster
      richColors
      closeButton
      position="bottom-center"
      toastOptions={{
        classNames: {
          toast: 'rounded-xl border border-neutral-200/95 shadow-lg backdrop-blur-sm',
          title: 'font-semibold text-[#171717]',
          description: 'text-neutral-600',
        },
      }}
    />
  );
}
