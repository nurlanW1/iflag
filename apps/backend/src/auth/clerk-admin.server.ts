/**
 * Verify Clerk session JWT + admin allow-list (mirrors Next.js `requireClerkAdminBearerJson`).
 * Used by Express routes that receive `Authorization: Bearer <Clerk token>` from the frontend.
 */

import { createClerkClient, verifyToken } from '@clerk/backend';

const DEFAULT_OWNER_EMAIL = 'nurlanrahmonqulov@gmail.com';

function normalizeEmail(email: string | undefined | null): string {
  return email?.trim().toLowerCase() ?? '';
}

function adminAllowlist(): Set<string> {
  const raw =
    process.env.ADMIN_EMAIL?.trim() ||
    process.env.ADMIN_EMAIL_ALLOWLIST?.trim() ||
    DEFAULT_OWNER_EMAIL;
  const parts = [...new Set(raw.split(/[,;\n]+/).map(normalizeEmail).filter(Boolean))];
  return new Set(parts);
}

export type ClerkAdminGateOk = { ok: true; userId: string; email: string };
export type ClerkAdminGateFail = {
  ok: false;
  status: number;
  error: string;
  code: string;
};

export async function verifyClerkAdminBearer(authHeader: string | undefined): Promise<ClerkAdminGateOk | ClerkAdminGateFail> {
  const secret = process.env.CLERK_SECRET_KEY?.trim();
  if (!secret) {
    console.error('[clerk-admin] CLERK_SECRET_KEY is not set');
    return { ok: false, status: 503, error: 'Clerk is not configured on the API server.', code: 'config' };
  }

  const allow = adminAllowlist();
  if (!allow.size) {
    return { ok: false, status: 503, error: 'Admin allow-list is empty', code: 'config' };
  }

  const token = authHeader?.replace(/^Bearer\s+/i, '')?.trim() ?? '';
  if (!token) {
    return { ok: false, status: 401, error: 'Not signed in', code: 'unauthorized' };
  }

  let userId: string;
  try {
    const payload = await verifyToken(token, { secretKey: secret });
    if (!payload?.sub) {
      return { ok: false, status: 401, error: 'Not signed in', code: 'unauthorized' };
    }
    userId = payload.sub;
  } catch (e) {
    console.error('[clerk-admin] verifyToken failed:', e);
    return { ok: false, status: 401, error: 'Not signed in', code: 'unauthorized' };
  }

  let email: string;
  try {
    const clerk = createClerkClient({ secretKey: secret });
    const user = await clerk.users.getUser(userId);
    const primaryId = user.primaryEmailAddressId;
    email =
      user.emailAddresses.find((row) => row.id === primaryId)?.emailAddress ??
      user.emailAddresses[0]?.emailAddress ??
      '';
  } catch (e) {
    console.error('[clerk-admin] users.getUser failed:', e);
    return { ok: false, status: 401, error: 'Not signed in', code: 'unauthorized' };
  }

  const normalized = normalizeEmail(email);
  if (!normalized || !allow.has(normalized)) {
    return { ok: false, status: 403, error: 'Access denied', code: 'forbidden' };
  }

  return { ok: true, userId, email };
}
