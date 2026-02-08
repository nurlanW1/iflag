import pool from './db.js';

export interface Flag {
  id: string;
  name: string;
  imageUrl: string;
  description: string;
}

export async function getAllFlags(): Promise<Flag[]> {
  const res = await pool.query('SELECT * FROM flags ORDER BY name');
  return res.rows;
}

export async function getFlagById(id: string): Promise<Flag | null> {
  const res = await pool.query('SELECT * FROM flags WHERE id = $1', [id]);
  return res.rows[0] || null;
}
