import { createClerkClient, verifyToken } from '@clerk/backend';
import { NextResponse } from 'next/server';
import {
  getServerAdminAllowlist,
  normalizeAdminEmail,
} from '@/lib/auth/admin-email';

type GateOk = { ok: true; userId: string; email: string };
type GateFail = { ok: false; response: NextResponse };

/**
 * Admin API gate using `Authorization: Bearer <session JWT>` from Clerk `useAuth().getToken()`.
 * Does not use `auth()` or `currentUser()` (no middleware / cookie auth required on the handler).
 */
export async function requireClerkAdminBearerJson(request: Request): Promise<GateOk | GateFail> {
  const secret = process.env.CLERK_SECRET_KEY?.trim();
  if (!secret) {
    console.error('[requireClerkAdminBearerJson] CLERK_SECRET_KEY is not set');
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Clerk is not configured on the server.', code: 'config' },
        { status: 503 }
      ),
    };
  }

  const allow = getServerAdminAllowlist();
  if (!allow.size) {
    console.error('[requireClerkAdminBearerJson] Admin allow-list is empty (set ADMIN_EMAIL on the server)');
    return {
      ok: false,
      response: NextResponse.json({ error: 'Service unavailable', code: 'config' }, { status: 503 }),
    };
  }

  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace(/^Bearer\s+/i, '')?.trim() ?? '';
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Not signed in', code: 'unauthorized' }, { status: 401 }),
    };
  }

  let userId: string;
  try {
    const payload = await verifyToken(token, { secretKey: secret });
    if (!payload?.sub) {
      return {
        ok: false,
        response: NextResponse.json({ error: 'Not signed in', code: 'unauthorized' }, { status: 401 }),
      };
    }
    userId = payload.sub;
  } catch (e) {
    console.error('[requireClerkAdminBearerJson] verifyToken failed:', e);
    return {
      ok: false,
      response: NextResponse.json({ error: 'Not signed in', code: 'unauthorized' }, { status: 401 }),
    };
  }

  let email: string;
  try {
    const clerk = createClerkClient({ secretKey: secret });
    const user = await clerk.users.getUser(userId);
    const primaryId = user.primaryEmailAddressId;
    const primary = user.emailAddresses.find((row) => row.id === primaryId)?.emailAddress;
    email = primary ?? user.emailAddresses[0]?.emailAddress ?? '';
  } catch (e) {
    console.error('[requireClerkAdminBearerJson] users.getUser failed:', e);
    return {
      ok: false,
      response: NextResponse.json({ error: 'Not signed in', code: 'unauthorized' }, { status: 401 }),
    };
  }

  const normalized = normalizeAdminEmail(email);
  if (!normalized || !allow.has(normalized)) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Access denied', code: 'forbidden' }, { status: 403 }),
    };
  }

  return { ok: true, userId, email };
}
