import Link from 'next/link';
import { ArrowRight, LayoutDashboard, User, Package, Download, CreditCard } from 'lucide-react';

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
    title: 'Billing',
    description: 'One-time purchases and Paddle receipts — no subscription plans.',
    icon: CreditCard,
  },
] as const;

export default function DashboardOverviewPage() {
  return (
    <div>
      <div className="mb-8 flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2563eb]/10 text-[#2563eb]">
          <LayoutDashboard size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#2a2a2a] md:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your profile, purchases, and downloads in one place.
          </p>
        </div>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <li key={card.href}>
              <Link
                href={card.href}
                className="group flex h-full flex-col rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-[border-color,box-shadow] hover:border-[#2563eb]/35 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] focus-visible:ring-offset-2"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--brand-blue-soft)] text-[var(--brand-blue)] transition group-hover:bg-[#2563eb]/15">
                  <Icon size={21} strokeWidth={1.75} />
                </div>
                <h2 className="text-[0.9375rem] font-semibold text-[#2a2a2a]">{card.title}</h2>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-neutral-500">{card.description}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--brand-blue)] opacity-0 transition-opacity group-hover:opacity-100">
                  Open <ArrowRight size={13} aria-hidden />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
