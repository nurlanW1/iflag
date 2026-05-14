/**
 * Transactional email templates.
 *
 * Each template returns `{ subject, text, html }`. We keep the HTML small,
 * inline-styled, and table-free (most modern clients support flexbox in
 * notification emails). Avoid external assets.
 */

import { getMailerConfig } from './mailer.config.js';

export interface RenderedEmail {
  subject: string;
  text: string;
  html: string;
}

function shell(title: string, bodyHtml: string): string {
  const cfg = getMailerConfig();
  const safeAppName = escapeHtml(cfg.appName);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111;">
    <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
      <div style="background:#fff;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
        <h1 style="font-size:18px;margin:0 0 24px 0;color:#111;">${safeAppName}</h1>
        ${bodyHtml}
      </div>
      <p style="text-align:center;color:#888;font-size:12px;margin-top:24px;">
        Sent by ${safeAppName}. If you didn't expect this email, you can safely ignore it.
      </p>
    </div>
  </body>
</html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#39;';
    }
    return c;
  });
}

function button(label: string, url: string): string {
  return `<a href="${escapeHtml(url)}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;">${escapeHtml(label)}</a>`;
}

// ---------------------------------------------------------------------------
// Email verification
// ---------------------------------------------------------------------------

export function renderVerifyEmail(args: {
  fullName?: string | null;
  verifyUrl: string;
  expiresInHours: number;
}): RenderedEmail {
  const cfg = getMailerConfig();
  const subject = `Confirm your email address`;
  const greeting = args.fullName ? `Hi ${args.fullName.split(' ')[0]},` : 'Hi,';

  const text = `${greeting}

Welcome to ${cfg.appName}! Please confirm your email address by visiting the link below:

${args.verifyUrl}

This link expires in ${args.expiresInHours} hours. If you didn't sign up, ignore this email.

— ${cfg.appName}`;

  const html = shell(
    subject,
    `<p style="margin:0 0 16px 0;font-size:15px;">${escapeHtml(greeting)}</p>
     <p style="margin:0 0 24px 0;font-size:15px;line-height:1.5;">Welcome to <strong>${escapeHtml(cfg.appName)}</strong>! Please confirm your email address to activate your account.</p>
     <p style="margin:0 0 24px 0;">${button('Confirm email', args.verifyUrl)}</p>
     <p style="margin:0 0 8px 0;font-size:13px;color:#666;">Or copy this link into your browser:</p>
     <p style="margin:0 0 24px 0;font-size:13px;color:#666;word-break:break-all;"><a href="${escapeHtml(args.verifyUrl)}" style="color:#0070f3;">${escapeHtml(args.verifyUrl)}</a></p>
     <p style="margin:0;font-size:13px;color:#888;">This link expires in ${args.expiresInHours} hours.</p>`
  );

  return { subject, text, html };
}

// ---------------------------------------------------------------------------
// Password reset
// ---------------------------------------------------------------------------

export function renderPasswordResetEmail(args: {
  fullName?: string | null;
  resetUrl: string;
  expiresInMinutes: number;
  ipAddress?: string;
}): RenderedEmail {
  const cfg = getMailerConfig();
  const subject = `Reset your password`;
  const greeting = args.fullName ? `Hi ${args.fullName.split(' ')[0]},` : 'Hi,';
  const ipLine = args.ipAddress
    ? `\n\nThis request came from IP ${args.ipAddress}.`
    : '';

  const text = `${greeting}

Someone (hopefully you) asked to reset the password for your ${cfg.appName} account.

Reset your password here: ${args.resetUrl}

This link expires in ${args.expiresInMinutes} minutes. If you didn't request a reset, ignore this email — your password stays unchanged.${ipLine}

— ${cfg.appName}`;

  const html = shell(
    subject,
    `<p style="margin:0 0 16px 0;font-size:15px;">${escapeHtml(greeting)}</p>
     <p style="margin:0 0 24px 0;font-size:15px;line-height:1.5;">Someone (hopefully you) asked to reset the password on your <strong>${escapeHtml(cfg.appName)}</strong> account.</p>
     <p style="margin:0 0 24px 0;">${button('Reset password', args.resetUrl)}</p>
     <p style="margin:0 0 8px 0;font-size:13px;color:#666;">Or copy this link:</p>
     <p style="margin:0 0 24px 0;font-size:13px;color:#666;word-break:break-all;"><a href="${escapeHtml(args.resetUrl)}" style="color:#0070f3;">${escapeHtml(args.resetUrl)}</a></p>
     <p style="margin:0 0 8px 0;font-size:13px;color:#888;">This link expires in ${args.expiresInMinutes} minutes.</p>
     ${args.ipAddress ? `<p style="margin:0;font-size:13px;color:#888;">Request originated from IP ${escapeHtml(args.ipAddress)}.</p>` : ''}
     <p style="margin:16px 0 0 0;font-size:13px;color:#888;">If you didn't request this, your account is still safe — just ignore this email.</p>`
  );

  return { subject, text, html };
}

// ---------------------------------------------------------------------------
// Password changed notice
// ---------------------------------------------------------------------------

export function renderPasswordChangedEmail(args: {
  fullName?: string | null;
  ipAddress?: string;
  occurredAt: Date;
}): RenderedEmail {
  const cfg = getMailerConfig();
  const subject = `Your password was changed`;
  const greeting = args.fullName ? `Hi ${args.fullName.split(' ')[0]},` : 'Hi,';
  const when = args.occurredAt.toISOString();

  const text = `${greeting}

Your ${cfg.appName} account password was just changed (${when}).

If this wasn't you, please contact support immediately.

— ${cfg.appName}`;

  const html = shell(
    subject,
    `<p style="margin:0 0 16px 0;font-size:15px;">${escapeHtml(greeting)}</p>
     <p style="margin:0 0 16px 0;font-size:15px;line-height:1.5;">Your <strong>${escapeHtml(cfg.appName)}</strong> account password was just changed.</p>
     <p style="margin:0 0 16px 0;font-size:14px;color:#666;">When: ${escapeHtml(when)}</p>
     ${args.ipAddress ? `<p style="margin:0 0 16px 0;font-size:14px;color:#666;">IP: ${escapeHtml(args.ipAddress)}</p>` : ''}
     <p style="margin:0;font-size:14px;color:#c00;">If this wasn't you, please reset your password and contact support.</p>`
  );

  return { subject, text, html };
}
