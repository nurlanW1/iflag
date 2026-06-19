'use client';

import { useUser } from '@clerk/nextjs';
import { ExternalLink } from 'lucide-react';
import { getPublicContactEmail } from '@/lib/legal/legal-placeholders';

export default function SettingsPage() {
  const { user } = useUser();
  const contactEmail = getPublicContactEmail();

  const email = user?.primaryEmailAddress?.emailAddress ?? '—';

  return (
    <div className="space-y-4">
      {/* Email */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-stone-900">Email address</h2>
        <p className="mt-1 text-sm text-stone-500">{email}</p>
        <p className="mt-2 text-xs text-stone-400">
          To change your email, manage it via the Clerk user portal.
        </p>
        <a
          href="https://accounts.clerk.dev/user"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--brand-blue)] hover:underline"
        >
          Open Clerk Portal <ExternalLink size={11} />
        </a>
      </div>

      {/* Notifications */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-stone-900">Notifications</h2>
        <p className="mt-1 text-xs text-stone-400">
          Notification preferences can be managed via your email settings.
        </p>
      </div>

      {/* Danger zone */}
      <div className="rounded-2xl border border-red-100 bg-red-50/40 p-6">
        <h2 className="text-sm font-semibold text-red-700">Danger zone</h2>
        <p className="mt-1 text-xs text-red-500">
          To delete your account, please contact{' '}
          <a href={`mailto:${contactEmail}`} className="underline">
            {contactEmail}
          </a>
          .
        </p>
      </div>
    </div>
  );
}
