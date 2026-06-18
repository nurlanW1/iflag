import { NextResponse } from 'next/server';
import { getDb } from '@/lib/server/db';

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

  return NextResponse.json({ message: "You're on the list!" });
}
