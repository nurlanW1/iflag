import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthModalProvider } from '@/contexts/AuthModalContext';
import AuthModalWrapper from '@/components/AuthModalWrapper';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={inter.className}>
        <AuthProvider>
          <AuthModalProvider>
            <Navbar />
            {children}
            <Footer />
            <AuthModalWrapper />
          </AuthModalProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
