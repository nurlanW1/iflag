import { NextResponse } from 'next/server';
import { getDb } from '@/lib/server/db';
import { sendEmail } from '@/lib/email/send-email';
import { DEFAULT_PUBLIC_CONTACT_EMAIL } from '@/lib/legal/legal-placeholders';
import { SITE_NAME } from '@/lib/seo/site-config';

export const runtime = 'nodejs';

type WaitlistType = 'annual' | 'contributor' | 'newsletter' | 'new_flag' | 'npm-package' | 'figma-plugin';

async function ensureTable(pool: ReturnType<typeof getDb>) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS waitlist (
      id SERIAL PRIMARY KEY,
      email VARCHAR NOT NULL,
      type VARCHAR NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(email, type)
    )
  `);
}

export async function POST(req: Request) {
  const { email, type } = (await req.json()) as { email?: string; type?: WaitlistType };

  if (!email?.trim() || !type) {
    return NextResponse.json({ error: 'email and type required' }, { status: 400 });
  }

  const validTypes: WaitlistType[] = ['annual', 'contributor', 'newsletter', 'new_flag', 'npm-package', 'figma-plugin'];
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  const pool = getDb();
  await ensureTable(pool);

  await pool.query(
    `INSERT INTO waitlist (email, type) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [email.trim().toLowerCase(), type],
  );

  const normalizedEmail = email.trim().toLowerCase();
  const notice = await sendEmail({
    to: DEFAULT_PUBLIC_CONTACT_EMAIL,
    subject: `[${SITE_NAME}] New ${type} signup`,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;line-height:1.55;color:#1f2937">
        <h1 style="font-size:18px;margin:0 0 16px">New ${SITE_NAME} waitlist signup</h1>
        <p><strong>Email:</strong> ${normalizedEmail}</p>
        <p><strong>Type:</strong> ${type}</p>
      </div>
    `,
    tags: [
      { name: 'type', value: 'waitlist' },
      { name: 'site', value: 'flagswing' },
    ],
  });

  if (!notice.ok) {
    console.warn('Waitlist notification email failed:', notice.error);
  }

  return NextResponse.json({ message: "You're on the list!" });
}
