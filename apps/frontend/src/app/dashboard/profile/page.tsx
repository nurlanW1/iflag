import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/auth/clerk-env';

export default async function DashboardProfilePage() {
  if (!isClerkConfigured()) {
    redirect('/');
  }

  const user = await currentUser();
  if (!user) {
    return null;
  }

  const primaryEmail =
    user.primaryEmailAddress?.emailAddress ?? user.emailAddresses?.[0]?.emailAddress ?? '—';
  const verified =
    user.primaryEmailAddress?.verification?.status === 'verified' ||
    user.emailAddresses?.some((e) => e.verification?.status === 'verified');

  const displayName =
    user.fullName?.trim() ||
    [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
    '—';

  return (
    <div className="w-full min-w-0">
      <h1 className="text-2xl font-semibold tracking-tight text-[#2a2a2a]">Profile</h1>
      <p className="mt-1 text-sm text-neutral-500">Information from your signed-in account.</p>

      <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-start">
        {user.imageUrl ? (
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element -- Clerk avatar URLs are external; avoid imagePatterns churn */}
            <img
              src={user.imageUrl}
              alt=""
              width={96}
              height={96}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div
            className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 text-sm font-medium text-neutral-400"
            aria-hidden
          >
            No photo
          </div>
        )}
        <dl className="min-w-0 flex-1 space-y-6 rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-400">User id</dt>
            <dd className="mt-1 break-all font-mono text-sm text-[#2a2a2a]">{user.id}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Email</dt>
            <dd className="mt-1 text-base text-[#2a2a2a]">{primaryEmail}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Display name</dt>
            <dd className="mt-1 text-base text-[#2a2a2a]">{displayName}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Email verified</dt>
            <dd className="mt-1 text-base text-[#2a2a2a]">{verified ? 'Yes' : 'No'}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
