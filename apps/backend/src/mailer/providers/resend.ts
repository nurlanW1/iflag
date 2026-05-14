/**
 * Resend HTTP API provider.
 * Docs: https://resend.com/docs/api-reference/emails/send-email
 */

interface SendArgs {
  apiKey: string;
  from: string; // formatted: "Name <email@domain>"
  to: string;
  subject: string;
  text: string;
  html: string;
}

interface ResendResponse {
  id?: string;
  message?: string;
  name?: string;
  statusCode?: number;
}

export interface ProviderResult {
  messageId: string | null;
  raw: any;
}

export async function sendWithResend(args: SendArgs): Promise<ProviderResult> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${args.apiKey}`,
    },
    body: JSON.stringify({
      from: args.from,
      to: [args.to],
      subject: args.subject,
      text: args.text,
      html: args.html,
    }),
  });

  const json = (await res.json().catch(() => ({}))) as ResendResponse;
  if (!res.ok) {
    const detail = json?.message || json?.name || `${res.status} ${res.statusText}`;
    throw new Error(`Resend send failed: ${detail}`);
  }
  return { messageId: json.id || null, raw: json };
}
