function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function layout(inner: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Flagswing</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f5;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;box-shadow:0 1px 2px rgba(0,0,0,0.05);">
          <tr>
            <td style="padding:28px 28px 8px 28px;">
              <p style="margin:0;font-size:13px;font-weight:700;letter-spacing:0.08em;color:#009ab6;text-transform:uppercase;">Flagswing</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 28px 28px;color:#18181b;font-size:16px;line-height:1.6;">
              ${inner}
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px 28px;border-top:1px solid #f4f4f5;">
              <p style="margin:16px 0 0 0;font-size:12px;color:#71717a;line-height:1.5;">
                You are receiving this email because of activity on your Flagswing account.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function welcomeEmail(userName: string): string {
  const name = escapeHtml(userName.trim() || 'there');
  return layout(`
    <h1 style="margin:0 0 16px 0;font-size:22px;font-weight:800;color:#18181b;">Welcome to Flagswing</h1>
    <p style="margin:0 0 12px 0;">Hi ${name},</p>
    <p style="margin:0 0 12px 0;">Thanks for joining. Your account is ready — explore the catalog and download the assets you need.</p>
    <p style="margin:0;">If you did not create this account, you can ignore this message.</p>
  `);
}

export function verificationEmail(userName: string): string {
  const name = escapeHtml(userName.trim() || 'there');
  return layout(`
    <h1 style="margin:0 0 16px 0;font-size:22px;font-weight:800;color:#18181b;">Account verification</h1>
    <p style="margin:0 0 12px 0;">Hi ${name},</p>
    <p style="margin:0 0 12px 0;">We are confirming that your email address is verified for your Flagswing account. Verified email helps us protect your purchases and keep your account secure.</p>
    <p style="margin:0;">If you have questions, reply to this email or contact support through the site.</p>
  `);
}

export function purchaseEmail(userName: string, productName: string): string {
  const name = escapeHtml(userName.trim() || 'there');
  const product = escapeHtml(productName.trim() || 'your order');
  return layout(`
    <h1 style="margin:0 0 16px 0;font-size:22px;font-weight:800;color:#18181b;">Purchase confirmation</h1>
    <p style="margin:0 0 12px 0;">Hi ${name},</p>
    <p style="margin:0 0 12px 0;">Thank you. This is a placeholder message for <strong>${product}</strong>. Payment and fulfillment details will be included here when billing is connected.</p>
    <p style="margin:0;">When billing is live, you will also see these purchases in your account dashboard on the site.</p>
  `);
}
