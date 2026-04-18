import { redirect } from 'next/navigation';

/** Legacy URL: account settings live under Profile for Clerk-backed accounts. */
export default function DashboardSettingsRedirectPage() {
  redirect('/dashboard/profile');
}
