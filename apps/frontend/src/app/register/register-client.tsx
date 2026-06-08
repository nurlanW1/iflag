'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { sanitizeCallbackUrl } from '@/lib/auth/callback-url';
import { Flag, Lock, Mail, User, Eye, EyeOff } from 'lucide-react';

function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = sanitizeCallbackUrl(searchParams.get('callbackUrl'), '/dashboard');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(email.trim(), password, fullName.trim() || undefined);
      router.push(callbackUrl);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col lg:flex-row">
      <div
        className="relative flex min-h-[280px] flex-1 items-end p-8 lg:min-h-0 lg:max-w-md lg:items-center"
        style={{
          background: `
            radial-gradient(circle at 20% 30%, rgba(0, 154, 182, 0.85) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(0, 109, 122, 0.9) 0%, transparent 50%),
            linear-gradient(135deg, #1e40af 0%, #2563eb 52%, #172554 100%)
          `,
        }}
      >
        <div className="relative z-10 text-white">
          <div className="mb-4 flex items-center gap-2">
            <Flag size={28} />
            <span className="text-lg font-semibold">Account</span>
          </div>
          <p className="max-w-sm text-sm text-white/90">
            Create an account to save purchases, manage downloads, and access your dashboard.
          </p>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-semibold tracking-tight text-[#2a2a2a]">Create an account</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Already have an account?{' '}
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className="font-semibold text-[var(--brand-blue)] hover:underline"
            >
              Sign in
            </Link>
          </p>
          {error ? (
            <div
              className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {error}
            </div>
          ) : null}
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="reg-name" className="block text-xs font-medium text-neutral-600">
                Name <span className="text-neutral-400">(optional)</span>
              </label>
              <div className="relative mt-1.5">
                <User className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-400" />
                <input
                  id="reg-name"
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-white py-3 pl-10 pr-4 text-[#2a2a2a] outline-none transition focus:border-[var(--brand-blue)] focus:ring-2 focus:ring-[var(--brand-blue)]/15"
                />
              </div>
            </div>
            <div>
              <label htmlFor="reg-email" className="block text-xs font-medium text-neutral-600">
                Email
              </label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-400" />
                <input
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-white py-3 pl-10 pr-4 text-[#2a2a2a] outline-none transition focus:border-[var(--brand-blue)] focus:ring-2 focus:ring-[var(--brand-blue)]/15"
                />
              </div>
            </div>
            <div>
              <label htmlFor="reg-password" className="block text-xs font-medium text-neutral-600">
                Password
              </label>
              <p className="mt-0.5 text-xs text-neutral-400">At least 8 characters (server rule).</p>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-400" />
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-white py-3 pl-10 pr-12 text-[#2a2a2a] outline-none transition focus:border-[var(--brand-blue)] focus:ring-2 focus:ring-[var(--brand-blue)]/15"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[var(--brand-blue)] py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--brand-blue-hover)] disabled:opacity-60"
            >
              {loading ? 'Creating account…' : 'Sign up'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function RegisterClientPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-neutral-400">Loading…</div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
