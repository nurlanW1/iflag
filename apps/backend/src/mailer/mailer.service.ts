/**
 * Mailer service — single entry point for sending transactional emails.
 *
 *   await sendMail({ to, template: 'verify-email', subject, text, html });
 *
 * - Persists every attempt to `email_outbox`.
 * - Picks a provider via `getMailerConfig()`.
 * - Console provider logs to stdout (dev). Resend provider posts to its HTTP API.
 *
 * Add new providers by:
 *   1. Writing `mailer/providers/<name>.ts` exporting `sendWith<Name>`.
 *   2. Branching in `dispatchToProvider()`.
 *   3. Updating `MailProviderId` in `mailer.config.ts`.
 */

import pool from '../db.js';
import { getMailerConfig, type MailerConfig } from './mailer.config.js';
import { sendWithResend } from './providers/resend.js';

export interface SendMailInput {
  to: string;
  toName?: string;
  subject: string;
  text: string;
  html: string;
  /** Template id for logging/analytics (e.g. "verify-email"). */
  template: string;
  metadata?: Record<string, unknown>;
}

export interface SendMailResult {
  outboxId: string;
  status: 'sent' | 'skipped' | 'failed';
  provider: string;
  providerMessageId: string | null;
  error?: string;
}

function formatFrom(cfg: MailerConfig): string {
  return cfg.fromName
    ? `${cfg.fromName.replace(/[<>]/g, '')} <${cfg.fromAddress}>`
    : cfg.fromAddress;
}

async function logOutbox(input: SendMailInput, cfg: MailerConfig): Promise<string> {
  const res = await pool.query(
    `INSERT INTO email_outbox (
        to_email, to_name, subject, template, body_text, body_html,
        provider, status, metadata
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,'pending',$8)
      RETURNING id`,
    [
      input.to,
      input.toName || null,
      input.subject,
      input.template,
      input.text,
      input.html,
      cfg.provider,
      JSON.stringify(input.metadata || {}),
    ]
  );
  return res.rows[0].id as string;
}

async function markOutbox(
  id: string,
  status: 'sent' | 'failed' | 'skipped',
  fields: { providerMessageId?: string | null; error?: string | null } = {}
): Promise<void> {
  await pool.query(
    `UPDATE email_outbox
        SET status = $2,
            provider_message_id = $3,
            error_message = $4,
            attempts = email_outbox.attempts + 1,
            sent_at = CASE WHEN $2 = 'sent' THEN CURRENT_TIMESTAMP ELSE sent_at END
      WHERE id = $1`,
    [
      id,
      status,
      fields.providerMessageId || null,
      fields.error ? fields.error.slice(0, 4000) : null,
    ]
  );
}

async function dispatchToProvider(
  cfg: MailerConfig,
  input: SendMailInput
): Promise<{ messageId: string | null }> {
  const from = formatFrom(cfg);

  if (cfg.provider === 'resend') {
    if (!cfg.resendApiKey) {
      throw new Error('Resend provider selected but RESEND_API_KEY is not set');
    }
    const r = await sendWithResend({
      apiKey: cfg.resendApiKey,
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
    return { messageId: r.messageId };
  }

  // console provider (default)
  /* eslint-disable no-console */
  console.log('---------- [mailer:console] ----------');
  console.log('From:    ', from);
  console.log('To:      ', input.toName ? `${input.toName} <${input.to}>` : input.to);
  console.log('Subject: ', input.subject);
  console.log('Template:', input.template);
  console.log('--- text ---');
  console.log(input.text);
  console.log('--------------------------------------');
  /* eslint-enable no-console */
  return { messageId: `console-${Date.now()}` };
}

/**
 * Main send function. Returns a result even on failure (status='failed'),
 * unless `throwOnFailure` is set.
 */
export async function sendMail(
  input: SendMailInput,
  options: { throwOnFailure?: boolean } = {}
): Promise<SendMailResult> {
  const cfg = getMailerConfig();
  const outboxId = await logOutbox(input, cfg);

  try {
    const { messageId } = await dispatchToProvider(cfg, input);
    await markOutbox(outboxId, 'sent', { providerMessageId: messageId });
    return {
      outboxId,
      status: 'sent',
      provider: cfg.provider,
      providerMessageId: messageId,
    };
  } catch (err: any) {
    const message = err?.message || 'unknown send error';
    await markOutbox(outboxId, 'failed', { error: message });
    console.error('[mailer] send failed:', message);
    if (options.throwOnFailure) throw err;
    return {
      outboxId,
      status: 'failed',
      provider: cfg.provider,
      providerMessageId: null,
      error: message,
    };
  }
}
