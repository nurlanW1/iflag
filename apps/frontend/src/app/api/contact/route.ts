import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sendEmail } from '@/lib/email/send-email';
import { DEFAULT_PUBLIC_CONTACT_EMAIL } from '@/lib/legal/legal-placeholders';
import { SITE_NAME } from '@/lib/seo/site-config';

export const runtime = 'nodejs';

const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  subject: z.string().trim().min(3).max(160),
  message: z.string().trim().min(10).max(5000),
});

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function POST(req: Request) {
  let payload: unknown;

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Please check the contact form fields.' }, { status: 400 });
  }

  const { name, email, subject, message } = parsed.data;

  const result = await sendEmail({
    to: DEFAULT_PUBLIC_CONTACT_EMAIL,
    subject: `[${SITE_NAME}] ${subject}`,
    replyTo: email,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;line-height:1.55;color:#1f2937">
        <h1 style="font-size:18px;margin:0 0 16px">New ${SITE_NAME} support message</h1>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
        <div style="margin-top:16px;padding:16px;border:1px solid #e5e7eb;border-radius:12px;background:#f9fafb;white-space:pre-wrap">${escapeHtml(message)}</div>
      </div>
    `,
    tags: [
      { name: 'type', value: 'contact-form' },
      { name: 'site', value: 'flagswing' },
    ],
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 503 });
  }

  return NextResponse.json({ ok: true, message: 'Message sent.' });
}
