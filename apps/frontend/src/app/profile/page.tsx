import { redirect } from 'next/navigation';

/** Legacy `/profile` links from the navbar → unified dashboard. */
export default function ProfileRedirectPage() {
  redirect('/dashboard/profile');
}
