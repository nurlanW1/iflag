'use client';

import { useEffect } from 'react';
import { useAuthModal } from '@/contexts/AuthModalContext';

export default function LoginPage() {
  const { openModal } = useAuthModal();

  useEffect(() => {
    openModal('signin');
    // Redirect to home after opening modal
    window.history.replaceState({}, '', '/');
  }, [openModal]);

  return null;
}
