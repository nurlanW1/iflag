import { NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { sendEmail, welcomeEmail } from '@/lib/email';

export const runtime = 'nodejs';

type ClerkEmailAddress = { email_address: string; id?: string };

type ClerkUserCreatedData = {
  id: string;
  email_addresses?: ClerkEmailAddress[];
  primary_email_address_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
};

type ClerkWebhookEvent = {
  type: string;
  data: ClerkUserCreatedData;
};

function pickPrimaryEmail(data: ClerkUserCreatedData): string | null {
  const addrs = data.email_addresses ?? [];
  if (addrs.length === 0) return null;
  const primaryId = data.primary_email_address_id;
  if (primaryId) {
    const match = addrs.find((a) => a.id === primaryId);
    if (match?.email_address) return match.email_address;
  }
  return addrs[0]?.email_address ?? null;
}

function displayName(data: ClerkUserCreatedData): string {
  const full = [data.first_name, data.last_name].filter(Boolean).join(' ').trim();
  if (full) return full;
  if (data.username?.trim()) return data.username.trim();
  return 'there';
}

export async function POST(request: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET?.trim();
  if (!secret) {
    console.error('CLERK_WEBHOOK_SECRET is not set');
    return NextResponse.json({ ok: false, error: 'Webhook not configured' }, { status: 500 });
  }

  const svixId = request.headers.get('svix-id');
  const svixTimestamp = request.headers.get('svix-timestamp');
  const svixSignature = request.headers.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ ok: false, error: 'Missing svix headers' }, { status: 400 });
  }

  const payload = await request.text();

  let evt: ClerkWebhookEvent;
  try {
    const wh = new Webhook(secret);
    evt = wh.verify(payload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkWebhookEvent;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid signature' }, { status: 400 });
  }

  if (evt.type !== 'user.created') {
    return NextResponse.json({ ok: true, ignored: true, type: evt.type });
  }

  const userId = evt.data?.id;
  if (!userId) {
    return NextResponse.json({ ok: false, error: 'Missing user id' }, { status: 400 });
  }

  const to = pickPrimaryEmail(evt.data);
  if (!to) {
    return NextResponse.json({ ok: true, skipped: true, reason: 'no_email' });
  }

  const name = displayName(evt.data);
  const result = await sendEmail({
    to,
    subject: 'Welcome to Flagswing',
    html: welcomeEmail(name),
    idempotencyKey: `welcome-user/${userId}`,
    tags: [
      { name: 'kind', value: 'welcome' },
      { name: 'user_id', value: userId },
    ],
  });

  if (!result.ok) {
    console.error('Welcome email failed:', result.error);
    return NextResponse.json({ ok: false, error: result.error }, { status: 502 });
  }

  return NextResponse.json({ ok: true, emailId: result.id });
}
