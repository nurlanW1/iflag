'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { sanitizeCallbackUrl } from '@/lib/auth/callback-url';
import { Flag, Lock, Mail, Eye, EyeOff } from 'lucide-react';

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = sanitizeCallbackUrl(searchParams.get('callbackUrl'), '/dashboard');

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
      await login(email.trim(), password);
      router.push(callbackUrl);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
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
            linear-gradient(135deg, #004d5a 0%, #009ab6 50%, #00363f 100%)
          `,
        }}
      >
        <div className="relative z-10 text-white">
          <div className="mb-4 flex items-center gap-2">
            <Flag size={28} />
            <span className="text-lg font-black">Account</span>
          </div>
          <p className="max-w-sm text-sm text-white/90">
            Sign in to access your dashboard, downloads, and subscription tools.
          </p>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-black text-gray-900">Sign in</h1>
          <p className="mt-2 text-sm text-gray-600">
            New here?{' '}
            <Link href="/register" className="font-semibold text-[#009ab6] hover:underline">
              Create an account
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
              <label htmlFor="login-email" className="block text-xs font-medium text-gray-700">
                Email
              </label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-400" />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border-2 border-gray-200 py-3 pl-10 pr-4 text-gray-900 outline-none transition focus:border-[#009ab6] focus:ring-4 focus:ring-[#009ab6]/15"
                />
              </div>
            </div>
            <div>
              <label htmlFor="login-password" className="block text-xs font-medium text-gray-700">
                Password
              </label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-400" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border-2 border-gray-200 py-3 pl-10 pr-12 text-gray-900 outline-none transition focus:border-[#009ab6] focus:ring-4 focus:ring-[#009ab6]/15"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#009ab6] py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-[#007a8a] disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginClientPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-gray-500">Loading…</div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
