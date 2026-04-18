import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { DashboardShell } from '@/components/dashboard/DashboardShell';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  const clerkUser = await currentUser();
  const primaryEmail =
    clerkUser?.primaryEmailAddress?.emailAddress ??
    clerkUser?.emailAddresses?.[0]?.emailAddress ??
    '';
  const displayName =
    clerkUser?.fullName?.trim() ||
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ').trim() ||
    null;

  return (
    <DashboardShell
      account={{
        clerkUserId: userId,
        email: primaryEmail || 'Signed-in user',
        displayName,
        imageUrl: clerkUser?.imageUrl ?? null,
      }}
    >
      {children}
    </DashboardShell>
  );
}
