'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import {
  ArrowLeft,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  FileVideo,
  FileImage,
  File,
  ShieldOff,
  ChevronDown,
  Database,
} from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { getClerkPublishableKey } from '@/lib/auth/clerk-env';
import { clientClerkUserMatchesAdmin } from '@/lib/auth/admin-email';
import { COUNTRIES, type Country } from '@/lib/countries';

// ─── Types ──────────────────────────────────────────────────────────────────

type FlagType = 'Flat' | 'Shape' | 'Mockup' | 'Video' | 'Historical';
type ShapeVariant = 'Sphere' | 'Heart' | 'Star' | 'Circle' | 'Wave' | 'Map' | 'Diamond';
type UploadStatus = 'pending' | 'uploading' | 'done' | 'error';

type FileItem = {
  id: string;
  file: File;
  type: FlagType;
  shape?: ShapeVariant;
  isPremium: boolean;
  price: number;
  keywords: string;
  description: string;
  status: UploadStatus;
  error?: string;
  resultUrl?: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function getExt(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? '';
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function detectType(filename: string): { type: FlagType; shape?: ShapeVariant } {
  const n = filename.toLowerCase();
  const ext = getExt(filename);
  if (['mp4', 'mov', 'webm', 'avi'].includes(ext)) return { type: 'Video' };
  if (n.includes('mockup')) return { type: 'Mockup' };
  if (n.includes('historical') || n.includes('historic')) return { type: 'Historical' };
  if (n.includes('sphere')) return { type: 'Shape', shape: 'Sphere' };
  if (n.includes('heart')) return { type: 'Shape', shape: 'Heart' };
  if (n.includes('star')) return { type: 'Shape', shape: 'Star' };
  if (n.includes('circle')) return { type: 'Shape', shape: 'Circle' };
  if (n.includes('wave') || n.includes('waving')) return { type: 'Shape', shape: 'Wave' };
  if (n.includes('map')) return { type: 'Shape', shape: 'Map' };
  if (n.includes('diamond')) return { type: 'Shape', shape: 'Diamond' };
  return { type: 'Flat' };
}

function buildKeywords(country: Country): string {
  const c = country.name.toLowerCase();
  return [
    `${c} flag svg download`,
    `${c} flag png free`,
    `${c} flag vector`,
    `${country.code} flag`,
    `${c} national flag`,
    `download ${c} flag`,
    `${c} flag eps`,
    `${c} flag transparent`,
  ].join(', ');
}

function buildDescription(country: Country, type: FlagType, shape?: string, ext?: string): string {
  const c = country.name;
  const fmt = ext?.toUpperCase() ?? 'SVG';
  switch (type) {
    case 'Shape':
      if (shape === 'Sphere') return `${c} flag in sphere shape. 3D globe effect, transparent background.`;
      if (shape === 'Heart') return `${c} flag in heart shape. Perfect for Independence Day designs.`;
      if (shape === 'Star') return `${c} flag in star shape. Patriotic graphic element.`;
      if (shape === 'Circle') return `${c} flag in circle shape. Rounded icon, transparent background.`;
      if (shape === 'Wave') return `${c} flag in wave shape. Dynamic waving effect.`;
      if (shape === 'Map') return `${c} flag mapped on country outline.`;
      if (shape === 'Diamond') return `${c} flag in diamond shape. Geometric graphic element.`;
      return `${c} flag in ${shape ?? 'custom'} shape.`;
    case 'Mockup': return `${c} flag mockup on realistic surface. High-quality presentation template.`;
    case 'Video': return `${c} flag waving video loop, 4K quality.`;
    case 'Historical': return `Historical ${c} flag in ${fmt} format.`;
    default: return `${c} national flag in ${fmt} format. Official flag of ${c} for free download.`;
  }
}

function makeFileItem(file: File, country: Country): FileItem {
  const { type, shape } = detectType(file.name);
  const ext = getExt(file.name);
  return {
    id: uid(),
    file,
    type,
    shape,
    isPremium: false,
    price: 3,
    keywords: buildKeywords(country),
    description: buildDescription(country, type, shape, ext),
    status: 'pending',
  };
}

function getR2Path(countrySlug: string, file: File, type: FlagType): string {
  const ext = getExt(file.name);
  const folder =
    type === 'Video' || ['mp4', 'mov', 'webm'].includes(ext)
      ? 'video'
      : type === 'Mockup'
        ? 'mockup'
        : ext;
  return `flags/${countrySlug}/${folder}/${file.name}`;
}

const TYPE_OPTIONS: FlagType[] = ['Flat', 'Shape', 'Mockup', 'Video', 'Historical'];
const SHAPE_OPTIONS: ShapeVariant[] = ['Sphere', 'Heart', 'Star', 'Circle', 'Wave', 'Map', 'Diamond'];

// ─── Status icon ─────────────────────────────────────────────────────────────

function StatusBadge({ status, error }: { status: UploadStatus; error?: string }) {
  if (status === 'done') return <CheckCircle2 size={16} className="text-emerald-500" />;
  if (status === 'uploading') return <Loader2 size={16} className="animate-spin text-blue-500" />;
  if (status === 'error') return (
    <span title={error} className="cursor-help">
      <AlertCircle size={16} className="text-red-500" />
    </span>
  );
  return null;
}

// ─── File card ───────────────────────────────────────────────────────────────

function FileCard({
  item,
  country,
  onUpdate,
  onRemove,
  disabled,
}: {
  item: FileItem;
  country: Country;
  onUpdate: (id: string, patch: Partial<FileItem>) => void;
  onRemove: (id: string) => void;
  disabled: boolean;
}) {
  const ext = getExt(item.file.name).toUpperCase();
  const isVideo = item.type === 'Video';
  const isShape = item.type === 'Shape';
  const r2Path = getR2Path(country.slug, item.file, item.type);

  const borderColor =
    item.status === 'done'
      ? 'border-emerald-200 bg-emerald-50/30'
      : item.status === 'error'
        ? 'border-red-200 bg-red-50/30'
        : item.status === 'uploading'
          ? 'border-blue-200 bg-blue-50/20'
          : 'border-neutral-200 bg-white';

  return (
    <div className={`rounded-2xl border p-4 transition-colors ${borderColor}`}>
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {isVideo ? (
            <FileVideo size={18} className="shrink-0 text-red-500" />
          ) : ['svg', 'png', 'jpg', 'jpeg', 'webp'].includes(ext.toLowerCase()) ? (
            <FileImage size={18} className="shrink-0 text-blue-500" />
          ) : (
            <File size={18} className="shrink-0 text-gray-400" />
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#2a2a2a]" title={item.file.name}>
              {item.file.name}
            </p>
            <p className="text-xs text-gray-400">{formatBytes(item.file.size)}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <StatusBadge status={item.status} error={item.error} />
          {!disabled && item.status !== 'done' && (
            <button
              onClick={() => onRemove(item.id)}
              className="rounded-lg p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
              aria-label="Remove file"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Format chip */}
      <div className="mb-3">
        <span className="inline-flex rounded-full bg-[var(--brand-blue)]/10 px-2.5 py-0.5 text-xs font-semibold text-[var(--brand-blue)]">
          {ext}
        </span>
        <span className="ml-2 text-xs text-gray-500 font-mono">{r2Path}</span>
      </div>

      {item.status === 'error' && item.error && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{item.error}</p>
      )}
      {item.status === 'done' && item.resultUrl && (
        <a
          href={item.resultUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-3 block text-xs font-medium text-emerald-700 underline"
        >
          View on R2 →
        </a>
      )}

      {/* Metadata controls */}
      <div className="grid grid-cols-2 gap-2">
        {/* Type */}
        <div>
          <label className="mb-0.5 block text-xs font-semibold text-gray-500">Type</label>
          <select
            disabled={disabled}
            value={item.type}
            onChange={e => {
              const t = e.target.value as FlagType;
              onUpdate(item.id, {
                type: t,
                shape: t === 'Shape' ? (item.shape ?? 'Sphere') : undefined,
                description: buildDescription(country, t, t === 'Shape' ? (item.shape ?? 'Sphere') : undefined, getExt(item.file.name)),
              });
            }}
            className="w-full rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-xs focus:border-[var(--brand-blue)] focus:outline-none"
          >
            {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Shape (conditional) */}
        {isShape ? (
          <div>
            <label className="mb-0.5 block text-xs font-semibold text-gray-500">Shape</label>
            <select
              disabled={disabled}
              value={item.shape ?? 'Sphere'}
              onChange={e => {
                const s = e.target.value as ShapeVariant;
                onUpdate(item.id, {
                  shape: s,
                  description: buildDescription(country, 'Shape', s, getExt(item.file.name)),
                });
              }}
              className="w-full rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-xs focus:border-[var(--brand-blue)] focus:outline-none"
            >
              {SHAPE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        ) : (
          <div />
        )}

        {/* Free/Premium toggle */}
        <div className="col-span-2 flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2">
          <span className="text-xs font-semibold text-gray-600">
            {item.isPremium ? 'Premium' : 'Free'}
          </span>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onUpdate(item.id, { isPremium: !item.isPremium })}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none ${
              item.isPremium ? 'bg-[var(--brand-blue)]' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                item.isPremium ? 'translate-x-4' : 'translate-x-0.5'
              }`}
            />
          </button>
          {item.isPremium && (
            <div className="ml-2 flex items-center gap-1">
              <span className="text-xs text-gray-500">$</span>
              <input
                type="number"
                min={0.5}
                step={0.5}
                disabled={disabled}
                value={item.price}
                onChange={e => onUpdate(item.id, { price: Number(e.target.value) || 3 })}
                className="w-14 rounded border border-neutral-200 px-1.5 py-0.5 text-xs focus:outline-none focus:border-[var(--brand-blue)]"
              />
            </div>
          )}
        </div>

        {/* Keywords */}
        <div className="col-span-2">
          <label className="mb-0.5 block text-xs font-semibold text-gray-500">Keywords</label>
          <textarea
            disabled={disabled}
            rows={2}
            value={item.keywords}
            onChange={e => onUpdate(item.id, { keywords: e.target.value })}
            className="w-full resize-none rounded-lg border border-neutral-200 px-2 py-1.5 text-xs focus:border-[var(--brand-blue)] focus:outline-none"
          />
        </div>

        {/* Description */}
        <div className="col-span-2">
          <label className="mb-0.5 block text-xs font-semibold text-gray-500">Description</label>
          <textarea
            disabled={disabled}
            rows={2}
            value={item.description}
            onChange={e => onUpdate(item.id, { description: e.target.value })}
            className="w-full resize-none rounded-lg border border-neutral-200 px-2 py-1.5 text-xs focus:border-[var(--brand-blue)] focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export default function AdminFlagUploadPage() {
  const clerkConfigured = Boolean(getClerkPublishableKey());
  if (!clerkConfigured) return <AdminUploadFormContent />;
  return <AdminUploadClerkGate />;
}

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

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" label={!isLoaded ? 'Loading' : 'Redirecting to sign-in'} />
      </div>
    );
  }

  if (!clientClerkUserMatchesAdmin(user)) {
    return (
      <div className="marketplace-shell py-12">
        <div role="alert" className="flex gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
          <ShieldOff size={28} className="shrink-0" />
          <div>
            <p className="text-lg font-bold">Access denied</p>
            <p className="mt-2 text-sm opacity-90">This page is restricted to administrators.</p>
            <div className="mt-4 flex gap-3">
              <Link href="/admin" className="rounded-xl border border-amber-300 bg-white px-4 py-2 text-sm font-medium hover:bg-amber-100/80">
                Back to admin
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <AdminUploadFormContent getToken={getToken} />;
}

// ─── Upload form ──────────────────────────────────────────────────────────────

function AdminUploadFormContent({ getToken }: { getToken?: () => Promise<string | null> }) {
  // Country search
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [country, setCountry] = useState<Country | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // File management
  const [fileItems, setFileItems] = useState<FileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSummary, setUploadSummary] = useState<{ success: number; error: number; prefix: string } | null>(null);

  // Import R2
  const [r2Importing, setR2Importing] = useState(false);
  const [r2Result, setR2Result] = useState<{ ok: boolean; message: string } | null>(null);

  // Country search filtered
  const filtered = query.trim().length < 1
    ? []
    : COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.code.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10);

  // Close dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  function selectCountry(c: Country) {
    setCountry(c);
    setQuery(c.name);
    setShowDropdown(false);
    // Reset files when country changes
    setFileItems([]);
    setUploadSummary(null);
  }

  function addFiles(newFiles: FileList | File[]) {
    if (!country) return;
    const arr = Array.from(newFiles);
    const items = arr.map(f => makeFileItem(f, country));
    setFileItems(prev => [...prev, ...items]);
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!country) return;
    addFiles(e.dataTransfer.files);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country]);

  function updateItem(id: string, patch: Partial<FileItem>) {
    setFileItems(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f));
  }

  function removeItem(id: string) {
    setFileItems(prev => prev.filter(f => f.id !== id));
  }

  async function handleUploadAll() {
    if (!country || fileItems.length === 0 || !getToken) return;

    const token = await getToken();
    if (!token) return;

    setIsUploading(true);
    setUploadSummary(null);

    const pending = fileItems.filter(f => f.status === 'pending');
    let successCount = 0;
    let errorCount = 0;

    for (const fi of pending) {
      // Mark this specific file as uploading
      setFileItems(prev => prev.map(f =>
        f.id === fi.id ? { ...f, status: 'uploading' as UploadStatus, error: undefined } : f
      ));

      try {
        const fd = new FormData();
        fd.append('file', fi.file, fi.file.name);
        fd.append('countrySlug', country.slug);
        fd.append('countryName', country.name);
        fd.append('countryCode', country.code);
        fd.append('metadata', JSON.stringify({
          type: fi.type,
          shape: fi.shape,
          isPremium: fi.isPremium,
          price: fi.price,
          keywords: fi.keywords,
          description: fi.description,
        }));

        const res = await fetch('/api/admin/flag-files/upload-v2', {
          method: 'POST',
          body: fd,
          credentials: 'include',
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json().catch(() => ({})) as {
          ok?: boolean; id?: string; fileUrl?: string; r2Key?: string; error?: string;
        };

        if (!res.ok || !data.ok) {
          throw new Error(data.error ?? `Server error (${res.status})`);
        }

        setFileItems(prev => prev.map(f =>
          f.id === fi.id ? { ...f, status: 'done' as UploadStatus, resultUrl: data.fileUrl } : f
        ));
        successCount++;
      } catch (err) {
        setFileItems(prev => prev.map(f =>
          f.id === fi.id
            ? { ...f, status: 'error' as UploadStatus, error: err instanceof Error ? err.message : 'Failed' }
            : f
        ));
        errorCount++;
      }
    }

    setUploadSummary({ success: successCount, error: errorCount, prefix: `flags/${country.slug}/` });
    setIsUploading(false);
  }

  async function handleImportR2() {
    if (!getToken) return;
    const token = await getToken();
    if (!token) return;
    setR2Importing(true);
    setR2Result(null);
    try {
      const res = await fetch(`/api/admin/import-r2?maxObjects=25000`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      const d = await res.json().catch(() => ({})) as { ok?: boolean; error?: string; inserted?: number; scanned?: number };
      if (!res.ok) throw new Error(d.error ?? `Failed (${res.status})`);
      setR2Result({ ok: true, message: `Scanned: ${d.scanned ?? '?'} · Inserted: ${d.inserted ?? '?'}` });
    } catch (e) {
      setR2Result({ ok: false, message: e instanceof Error ? e.message : 'Import failed' });
    } finally {
      setR2Importing(false);
    }
  }

  const pendingCount = fileItems.filter(f => f.status === 'pending').length;
  const doneCount = fileItems.filter(f => f.status === 'done').length;
  const errorCount = fileItems.filter(f => f.status === 'error').length;
  const canUpload = !!country && fileItems.length > 0 && !isUploading && pendingCount > 0;

  const fieldCls = 'w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-[var(--brand-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]/20';

  return (
    <div className="marketplace-shell py-8">
      <div className="mx-auto w-full max-w-4xl min-w-0">

        {/* Back link */}
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft size={16} />
            Admin home
          </Link>
        </div>

        {/* Page heading */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-blue)]/10 text-[var(--brand-blue)]">
            <Upload size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-[#2a2a2a]">Upload Flags</h1>
            <p className="text-sm text-gray-500">R2 storage · Neon DB · Multi-file batch upload</p>
          </div>
        </div>

        {/* ── STEP 1: Country selection ─────────────────────────────────── */}
        <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--brand-blue)] text-xs font-bold text-white">1</span>
            <h2 className="text-base font-semibold text-[#2a2a2a]">Select country</h2>
          </div>

          <div className="relative" ref={searchRef}>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search country... Paraguay, Uzbekistan..."
                value={query}
                onChange={e => {
                  setQuery(e.target.value);
                  setShowDropdown(true);
                  if (!e.target.value.trim()) setCountry(null);
                }}
                onFocus={() => query && setShowDropdown(true)}
                className={`${fieldCls} pl-9 pr-9`}
              />
              {country && (
                <button
                  onClick={() => { setCountry(null); setQuery(''); setFileItems([]); setUploadSummary(null); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-700"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {showDropdown && filtered.length > 0 && (
              <ul className="absolute z-20 mt-1 w-full rounded-xl border border-neutral-200 bg-white py-1 shadow-lg">
                {filtered.map(c => (
                  <li key={c.code}>
                    <button
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-gray-50"
                      onMouseDown={() => selectCountry(c)}
                    >
                      <span className="font-medium">{c.name}</span>
                      <span className="ml-auto rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono text-gray-500">{c.code.toUpperCase()}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Country info card */}
          {country && (
            <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm">
              <div className="grid gap-1.5 sm:grid-cols-2">
                <div><span className="text-gray-500">Country:</span> <strong>{country.name}</strong></div>
                <div><span className="text-gray-500">Code:</span> <strong className="font-mono">{country.code.toUpperCase()}</strong></div>
                <div><span className="text-gray-500">Slug:</span> <code className="rounded bg-black/5 px-1">{country.slug}</code></div>
                <div><span className="text-gray-500">R2 folder:</span> <code className="rounded bg-black/5 px-1">flags/{country.slug}/</code></div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                <span className="font-semibold">Keywords:</span>{' '}
                <span className="italic">{country.name.toLowerCase()} flag svg download, {country.code} flag, ...</span>
              </div>
            </div>
          )}
        </div>

        {/* ── STEP 2: Drag & drop ──────────────────────────────────────── */}
        <div className={`mb-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-opacity ${!country ? 'pointer-events-none opacity-40' : ''}`}>
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--brand-blue)] text-xs font-bold text-white">2</span>
            <h2 className="text-base font-semibold text-[#2a2a2a]">Add files</h2>
          </div>

          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => country && fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
              isDragging
                ? 'border-[var(--brand-blue)] bg-[var(--brand-blue)]/5'
                : 'border-neutral-200 hover:border-[var(--brand-blue)]/60 hover:bg-gray-50'
            }`}
          >
            <Upload size={32} className={isDragging ? 'text-[var(--brand-blue)]' : 'text-gray-300'} />
            <p className="mt-3 text-base font-semibold text-gray-700">
              {country ? `Drop ${country.name} flag files here` : 'Select a country first'}
            </p>
            <p className="mt-1 text-xs text-gray-400">SVG · PNG · EPS · PDF · JPG · MP4 · MOV</p>
            <button
              type="button"
              disabled={!country}
              className="mt-4 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-40"
            >
              Browse files
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            accept=".svg,.png,.jpg,.jpeg,.webp,.pdf,.eps,.ai,.psd,.mp4,.mov,.webm"
            onChange={e => e.target.files && addFiles(e.target.files)}
          />
        </div>

        {/* ── STEP 3: File cards ───────────────────────────────────────── */}
        {fileItems.length > 0 && country && (
          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--brand-blue)] text-xs font-bold text-white">3</span>
                <h2 className="text-base font-semibold text-[#2a2a2a]">
                  Files ({fileItems.length})
                </h2>
                {doneCount > 0 && <span className="text-xs font-semibold text-emerald-600">✓ {doneCount} done</span>}
                {errorCount > 0 && <span className="text-xs font-semibold text-red-600">✗ {errorCount} failed</span>}
              </div>
              {!isUploading && pendingCount > 0 && (
                <button
                  onClick={() => setFileItems([])}
                  className="text-xs text-gray-400 hover:text-red-500"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {fileItems.map(item => (
                <FileCard
                  key={item.id}
                  item={item}
                  country={country}
                  onUpdate={updateItem}
                  onRemove={removeItem}
                  disabled={isUploading || item.status === 'done'}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Upload summary ───────────────────────────────────────────── */}
        {uploadSummary && (
          <div className={`mb-6 rounded-2xl border p-5 ${uploadSummary.error === 0 ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
            <div className="flex items-start gap-3">
              {uploadSummary.error === 0
                ? <CheckCircle2 size={22} className="shrink-0 text-emerald-600" />
                : <AlertCircle size={22} className="shrink-0 text-amber-600" />
              }
              <div>
                <p className="font-bold text-[#2a2a2a]">
                  {uploadSummary.error === 0 ? 'All files uploaded!' : `${uploadSummary.success} uploaded, ${uploadSummary.error} failed`}
                </p>
                <p className="mt-1 font-mono text-xs text-gray-600">R2: {uploadSummary.prefix}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 4: Upload button ────────────────────────────────────── */}
        {country && fileItems.length > 0 && (
          <button
            type="button"
            disabled={!canUpload}
            onClick={() => void handleUploadAll()}
            className="mb-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-blue-hover)] py-4 text-base font-semibold text-white shadow-lg shadow-[var(--brand-blue)]/20 transition hover:brightness-105 disabled:pointer-events-none disabled:opacity-50"
          >
            {isUploading
              ? <><Loader2 className="animate-spin" size={20} /> Uploading {fileItems.length} file{fileItems.length !== 1 ? 's' : ''}…</>
              : <><Upload size={20} /> Upload {pendingCount > 0 ? `${pendingCount} ` : ''}file{pendingCount !== 1 ? 's' : ''} to R2</>
            }
          </button>
        )}

        {/* ── Import R2 (advanced) ─────────────────────────────────────── */}
        <details className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <summary className="flex cursor-pointer items-center gap-3 p-5 select-none">
            <Database size={18} className="text-sky-600" />
            <span className="text-sm font-semibold text-[#2a2a2a]">Import existing R2 files to DB</span>
            <ChevronDown size={14} className="ml-auto text-gray-400" />
          </summary>
          <div className="border-t border-neutral-100 px-5 pb-5 pt-4">
            <p className="mb-3 text-xs text-gray-500">
              Lists R2 bucket and upserts rows into <code className="rounded bg-black/5 px-1">country_flag_files</code> (no duplicates by <code className="rounded bg-black/5 px-1">file_key</code>).
            </p>
            {getToken ? (
              <button
                type="button"
                onClick={() => void handleImportR2()}
                disabled={r2Importing}
                className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
              >
                {r2Importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database size={16} />}
                {r2Importing ? 'Importing…' : 'Run import via API'}
              </button>
            ) : (
              <p className="text-sm text-amber-700">Sign in with Clerk to use this button.</p>
            )}
            {r2Result && (
              <p className={`mt-3 text-sm font-medium ${r2Result.ok ? 'text-emerald-700' : 'text-red-700'}`}>
                {r2Result.ok ? '✓ ' : '✗ '}{r2Result.message}
              </p>
            )}
          </div>
        </details>

      </div>
    </div>
  );
}
