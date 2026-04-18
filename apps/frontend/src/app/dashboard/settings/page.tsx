import Link from 'next/link';
import { getSessionUserFromCookies } from '@/lib/auth/session.server';

export default async function DashboardSettingsPage() {
  const user = await getSessionUserFromCookies();
  if (!user) return null;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-black text-gray-900">Account settings</h1>
      <p className="mt-1 text-sm text-gray-600">
        Security and preferences. Password changes are handled through your account provider when
        enabled on the API.
      </p>
      <div className="mt-8 space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <section>
          <h2 className="text-sm font-bold text-gray-900">Session</h2>
          <p className="mt-2 text-sm text-gray-600">
            You are signed in as <span className="font-medium text-gray-900">{user.email}</span>.
            Use <span className="font-medium">Sign out</span> in the sidebar to end this session on
            this device.
          </p>
        </section>
        <section className="border-t border-gray-100 pt-4">
          <h2 className="text-sm font-bold text-gray-900">Legal & policies</h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            <li>
              <Link href="/privacy" className="text-[#009ab6] hover:underline">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="text-[#009ab6] hover:underline">
                Terms
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
