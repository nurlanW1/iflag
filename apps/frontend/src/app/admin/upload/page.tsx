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
  Database,
} from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { getClerkPublishableKey } from '@/lib/auth/clerk-env';
import { clientClerkUserMatchesAdmin } from '@/lib/auth/admin-email';

/** Same-origin only — never use NEXT_PUBLIC_API_URL or an external host (cookies won’t attach). */
const UPLOAD_RELATIVE_PATH = '/api/admin/upload';

const FORMATS = ['svg', 'png', 'jpg', 'jpeg', 'webp', 'pdf', 'eps', 'ai', 'psd'] as const;
const PREMIUM = ['free', 'freemium', 'paid'] as const;
/** Maps to Postgres `countries.category` CHECK constraint */
const COUNTRY_CATEGORIES = [
  { value: 'country', label: 'Country' },
  { value: 'autonomy', label: 'Autonomy' },
  { value: 'organization', label: 'Organization' },
  { value: 'historical', label: 'Historical' },
] as const;

type UploadResult = {
  ok?: boolean;
  success?: boolean;
  file_url?: string;
  file_key?: string;
  file_name?: string;
  format?: string;
  country_slug?: string;
  id?: string;
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
      <div className="marketplace-shell py-12">
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
                className="text-sm font-semibold text-[#1e40af] underline underline-offset-2 hover:text-[var(--brand-blue)]"
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
  const [priceCents, setPriceCents] = useState(99);
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('published');

  const [r2Importing, setR2Importing] = useState(false);
  const [r2Error, setR2Error] = useState<string | null>(null);
  const [r2Stats, setR2Stats] = useState<{
    scanned?: number;
    inserted?: number;
    updated?: number;
    skipped?: number;
    errors?: string[];
  } | null>(null);
  const [r2MaxObjects, setR2MaxObjects] = useState(5000);

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
          [data?.error, (data as { detail?: string }).detail].filter(Boolean).join(' — ') ||
          `Upload failed (${res.status})`;
        throw new Error(msg);
      }

      setResult(data as UploadResult);
      setFile(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleImportR2() {
    setR2Error(null);
    setR2Stats(null);
    if (!getToken) {
      setR2Error('Sign in is required to import.');
      return;
    }
    const token = await getToken();
    if (!token?.trim()) {
      setR2Error('Not signed in.');
      return;
    }
    const max = Math.min(100_000, Math.max(1, Math.floor(Number(r2MaxObjects) || 5000)));
    setR2Importing(true);
    try {
      const res = await fetch(`/api/admin/import-r2?maxObjects=${max}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        scanned?: number;
        inserted?: number;
        imported?: number;
        updated?: number;
        skipped?: number;
        errors?: string[];
      };
      if (!res.ok) {
        throw new Error(data.error || `Import failed (${res.status})`);
      }
      const insertedCount = typeof data.imported === 'number' ? data.imported : data.inserted;
      setR2Stats({ ...data, inserted: insertedCount });
    } catch (e: unknown) {
      setR2Error(e instanceof Error ? e.message : 'Import failed');
    } finally {
      setR2Importing(false);
    }
  }

  const fieldClass =
    'mt-1 w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-[#2a2a2a] shadow-sm outline-none transition focus:border-[var(--brand-blue)] focus:ring-2 focus:ring-[#2563eb]/25';

  return (
    <div className="marketplace-shell">
      <div className="mx-auto w-full min-w-0">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          <ArrowLeft size={16} aria-hidden />
          Admin home
        </Link>
      </div>

      <div className="mb-8">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-blue)]/10 text-[var(--brand-blue)]">
            <Upload size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-[#2a2a2a] md:text-4xl">Upload Flags</h1>
            <p className="text-sm text-gray-600 md:text-base">
              Stores files on **Cloudflare R2** and saves metadata to Neon (`country_flag_files`).
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

      {result?.ok || result?.success ? (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
          <div className="flex items-start gap-2">
            <CheckCircle2 size={22} className="shrink-0" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="font-bold">Uploaded successfully</p>
              <p className="mt-1 text-xs opacity-80">
                Storage: Cloudflare R2 · Row{' '}
                <code className="rounded bg-black/5 px-1">{result.file?.id ?? result.id}</code>
              </p>
              {(() => {
                const pub = result.file_url || result.file?.file_url;
                const img =
                  pub &&
                  /\.(svg|png|jpe?g|webp)$/i.test(pub);
                return pub && img ? (
                  <div className="mt-4 rounded-xl border border-emerald-200/80 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Preview</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={pub}
                      alt=""
                      className="mx-auto mt-3 max-h-72 w-auto max-w-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : pub ? (
                  <p className="mt-3 text-sm text-stone-700">
                    Preview is not shown for this file type (
                    <strong>{result.format?.toUpperCase()}</strong>). Use{' '}
                    <strong>Download file</strong> below.
                  </p>
                ) : null;
              })()}
              {result.file_key ? (
                <p className="mt-3 break-all text-xs opacity-90">
                  <span className="font-semibold">R2 key:</span>{' '}
                  <code className="rounded bg-black/5 px-1">{result.file_key}</code>
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-3">
                {(result.file?.id || result.id) && (
                  <a
                    href={`/api/download/${result.file?.id ?? result.id}`}
                    className="inline-flex items-center rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
                  >
                    Download file (protected route)
                  </a>
                )}
                {(result.file_url || result.file?.file_url) && (
                  <a
                    href={result.file_url || result.file?.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-[#1e40af] underline underline-offset-2 hover:text-[var(--brand-blue)]"
                  >
                    Open public URL
                    <ExternalLink size={14} aria-hidden />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mb-8 space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
            <Database size={20} aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-[#2a2a2a]">Import R2 files</h2>
            <p className="mt-1 text-sm text-gray-600">
              Lists your Cloudflare R2 bucket and upserts rows into Neon <code className="rounded bg-black/5 px-1">country_flag_files</code>{' '}
              (no duplicate <code className="rounded bg-black/5 px-1">file_key</code>). Requires the same R2 +{' '}
              <code className="rounded bg-black/5 px-1">DATABASE_URL</code> env on the <strong>backend</strong> API. Allowed: admin email only.
            </p>
            <p className="mt-2 text-xs text-gray-500">
              CLI (Railway or local after <code className="rounded bg-black/[0.06] px-1">npm run build</code>):{' '}
              <code className="rounded bg-black/[0.06] px-1">cd apps/backend && npm run import:r2</code>
            </p>
          </div>
        </div>
        {getToken ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div>
              <label htmlFor="r2_max" className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                Max objects
              </label>
              <input
                id="r2_max"
                type="number"
                min={1}
                max={100000}
                value={r2MaxObjects}
                onChange={(e) => setR2MaxObjects(Number(e.target.value) || 5000)}
                className={fieldClass}
              />
            </div>
            <button
              type="button"
              onClick={() => void handleImportR2()}
              disabled={r2Importing}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
            >
              {r2Importing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Database size={18} aria-hidden />}
              {r2Importing ? 'Importing…' : 'Run import via API'}
            </button>
          </div>
        ) : (
          <p className="text-sm text-amber-800">Sign in with Clerk to use the API import button.</p>
        )}
        {r2Error ? (
          <p role="alert" className="text-sm font-medium text-red-700">
            {r2Error}
          </p>
        ) : null}
        {r2Stats && (r2Stats.inserted !== undefined || r2Stats.updated !== undefined) ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-950">
            <p className="font-semibold">Import finished</p>
            <ul className="mt-2 list-inside list-disc text-xs">
              <li>Scanned: {r2Stats.scanned ?? '—'}</li>
              <li>Inserted: {r2Stats.inserted ?? '—'}</li>
              <li>Updated: {r2Stats.updated ?? '—'}</li>
              <li>Skipped: {r2Stats.skipped ?? '—'}</li>
            </ul>
            {r2Stats.errors && r2Stats.errors.length > 0 ? (
              <details className="mt-3">
                <summary className="cursor-pointer text-xs font-medium">Error messages ({r2Stats.errors.length})</summary>
                <ul className="mt-2 max-h-40 list-inside list-disc overflow-y-auto text-xs opacity-90">
                  {r2Stats.errors.slice(0, 40).map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </details>
            ) : null}
          </div>
        ) : null}
      </div>

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm md:p-8"
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
          <label className="flex cursor-pointer flex-col rounded-2xl border-2 border-dashed border-neutral-200 bg-gray-50/80 p-6 transition hover:border-[var(--brand-blue)]/60 hover:bg-white">
            <span className="flex items-center gap-2 text-sm font-semibold text-[#2a2a2a]">
              <FileUp size={18} className="text-[var(--brand-blue)]" aria-hidden />
              Choose file
            </span>
            <span className="mt-2 text-xs text-gray-600">One upload per submission (PNG, SVG, …)</span>
            <input
              type="file"
              disabled={submitting}
              accept=".svg,.png,.jpg,.jpeg,.webp,.pdf,.eps,.ai,.psd"
              className="mt-4 text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--brand-blue)] file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white"
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
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-blue-hover)] py-4 text-base font-semibold text-white shadow-lg shadow-[var(--brand-blue)]/20 transition hover:brightness-105 disabled:pointer-events-none disabled:opacity-50"
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
    </div>
  );
}
