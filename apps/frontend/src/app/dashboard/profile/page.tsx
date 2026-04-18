import { getSessionUserFromCookies } from '@/lib/auth/session.server';

export default async function DashboardProfilePage() {
  const user = await getSessionUserFromCookies();
  if (!user) return null;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-black text-gray-900">Profile</h1>
      <p className="mt-1 text-sm text-gray-600">Your public account details.</p>
      <dl className="mt-8 space-y-6 rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Email</dt>
          <dd className="mt-1 text-base text-gray-900">{user.email}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Display name</dt>
          <dd className="mt-1 text-base text-gray-900">{user.full_name || '—'}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Email verified</dt>
          <dd className="mt-1 text-base text-gray-900">{user.email_verified ? 'Yes' : 'No'}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Role</dt>
          <dd className="mt-1 text-base text-gray-900 capitalize">{user.role}</dd>
        </div>
      </dl>
    </div>
  );
}
