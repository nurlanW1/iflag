'use client';

/**
 * Admin upload: same-origin POST with `credentials: "include"` and
 * `Authorization: Bearer <Clerk session JWT>` from `useAuth().getToken()`.
 * Server verifies the JWT with Clerk (CLERK_SECRET_KEY) and checks admin allow-list.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import {
  ArrowLeft,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileUp,
  ExternalLink,
  ShieldOff,
} from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { getClerkPublishableKey } from '@/lib/auth/clerk-env';
import { clientClerkUserMatchesAdmin } from '@/lib/auth/admin-email';

/** Same-origin only — never use NEXT_PUBLIC_API_URL or an external host (cookies won’t attach). */
const UPLOAD_RELATIVE_PATH = '/api/admin/upload';

const FORMATS = ['svg', 'png', 'jpg', 'jpeg', 'webp', 'pdf', 'eps'] as const;
const PREMIUM = ['free', 'freemium', 'paid'] as const;
/** Maps to Postgres `countries.category` CHECK constraint */
const COUNTRY_CATEGORIES = [
  { value: 'country', label: 'Country' },
  { value: 'autonomy', label: 'Autonomy' },
  { value: 'organization', label: 'Organization' },
  { value: 'historical', label: 'Historical' },
] as const;

type UploadResult = {
  ok: boolean;
  blob_url?: string;
  file?: { id: string; file_url: string; file_name: string; created_at: string; status: string };
};

export default function AdminFlagBlobUploadPage() {
  const clerkConfigured = Boolean(getClerkPublishableKey());
  if (!clerkConfigured) {
    return <AdminUploadFormContent />;
  }
  return <AdminUploadClerkGate />;
}

