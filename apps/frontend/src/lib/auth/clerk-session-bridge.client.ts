/**
 * Client-only guard for Clerk → backend JWT bridge (POST /api/auth/clerk-sync).
 * Prevents duplicate syncs from ClerkSessionBridge, DashboardShell, and React Strict Mode remounts.
 */

export type ClerkBridgeStatus =
  | 'linked'
  | 'synced'
  | 'clerk_disabled'
  | 'rate_limited'
  | 'failed'
  | 'skipped';

export type ClerkBridgeResult = {
  status: ClerkBridgeStatus;
  code?: string;
  error?: string;
};

const SYNCED_KEY = (userId: string) => `flagswing.clerkBridge.synced.${userId}`;
const BACKOFF_KEY = (userId: string) => `flagswing.clerkBridge.backoff.${userId}`;
const POST_ONCE_KEY = (userId: string) => `flagswing.clerkBridge.postOnce.${userId}`;
const SCHEDULED_KEY = (userId: string) => `flagswing.clerkBridge.scheduled.${userId}`;

const BACKOFF_MS = 5 * 60_000;

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

function markBackoff(userId: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(BACKOFF_KEY(userId), String(Date.now() + BACKOFF_MS));
}

function hasPostBeenAttempted(userId: string): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(POST_ONCE_KEY(userId)) != null;
}

function markPostAttempted(userId: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(POST_ONCE_KEY(userId), String(Date.now()));
}

/** Clear cached bridge state (call on sign-out). */
export function clearClerkBridgeClientCache(userId?: string | null): void {
  if (typeof window === 'undefined' || !userId) return;
  sessionStorage.removeItem(SYNCED_KEY(userId));
  sessionStorage.removeItem(BACKOFF_KEY(userId));
  sessionStorage.removeItem(POST_ONCE_KEY(userId));
  sessionStorage.removeItem(SCHEDULED_KEY(userId));
  inFlight.delete(userId);
}

/**
 * Layout-level guard: run bridge at most once per Clerk userId per tab (survives Strict Mode remount).
 */
export function scheduleClerkBackendSessionBridge(userId: string): void {
  if (typeof window === 'undefined') return;
  if (sessionStorage.getItem(SCHEDULED_KEY(userId))) return;
  sessionStorage.setItem(SCHEDULED_KEY(userId), '1');
  void ensureClerkBackendSession(userId).catch(() => {
    /* optional — Clerk Bearer checkout still works without backend cookies */
  });
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

  if (sessionStorage.getItem(SYNCED_KEY(userId)) === '1') {
    const linkJson = await probeSessionLinked();
    if (linkJson.linked) return { status: 'linked' };
    if (linkJson.reason === 'clerk_disabled') return { status: 'clerk_disabled' };
    sessionStorage.removeItem(SYNCED_KEY(userId));
  }

  if (Date.now() < readBackoffUntil(userId)) {
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

  if (hasPostBeenAttempted(userId)) {
    return {
      status: 'skipped',
      code: 'SYNC_ALREADY_ATTEMPTED',
      error: 'Backend link was already attempted this session.',
    };
  }

  markPostAttempted(userId);

  const syncRes = await fetch('/api/auth/clerk-sync', {
    method: 'POST',
    credentials: 'include',
  });

  if (syncRes.status === 429) {
    markBackoff(userId);
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

  markBackoff(userId);
  return {
    status: 'failed',
    code: syncBody.code,
    error: syncBody.error,
  };
}

/**
 * Ensure backend JWT cookies exist for the signed-in Clerk user — at most one POST /clerk-sync per userId per tab session.
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

/** Read-only: whether Clerk email matches backend session (no POST /clerk-sync). */
export async function probeClerkBackendSessionLinked(): Promise<{
  linked: boolean;
  reason?: string;
}> {
  const json = await probeSessionLinked();
  return {
    linked: Boolean(json.linked),
    reason: json.reason,
  };
}
