'use client';

import { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';

type WaitlistType = 'npm-package' | 'figma-plugin';

interface WaitlistFormProps {
  type: WaitlistType;
  placeholder?: string;
  buttonLabel?: string;
}

export default function WaitlistForm({
  type,
  placeholder = 'you@example.com',
  buttonLabel = 'Notify me',
}: WaitlistFormProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, email: email.trim() }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error || 'Failed to join waitlist');
      }
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  if (status === 'success') {
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
        <CheckCircle2 size={18} aria-hidden />
        {"You're on the list! We'll notify you when it's ready."}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={placeholder}
        className="flex-1 min-w-[200px] rounded-xl border border-neutral-200 px-4 py-2.5 text-sm focus:border-[var(--brand-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]/20"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="flex items-center gap-2 rounded-xl bg-[var(--brand-blue)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--brand-blue-hover)] disabled:opacity-60"
      >
        <Send size={14} aria-hidden />
        {status === 'loading' ? 'Sending...' : buttonLabel}
      </button>
      {status === 'error' && (
        <p className="w-full text-xs text-red-600">{errorMsg}</p>
      )}
    </form>
  );
}
