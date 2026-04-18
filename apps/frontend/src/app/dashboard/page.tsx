import Link from 'next/link';
import { LayoutDashboard, User, Package, Download, CreditCard } from 'lucide-react';

const cards = [
  {
    href: '/dashboard/profile',
    title: 'Profile',
    description: 'Your name, email, and account details from your sign-in provider.',
    icon: User,
  },
  {
    href: '/dashboard/purchases',
    title: 'Purchased files',
    description: 'Files you own on your account (one-time purchases and grants).',
    icon: Package,
  },
  {
    href: '/dashboard/downloads',
    title: 'Downloads',
    description: 'Download history will appear here as activity is recorded.',
    icon: Download,
  },
  {
    href: '/dashboard/subscription',
    title: 'Subscription',
    description: 'Plan status and renewal window when a subscription is active.',
    icon: CreditCard,
  },
] as const;

export default function DashboardOverviewPage() {
  return (
    <div>
      <div className="mb-8 flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#009ab6]/10 text-[#009ab6]">
          <LayoutDashboard size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900 md:text-3xl">Dashboard home</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your profile, purchases, downloads, and subscription in one place.
          </p>
        </div>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <li key={card.href}>
              <Link
                href={card.href}
                className="group flex h-full flex-col rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm transition hover:border-[#009ab6]/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009ab6] focus-visible:ring-offset-2"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gray-50 text-[#009ab6] transition group-hover:bg-[#009ab6]/10">
                  <Icon size={22} />
                </div>
                <h2 className="text-lg font-bold text-gray-900">{card.title}</h2>
                <p className="mt-2 flex-1 text-sm text-gray-600">{card.description}</p>
                <span className="mt-4 text-sm font-semibold text-[#009ab6]">Open →</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
