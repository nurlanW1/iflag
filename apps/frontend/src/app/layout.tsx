import './globals.css';
import Script from 'next/script';
import { ClerkProvider } from '@clerk/nextjs';
import { getClerkPublishableKey } from '@/lib/auth/clerk-env';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CookieNotice } from '@/components/legal/CookieNotice';
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthModalProvider } from '@/contexts/AuthModalContext';
import { CartProvider } from '@/contexts/CartContext';
import AuthModalWrapper from '@/components/AuthModalWrapper';
import { ClerkSessionBridge } from '@/components/auth/ClerkSessionBridge';
import { ClerkUiProvider } from '@/components/providers/ClerkUiProvider';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildDefaultMetadata } from '@/lib/seo/site-config';
import { logProductionDeploymentWarnings } from '@/lib/seo/production-warnings';
import { organizationJsonLd, websiteJsonLd } from '@/lib/seo/structured-data';
import { AdSenseScriptPlaceholder } from '@/components/ads/AdSensePlaceholder';
import { AppToaster } from '@/components/AppToaster';
import { PaddleInitializer } from '@/components/billing/PaddleInitializer';
import { Suspense } from 'react';
import { Inter, Libre_Baskerville } from 'next/font/google';
import type { ReactNode } from 'react';
import type { Viewport } from 'next';

const GOOGLE_TAG_IDS = [process.env.NEXT_PUBLIC_GA_ID, process.env.NEXT_PUBLIC_GOOGLE_ADS_ID]
  .map((id) => id?.trim())
  .filter((id): id is string => Boolean(id));
const GOOGLE_TAG_LOADER_ID = GOOGLE_TAG_IDS[0];

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const libreBaskerville = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-baskerville',
  display: 'swap',
});

export const metadata = {
  ...buildDefaultMetadata(),
  other: {
    'impact-site-verification': 'd080d108-7d67-4238-9f26-dc32a4ed96c7',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#2563eb',
};

logProductionDeploymentWarnings();

export default function RootLayout({ children }: { children: ReactNode }) {
  const clerkPublishableKey = getClerkPublishableKey();
  const clerkUiEnabled = Boolean(clerkPublishableKey);

  const inner = (
    <div className="flex min-h-dvh flex-col">
      <AdSenseScriptPlaceholder />
      <JsonLd data={[websiteJsonLd(), organizationJsonLd()]} />
      <a
        href="#site-content"
        className="sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:flex focus:h-auto focus:w-auto focus:overflow-visible focus:whitespace-normal focus:rounded-lg focus:bg-gray-900 focus:px-4 focus:py-2 focus:text-sm focus:text-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
      >
        Skip to main content
      </a>
      <ClerkUiProvider enabled={clerkUiEnabled}>
        <AuthProvider>
          <CartProvider clerkUiEnabled={clerkUiEnabled}>
            <AuthModalProvider>
              <Navbar clerkUiEnabled={clerkUiEnabled} />
              <div id="site-content" tabIndex={-1} className="min-w-0 w-full flex-1 outline-none">
                {children}
              </div>
              {/* Single site footer — same minimal layout on every route (gallery, legal, admin, dashboard, …). */}
              <Footer />
              <CookieNotice />
              <AuthModalWrapper />
              <AppToaster />
              <Suspense><PaddleInitializer /></Suspense>
            </AuthModalProvider>
          </CartProvider>
        </AuthProvider>
      </ClerkUiProvider>
    </div>
  );

  return (
    <html lang="en" className={`${inter.variable} ${libreBaskerville.variable}`} suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        {/*
          AdSense: after approval, load your publisher script here with next/script, e.g.
          <Script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXX"
            crossOrigin="anonymous" strategy="afterInteractive" />
          Keep AdSenseScriptPlaceholder as a no-op hook for typed imports if you prefer colocating docs in code.
        */}
        {clerkUiEnabled ? (
          <ClerkProvider
            publishableKey={clerkPublishableKey}
            signInUrl="/sign-in"
            signUpUrl="/sign-up"
          >
            <ClerkSessionBridge />
            {inner}
          </ClerkProvider>
        ) : (
          inner
        )}
        {GOOGLE_TAG_LOADER_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_TAG_LOADER_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-tag" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                ${GOOGLE_TAG_IDS.map((id) => `gtag('config', '${id}');`).join('\n                ')}
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}

