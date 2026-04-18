import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { getSessionUserFromCookies } from '@/lib/auth/session.server';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUserFromCookies();
  if (!user) {
    redirect('/login?callbackUrl=%2Fdashboard');
  }
  return <DashboardShell user={user}>{children}</DashboardShell>;
}
