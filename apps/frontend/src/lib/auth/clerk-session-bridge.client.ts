/**
 * Client-only guard for Clerk → backend JWT bridge (POST /api/auth/clerk-sync).
 * Prevents duplicate syncs from ClerkSessionBridge, DashboardShell, and React Strict Mode remounts.
 */

export type ClerkBridgeStatus =
  | 'linked'
  | 'synced'
  | 'clerk_disabled'
  | 'rate_limited'
  | 'failed';

export type ClerkBridgeResult = {
  status: ClerkBridgeStatus;
  code?: string;
  error?: string;
};

const SYNCED_KEY = (userId: string) => `flagswing.clerkBridge.synced.${userId}`;
const BACKOFF_KEY = (userId: string) => `flagswing.clerkBridge.backoff.${userId}`;
const BACKOFF_MS = 60_000;

const inFlight = new Map<string, Promise<ClerkBridgeResult>>();

function readBackoffUntil(userId: string): number {
  if (typeof window === 'undefined') return 0;
  const raw = sessionStorage.getItem(BACKOFF_KEY(userId));
  const n = raw ? Number(raw) : 0;
  return Number.isFinite(n) ? n : 0;
}

function markSynced(userId: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(SYNCED_KEY(userId), '1');
}

/** Clear cached bridge state (call on sign-out). */
export function clearClerkBridgeClientCache(userId?: string | null): void {
  if (typeof window === 'undefined' || !userId) return;
  sessionStorage.removeItem(SYNCED_KEY(userId));
  sessionStorage.removeItem(BACKOFF_KEY(userId));
  inFlight.delete(userId);
}

async function probeSessionLinked(): Promise<{ linked?: boolean; reason?: string }> {
  const res = await fetch('/api/auth/session-linked', {
    cache: 'no-store',
    credentials: 'include',
  });
  return (await res.json()) as { linked?: boolean; reason?: string };
}

async function runBridgeOnce(userId: string): Promise<ClerkBridgeResult> {
  if (typeof window === 'undefined') {
    return { status: 'failed', error: 'Client only' };
  }

  const backoffUntil = readBackoffUntil(userId);
  if (Date.now() < backoffUntil) {
    return { status: 'rate_limited' };
  }

  const linkJson = await probeSessionLinked();
  if (linkJson.reason === 'clerk_disabled') {
    return { status: 'clerk_disabled' };
  }
  if (linkJson.linked) {
    markSynced(userId);
    return { status: 'linked' };
  }

  sessionStorage.removeItem(SYNCED_KEY(userId));

  const syncRes = await fetch('/api/auth/clerk-sync', {
    method: 'POST',
    credentials: 'include',
  });

  if (syncRes.status === 429) {
    sessionStorage.setItem(BACKOFF_KEY(userId), String(Date.now() + BACKOFF_MS));
    return { status: 'rate_limited' };
  }

  const syncBody = (await syncRes.json().catch(() => ({}))) as {
    ok?: boolean;
    alreadyLinked?: boolean;
    error?: string;
    code?: string;
  };

  if (syncRes.ok && (syncBody.ok || syncBody.alreadyLinked)) {
    markSynced(userId);
    return { status: syncBody.alreadyLinked ? 'linked' : 'synced' };
  }

  return {
    status: 'failed',
    code: syncBody.code,
    error: syncBody.error,
  };
}

/**
 * Ensure backend JWT cookies exist for the signed-in Clerk user — at most one POST /clerk-sync per userId at a time.
 */
export function ensureClerkBackendSession(userId: string): Promise<ClerkBridgeResult> {
  const existing = inFlight.get(userId);
  if (existing) return existing;

  const promise = runBridgeOnce(userId).finally(() => {
    inFlight.delete(userId);
  });
  inFlight.set(userId, promise);
  return promise;
}
