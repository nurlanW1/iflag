import { NextResponse } from 'next/server';
import { getDb } from '@/lib/server/db';

export const runtime = 'nodejs';

async function ensureTable(pool: ReturnType<typeof getDb>) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS flag_requests (
      id SERIAL PRIMARY KEY,
      query VARCHAR NOT NULL,
      email VARCHAR,
      count INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(query)
    )
  `);
}

export async function POST(req: Request) {
  const { query, email } = (await req.json()) as { query?: string; email?: string };
  if (!query?.trim()) return NextResponse.json({ error: 'query required' }, { status: 400 });

  const pool = getDb();
  await ensureTable(pool);
  await pool.query(
    `INSERT INTO flag_requests (query, email, count)
     VALUES ($1, $2, 1)
     ON CONFLICT (query) DO UPDATE SET count = flag_requests.count + 1`,
    [query.trim().toLowerCase(), email?.trim() || null],
  );
  return NextResponse.json({ message: "We'll notify you when it's added!" });
}
