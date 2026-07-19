'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import {
  Eye,
  EyeOff,
  RefreshCw,
  Copy,
  Check,
  KeyRound,
  Crown,
  AlertTriangle,
  ArrowRight,
  Loader2,
  BarChart2,
} from 'lucide-react';

interface ApiKeyData {
  key_prefix: string;
  key_masked: string;
  plan: 'free' | 'basic' | 'pro' | 'enterprise';
  requests_today: number;
  requests_total: number;
  daily_limit: number;
  created_at: string;
}

interface RevealedKeyData {
  key: string;
}

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  basic: 'bg-blue-50 text-blue-700 border-blue-200',
  pro: 'bg-purple-50 text-purple-700 border-purple-200',
  enterprise: 'bg-amber-50 text-amber-700 border-amber-200',
};

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  basic: 'Basic',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-600 shadow-sm transition hover:bg-neutral-50"
      aria-label={copied ? 'Copied!' : label}
    >
      {copied ? <Check size={13} aria-hidden /> : <Copy size={13} aria-hidden />}
      {copied ? 'Copied!' : label}
    </button>
  );
}

export default function ApiKeysPageClient() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const [keyData, setKeyData] = useState<ApiKeyData | null>(null);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmGenerate, setConfirmGenerate] = useState(false);

  const fetchKeyData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch('/api/v1/me/api-key', {
        headers: { Authorization: `Bearer ${token ?? ''}` },
      });
      if (res.status === 404) {
        setKeyData(null);
        return;
      }
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(d.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as ApiKeyData;
      setKeyData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load API key');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      void fetchKeyData();
    } else if (isLoaded && !isSignedIn) {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, fetchKeyData]);

  async function handleGenerate() {
    if (!confirmGenerate) {
      setConfirmGenerate(true);
      return;
    }
    setGenerating(true);
    setConfirmGenerate(false);
    setRevealedKey(null);
    setShowKey(false);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch('/api/v1/me/api-key/generate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token ?? ''}` },
      });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(d.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as RevealedKeyData;
      setRevealedKey(data.key);
      setShowKey(true);
      await fetchKeyData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate key');
    } finally {
      setGenerating(false);
    }
  }

  async function handleReveal() {
    if (revealedKey) {
      setShowKey((v) => !v);
      return;
    }
    setRevealing(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch('/api/v1/me/api-key/reveal', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token ?? ''}` },
      });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(d.error ?? 'Cannot reveal key');
      }
      const data = (await res.json()) as RevealedKeyData;
      setRevealedKey(data.key);
      setShowKey(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reveal key');
    } finally {
      setRevealing(false);
    }
  }

  // Not signed in
  if (isLoaded && !isSignedIn) {
    return (
      <main className="min-h-screen bg-neutral-50">
        <div className="max-w-6xl mx-auto px-4 py-16 flex flex-col items-center text-center gap-6">
          <div className="rounded-full bg-blue-100 p-5">
            <KeyRound size={32} className="text-[var(--brand-blue)]" aria-hidden />
          </div>
          <h1 className="text-3xl font-extrabold text-[#2a2a2a]">API Keys</h1>
          <p className="text-neutral-500 text-lg max-w-md">
            Sign in to generate and manage your Flagswing API key.
          </p>
          <Link
            href="/sign-in?redirect_url=/developers/api-keys"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-blue)] px-7 py-3.5 text-base font-bold text-white shadow-lg transition hover:bg-[var(--brand-blue-hover)]"
          >
            Sign in to continue
            <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="border-b border-neutral-200 bg-white py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-400 mb-2">
            <Link href="/developers" className="hover:text-[var(--brand-blue)] transition-colors">
              Developers
            </Link>
            <span>/</span>
            <span className="text-neutral-700 font-semibold">API Keys</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#2a2a2a]">API Keys</h1>
          <p className="text-neutral-500 mt-1">
            Manage your Flagswing REST API key and monitor usage.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">
        {/* Error banner */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" aria-hidden />
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-[var(--brand-blue)]" aria-hidden />
          </div>
        )}

        {!loading && (
          <>
            {/* API Key Card */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-blue-50 p-3">
                    <KeyRound size={22} className="text-[var(--brand-blue)]" aria-hidden />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#2a2a2a]">Your API Key</h2>
                    {keyData && (
                      <span
                        className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-bold mt-0.5 ${PLAN_COLORS[keyData.plan] ?? PLAN_COLORS['free']}`}
                      >
                        {PLAN_LABELS[keyData.plan] ?? keyData.plan} Plan
                      </span>
                    )}
                  </div>
                </div>
                {keyData && (
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-700 transition hover:bg-amber-100"
                  >
                    <Crown size={14} aria-hidden />
                    Upgrade Plan
                  </Link>
                )}
              </div>

              {keyData ? (
                <div className="space-y-4">
                  {/* Key display */}
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 flex items-center justify-between gap-4">
                    <code className="font-mono text-sm text-neutral-700 break-all select-all">
                      {showKey && revealedKey ? revealedKey : keyData.key_masked}
                    </code>
                    <div className="flex items-center gap-2 shrink-0">
                      {showKey && revealedKey && <CopyButton text={revealedKey} label="Copy key" />}
                      <button
                        type="button"
                        onClick={() => void handleReveal()}
                        disabled={revealing}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-600 shadow-sm transition hover:bg-neutral-50 disabled:opacity-60"
                        aria-label={showKey ? 'Hide key' : 'Reveal key'}
                      >
                        {revealing ? (
                          <Loader2 size={13} className="animate-spin" aria-hidden />
                        ) : showKey ? (
                          <EyeOff size={13} aria-hidden />
                        ) : (
                          <Eye size={13} aria-hidden />
                        )}
                        {showKey ? 'Hide' : 'Reveal'}
                      </button>
                    </div>
                  </div>

                  {/* Usage bar */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-neutral-500">Today&apos;s usage</span>
                      <span className="text-xs font-bold text-neutral-700">
                        {keyData.requests_today.toLocaleString()} / {keyData.daily_limit.toLocaleString()} requests
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-neutral-200 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--brand-blue)] transition-all"
                        style={{
                          width: `${Math.min(100, (keyData.requests_today / keyData.daily_limit) * 100)}%`,
                        }}
                        role="progressbar"
                        aria-valuenow={keyData.requests_today}
                        aria-valuemax={keyData.daily_limit}
                        aria-label="API requests used today"
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-3 text-center">
                      <BarChart2 size={16} className="mx-auto text-neutral-400 mb-1" aria-hidden />
                      <div className="text-lg font-bold text-neutral-800">
                        {keyData.requests_today.toLocaleString()}
                      </div>
                      <div className="text-xs text-neutral-400">Requests today</div>
                    </div>
                    <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-3 text-center">
                      <BarChart2 size={16} className="mx-auto text-neutral-400 mb-1" aria-hidden />
                      <div className="text-lg font-bold text-neutral-800">
                        {keyData.requests_total.toLocaleString()}
                      </div>
                      <div className="text-xs text-neutral-400">Total requests</div>
                    </div>
                    <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-3 text-center">
                      <KeyRound size={16} className="mx-auto text-neutral-400 mb-1" aria-hidden />
                      <div className="text-sm font-bold text-neutral-800">
                        {new Date(keyData.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-neutral-400">Key created</div>
                    </div>
                  </div>

                  {/* Generate new key */}
                  <div className="border-t border-neutral-100 pt-4">
                    {confirmGenerate ? (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                        <p className="text-sm font-semibold text-amber-800 mb-3">
                          <AlertTriangle size={15} className="inline mr-1.5" aria-hidden />
                          This will invalidate your current key immediately. Are you sure?
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => void handleGenerate()}
                            disabled={generating}
                            className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-amber-700 disabled:opacity-60"
                          >
                            {generating ? (
                              <Loader2 size={14} className="animate-spin" aria-hidden />
                            ) : (
                              <RefreshCw size={14} aria-hidden />
                            )}
                            Yes, generate new key
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmGenerate(false)}
                            className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void handleGenerate()}
                        disabled={generating}
                        className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 shadow-sm transition hover:bg-neutral-50 disabled:opacity-60"
                      >
                        <RefreshCw size={15} aria-hidden />
                        Generate New Key
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* No key yet */
                <div className="text-center py-8">
                  <div className="rounded-full bg-neutral-100 p-4 inline-flex mb-4">
                    <KeyRound size={28} className="text-neutral-400" aria-hidden />
                  </div>
                  <h3 className="text-lg font-bold text-[#2a2a2a] mb-2">No API key yet</h3>
                  <p className="text-neutral-500 text-sm mb-6 max-w-sm mx-auto">
                    Generate your free API key to access flag metadata and higher request limits.
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleGenerate()}
                    disabled={generating}
                    className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-blue)] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[var(--brand-blue-hover)] disabled:opacity-60"
                  >
                    {generating ? (
                      <Loader2 size={16} className="animate-spin" aria-hidden />
                    ) : (
                      <KeyRound size={16} aria-hidden />
                    )}
                    {generating ? 'Generating...' : 'Generate Free API Key'}
                  </button>
                </div>
              )}
            </div>

            {/* Newly revealed key notice */}
            {revealedKey && (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                <h3 className="text-sm font-bold text-green-800 mb-2">
                  Your new API key has been generated!
                </h3>
                <p className="text-xs text-green-700 mb-3">
                  Copy and store it securely. For security, we will not show the full key again.
                </p>
                <div className="flex items-center gap-3 rounded-xl bg-green-100 px-4 py-3">
                  <code className="flex-1 font-mono text-sm text-green-800 break-all select-all">
                    {revealedKey}
                  </code>
                  <CopyButton text={revealedKey} label="Copy" />
                </div>
              </div>
            )}

            {/* Quick reference */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-[#2a2a2a] mb-4">Quick Reference</h2>
              <div className="bg-[#0f172a] rounded-xl p-4 font-mono text-sm text-[#e2e8f0] overflow-x-auto">
                <pre>{`# Pass your API key as a request header
curl -H "X-API-Key: YOUR_KEY" \\
  https://api.flagswing.com/v1/flags/uz`}</pre>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/developers/docs"
                  className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm transition hover:bg-neutral-50"
                >
                  View full docs
                  <ArrowRight size={14} aria-hidden />
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-blue)] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[var(--brand-blue-hover)]"
                >
                  <Crown size={14} aria-hidden />
                  Upgrade plan
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}


