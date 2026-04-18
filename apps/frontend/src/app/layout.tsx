import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CookieNotice } from '@/components/legal/CookieNotice';
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthModalProvider } from '@/contexts/AuthModalContext';
import AuthModalWrapper from '@/components/AuthModalWrapper';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildDefaultMetadata } from '@/lib/seo/site-config';
import { logProductionDeploymentWarnings } from '@/lib/seo/production-warnings';
import { organizationJsonLd, websiteJsonLd } from '@/lib/seo/structured-data';
import { AdSenseScriptPlaceholder } from '@/components/ads/AdSensePlaceholder';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata = buildDefaultMetadata();

logProductionDeploymentWarnings();

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={inter.className}>
        {/*
          AdSense: after approval, load your publisher script here with next/script, e.g.
          <Script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXX"
            crossOrigin="anonymous" strategy="afterInteractive" />
          Keep AdSenseScriptPlaceholder as a no-op hook for typed imports if you prefer colocating docs in code.
        */}
        <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up">
          <AdSenseScriptPlaceholder />
          <JsonLd data={[websiteJsonLd(), organizationJsonLd()]} />
          <a
            href="#site-content"
            className="sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:flex focus:h-auto focus:w-auto focus:overflow-visible focus:whitespace-normal focus:rounded-lg focus:bg-gray-900 focus:px-4 focus:py-2 focus:text-sm focus:text-white focus:outline-none focus:ring-2 focus:ring-[#009ab6]"
          >
            Skip to main content
          </a>
          <AuthProvider>
            <AuthModalProvider>
              <Navbar />
              <div id="site-content" tabIndex={-1}>
                {children}
              </div>
              <Footer />
              <CookieNotice />
              <AuthModalWrapper />
            </AuthModalProvider>
          </AuthProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}

