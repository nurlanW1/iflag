import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sendEmail, welcomeEmail } from '@/lib/email';

export const runtime = 'nodejs';

const bodySchema = z.object({
  email: z.string().email().max(320),
});

function isTestEmailAuthorized(request: Request): boolean {
  if (process.env.NODE_ENV !== 'production') return true;
  const secret = process.env.EMAIL_TEST_SECRET?.trim();
  if (!secret) return false;
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!isTestEmailAuthorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'Forbidden. In production, set EMAIL_TEST_SECRET and send header Authorization: Bearer <secret>.',
      },
      { status: 403 }
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Body must include a valid "email" field' }, { status: 400 });
  }

  const { email } = parsed.data;
  const userLabel = email.split('@')[0] || 'there';

  const result = await sendEmail({
    to: email,
    subject: 'Welcome to Flagswing',
    html: welcomeEmail(userLabel),
    idempotencyKey: `email-test/${email.toLowerCase()}`,
    tags: [{ name: 'kind', value: 'test' }],
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 502 });
  }

  return NextResponse.json({ ok: true, id: result.id });
}
