'use client';

import { useAuthModal } from '@/contexts/AuthModalContext';
import AuthModal from './AuthModal';

export default function AuthModalWrapper() {
  const { isOpen, mode, closeModal } = useAuthModal();
  return <AuthModal isOpen={isOpen} onClose={closeModal} initialMode={mode} />;
}
