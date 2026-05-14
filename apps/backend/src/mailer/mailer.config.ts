/**
 * Mailer configuration.
 *
 * Provider auto-selection:
 *   - If MAIL_PROVIDER is explicitly set, use it.
 *   - Else: RESEND_API_KEY present → "resend", otherwise → "console".
 *
 * `console` provider just logs the email; safe default for dev.
 *
 * To add SMTP later, drop a `smtp` adapter under `mailer/providers/` and
 * register it in `mailer.service.ts`.
 */

export type MailProviderId = 'console' | 'resend';

export interface MailerConfig {
  provider: MailProviderId;
  fromAddress: string;
  fromName: string;
  /** Used in templates to build links (verify, reset, etc.). */
  appName: string;
  publicFrontendUrl: string;
  /** Resend-specific */
  resendApiKey?: string;
}

export function getMailerConfig(): MailerConfig {
  const fromAddress =
    process.env.MAIL_FROM_ADDRESS?.trim() || 'no-reply@example.com';
  const fromName = process.env.MAIL_FROM_NAME?.trim() || 'Flag Stock';
  const appName = process.env.APP_NAME?.trim() || 'Flag Stock Marketplace';
  const publicFrontendUrl =
    process.env.PUBLIC_FRONTEND_URL?.trim() ||
    process.env.FRONTEND_URL?.trim() ||
    'http://localhost:3000';

  const explicit = process.env.MAIL_PROVIDER?.trim() as MailProviderId | undefined;
  const resendApiKey = process.env.RESEND_API_KEY?.trim();

  let provider: MailProviderId = 'console';
  if (explicit === 'console' || explicit === 'resend') {
    provider = explicit;
  } else if (resendApiKey) {
    provider = 'resend';
  }

  return {
    provider,
    fromAddress,
    fromName,
    appName,
    publicFrontendUrl,
    resendApiKey,
  };
}
