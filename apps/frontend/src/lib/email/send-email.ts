import 'server-only';

import { Resend } from 'resend';
import { z } from 'zod';

const DEFAULT_FROM = 'Flagswing <noreply@mail.flagswing.com>';

const fromAddress = () => process.env.RESEND_FROM?.trim() || DEFAULT_FROM;

const toListSchema = z.array(z.string().email()).min(1).max(50);

let resendSingleton: Resend | null = null;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  if (!resendSingleton) resendSingleton = new Resend(key);
  return resendSingleton;
}

export type SendEmailParams = {
  to: string | string[];
  subject: string;
  html: string;
  idempotencyKey?: string;
  tags?: { name: string; value: string }[];
};

export type SendEmailResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

function normalizeTo(to: string | string[]): string[] {
  const list = Array.isArray(to) ? to : [to];
  return list.map((e) => e.trim()).filter(Boolean);
}

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const subject = params.subject.trim();
  if (!subject) {
    return { ok: false, error: 'Subject is required' };
  }

  const html = params.html.trim();
  if (!html) {
    return { ok: false, error: 'HTML body is required' };
  }

  const parsedTo = toListSchema.safeParse(normalizeTo(params.to));
  if (!parsedTo.success) {
    return { ok: false, error: 'Invalid recipient email address' };
  }

  const resend = getResend();
  if (!resend) {
    return { ok: false, error: 'Email is not configured (RESEND_API_KEY missing)' };
  }

  const { data, error } = await resend.emails.send(
    {
      from: fromAddress(),
      to: parsedTo.data,
      subject,
      html,
      ...(params.tags?.length ? { tags: params.tags } : {}),
    },
    params.idempotencyKey?.trim()
      ? { idempotencyKey: params.idempotencyKey.trim() }
      : undefined
  );

  if (error) {
    return { ok: false, error: error.message || 'Failed to send email' };
  }

  if (!data?.id) {
    return { ok: false, error: 'No message id returned from provider' };
  }

  return { ok: true, id: data.id };
}