/** Ensures Clerk session + allow-list before showing the upload form. */
function AdminUploadClerkGate() {
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace(`/sign-in?redirect_url=${encodeURIComponent('/admin/upload')}`);
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" label="Loading" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" label="Redirecting to sign-in" />
      </div>
    );
  }

  if (!clientClerkUserMatchesAdmin(user)) {
    return (
      <div className="mx-auto max-w-3xl py-12">
        <div
          role="alert"
          className="flex gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950"
        >
          <ShieldOff size={28} className="shrink-0" aria-hidden />
          <div className="min-w-0">
            <p className="text-lg font-bold">Access denied</p>
            <p className="mt-2 text-sm opacity-90">
              This upload page is restricted to administrators. Your signed-in email is not on the allow-list.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/access-denied?reason=forbidden"
                className="text-sm font-semibold text-[#006d7a] underline underline-offset-2 hover:text-[#009ab6]"
              >
                More about access
              </Link>
              <Link
                href="/admin"
                className="rounded-xl border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-amber-100/80"
              >
                Back to admin
              </Link>
              <Link href="/" className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:underline">
                Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <AdminUploadFormContent getToken={getToken} />;
}

function AdminUploadFormContent({
  getToken,
}: {
  getToken?: () => Promise<string | null>;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);

  const [countryName, setCountryName] = useState('');
  const [countrySlug, setCountrySlug] = useState('');
  const [region, setRegion] = useState('');
  const [countryCategory, setCountryCategory] = useState<(typeof COUNTRY_CATEGORIES)[number]['value']>(
    'country'
  );
  const [flagTitle, setFlagTitle] = useState('');
  const [format, setFormat] = useState<(typeof FORMATS)[number]>('svg');
  const [premiumTier, setPremiumTier] = useState<(typeof PREMIUM)[number]>('free');
  const [priceCents, setPriceCents] = useState(0);
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('published');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!file) {
      setError('Choose a flag file.');
      return;
    }
    if (!countryName.trim() || !countrySlug.trim()) {
      setError('Country name and slug are required.');
      return;
    }
    if (!flagTitle.trim()) {
      setError('Flag title/name is required.');
      return;
    }

    const fd = new FormData();
    fd.append('file', file);
    fd.append('country_name', countryName.trim());
    fd.append('country_slug', countrySlug.trim().toLowerCase());
    fd.append('region', region.trim());
    fd.append('category', countryCategory);
    fd.append('flag_title', flagTitle.trim());
    fd.append('format', format);
    fd.append('premium_tier', premiumTier);
    fd.append('price_cents', String(Math.max(0, Math.round(priceCents))));
    fd.append('tags', tags.trim());
    fd.append('status', status);

    setSubmitting(true);
    try {
      let headers: HeadersInit | undefined;
      if (getToken) {
        const token = await getToken();
        if (!token?.trim()) {
          throw new Error('Not signed in');
        }
        headers = { Authorization: `Bearer ${token}` };
      }

      const res = await fetch(UPLOAD_RELATIVE_PATH, {
        method: 'POST',
        body: fd,
        credentials: 'include',
        headers,
      });
      const data = (await res.json().catch(() => ({}))) as UploadResult & {
        error?: string;
        detail?: string;
        code?: string;
      };

      if (!res.ok) {
        const msg =
          [data?.error, data?.detail].filter(Boolean).join(' — ') || `Upload failed (${res.status})`;
        throw new Error(msg);
      }

      setResult(data);
      setFile(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const fieldClass =
    'mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition focus:border-[#009ab6] focus:ring-2 focus:ring-[#009ab6]/25';

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          <ArrowLeft size={16} aria-hidden />
          Admin home
        </Link>
      </div>

      <div className="mb-8">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#009ab6]/10 text-[#009ab6]">
            <Upload size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-gray-900 md:text-4xl">Upload Flags</h1>
            <p className="text-sm text-gray-600 md:text-base">
              Stores the file on Vercel Blob and saves metadata to Neon Postgres (`country_flag_files`).
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          className="mb-6 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-900"
        >
          <AlertCircle size={20} className="shrink-0" aria-hidden />
          <p className="text-sm font-medium">{error}</p>
        </div>
      ) : null}

      {result?.ok ? (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
          <div className="flex items-start gap-2">
            <CheckCircle2 size={22} className="shrink-0" aria-hidden />
            <div className="min-w-0">
              <p className="font-bold">Uploaded successfully</p>
              <p className="mt-1 text-sm opacity-90">URL (public):</p>
              <a
                href={result.blob_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex max-w-full items-center gap-1 break-all text-sm font-semibold text-[#006d7a] underline underline-offset-2 hover:text-[#009ab6]"
              >
                {result.blob_url}
                <ExternalLink size={14} aria-hidden />
              </a>
              <p className="mt-2 text-xs opacity-75">
                DB row id <code className="rounded bg-black/5 px-1">{result.file?.id}</code> · status{' '}
                <strong>{result.file?.status}</strong>
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8"
      >
        <fieldset className="grid gap-4 sm:grid-cols-2" disabled={submitting}>
          <legend className="sr-only">Country context</legend>
          <div className="sm:col-span-2">
            <label htmlFor="country_name" className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              Country name
            </label>
            <input
              id="country_name"
              name="country_name"
              required
              maxLength={255}
              autoComplete="off"
              value={countryName}
              onChange={(e) => setCountryName(e.target.value)}
              className={fieldClass}
              placeholder="e.g. Uzbekistan"
            />
          </div>
          <div>
            <label htmlFor="country_slug" className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              Country slug
            </label>
            <input
              id="country_slug"
              name="country_slug"
              required
              maxLength={255}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              value={countrySlug}
              onChange={(e) =>
                setCountrySlug(
                  e.target.value
                    .toLowerCase()
                    .trim()
                    .replace(/\s+/g, '-')
                )
              }
              className={fieldClass}
              placeholder="e.g. uzbekistan"
            />
          </div>
          <div>
            <label htmlFor="region" className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              Region
            </label>
            <input
              id="region"
              name="region"
              maxLength={100}
              autoComplete="off"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className={fieldClass}
              placeholder="Optional"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="category" className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              Category (country type)
            </label>
            <select
              id="category"
              name="category"
              value={countryCategory}
              onChange={(e) =>
                setCountryCategory(e.target.value as (typeof COUNTRY_CATEGORIES)[number]['value'])
              }
              className={fieldClass}
            >
              {COUNTRY_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </fieldset>

        <fieldset className="grid gap-4 sm:grid-cols-2" disabled={submitting}>
          <legend className="sr-only">Flag file metadata</legend>
          <div className="sm:col-span-2">
            <label htmlFor="flag_title" className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              Flag title / name
            </label>
            <input
              id="flag_title"
              name="flag_title"
              required
              maxLength={100}
              value={flagTitle}
              onChange={(e) => setFlagTitle(e.target.value)}
              className={fieldClass}
              placeholder="e.g. Standard flat"
            />
          </div>
          <div>
            <label htmlFor="format" className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              Format
            </label>
            <select
              id="format"
              value={format}
              onChange={(e) => setFormat(e.target.value as (typeof FORMATS)[number])}
              className={fieldClass}
            >
              {FORMATS.map((f) => (
                <option key={f} value={f}>
                  {f.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="premium_tier" className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              Premium tier
            </label>
            <select
              id="premium_tier"
              value={premiumTier}
              onChange={(e) => setPremiumTier(e.target.value as (typeof PREMIUM)[number])}
              className={fieldClass}
            >
              {PREMIUM.map((p) => (
                <option key={p} value={p}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="price_cents" className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              Price (USD cents)
            </label>
            <input
              id="price_cents"
              name="price_cents"
              type="number"
              min={0}
              step={1}
              value={priceCents}
              onChange={(e) => setPriceCents(Number(e.target.value) || 0)}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="status" className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              Status
            </label>
            <select id="status" value={status} onChange={(e) => setStatus(e.target.value as 'draft' | 'published')} className={fieldClass}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="tags" className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              Tags (comma-separated)
            </label>
            <input
              id="tags"
              name="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className={fieldClass}
              placeholder="vector, svg, ..."
            />
          </div>
        </fieldset>

        <div>
          <label className="flex cursor-pointer flex-col rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/80 p-6 transition hover:border-[#009ab6]/60 hover:bg-white">
            <span className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <FileUp size={18} className="text-[#009ab6]" aria-hidden />
              Choose file
            </span>
            <span className="mt-2 text-xs text-gray-600">One upload per submission (PNG, SVG, …)</span>
            <input
              type="file"
              disabled={submitting}
              accept=".svg,.png,.jpg,.jpeg,.webp,.pdf,.eps"
              className="mt-4 text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-[#009ab6] file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white"
              onChange={(e) => {
                const f = e.target.files?.[0];
                setFile(f ?? null);
              }}
            />
            {file ? (
              <p className="mt-3 truncate text-xs text-gray-800" title={file.name}>
                Selected: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)
              </p>
            ) : null}
          </label>
        </div>

        <button
          type="submit"
          disabled={submitting || !file}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#009ab6] to-[#007a8a] py-4 text-base font-black text-white shadow-lg shadow-[#009ab6]/25 transition hover:brightness-105 disabled:pointer-events-none disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="animate-spin" size={20} aria-hidden />
              Uploading…
            </>
          ) : (
            <>
              <Upload size={20} aria-hidden />
              Upload
            </>
          )}
        </button>
      </form>
    </div>
  );
}
