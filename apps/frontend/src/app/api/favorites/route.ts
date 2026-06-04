import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getDb } from '@/lib/server/db';

export const runtime = 'nodejs';

async function ensureTable(pool: ReturnType<typeof getDb>) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_favorites (
      id SERIAL PRIMARY KEY,
      clerk_user_id VARCHAR NOT NULL,
      flag_file_id VARCHAR NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(clerk_user_id, flag_file_id)
    )
  `);
}

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const pool = getDb();
  await ensureTable(pool);
  const { rows } = await pool.query(
    'SELECT flag_file_id FROM user_favorites WHERE clerk_user_id = $1 ORDER BY created_at DESC',
    [user.id],
  );
  return NextResponse.json({ favorites: rows.map((r) => r.flag_file_id) });
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { flagId } = (await req.json()) as { flagId?: string };
  if (!flagId?.trim()) return NextResponse.json({ error: 'flagId required' }, { status: 400 });

  const pool = getDb();
  await ensureTable(pool);
  await pool.query(
    'INSERT INTO user_favorites (clerk_user_id, flag_file_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [user.id, flagId.trim()],
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { flagId } = (await req.json()) as { flagId?: string };
  if (!flagId?.trim()) return NextResponse.json({ error: 'flagId required' }, { status: 400 });

  const pool = getDb();
  await pool.query(
    'DELETE FROM user_favorites WHERE clerk_user_id = $1 AND flag_file_id = $2',
    [user.id, flagId.trim()],
  );
  return NextResponse.json({ ok: true });
}
