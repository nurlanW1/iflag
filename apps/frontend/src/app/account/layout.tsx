import type { Metadata } from 'next';
import Link from 'next/link';
import { Download, Heart, CreditCard, Settings } from 'lucide-react';
import { SITE_NAME } from '@/lib/seo/site-config';

export const metadata: Metadata = {
  title: `My Account | ${SITE_NAME}`,
  robots: { index: false },
};

const tabs = [
  { href: '/account/downloads', label: 'Downloads', icon: Download },
  { href: '/account/favorites', label: 'Favorites', icon: Heart },
  { href: '/account/subscription', label: 'Subscription', icon: CreditCard },
  { href: '/account/settings', label: 'Settings', icon: Settings },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="marketplace-shell py-8">
        <h1 className="text-2xl font-bold text-stone-900">My Account</h1>

        {/* Tabs */}
        <nav className="mt-6 flex gap-1 overflow-x-auto rounded-xl border border-stone-200 bg-white p-1">
          {tabs.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex min-w-max items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-stone-600 transition hover:bg-stone-50 hover:text-stone-900"
            >
              <Icon size={15} aria-hidden />
              {label}
            </Link>
          ))}
        </nav>

        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
