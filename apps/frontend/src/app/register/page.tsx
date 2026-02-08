'use client';

import { useEffect } from 'react';
import { useAuthModal } from '@/contexts/AuthModalContext';

export default function RegisterPage() {
  const { openModal } = useAuthModal();

  useEffect(() => {
    openModal('signup');
    // Redirect to home after opening modal
    window.history.replaceState({}, '', '/');
  }, [openModal]);

  return null;
}
