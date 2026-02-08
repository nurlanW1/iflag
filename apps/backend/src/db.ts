import { Pool, PoolConfig } from 'pg';
import { runMigrations } from './db/migrations.js';

const poolConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/flagstock',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

const pool = new Pool(poolConfig);

// Handle pool errors
pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Initialize database on first connection
let migrationsRun = false;
pool.on('connect', async () => {
  if (!migrationsRun) {
    migrationsRun = true;
    try {
      await runMigrations(pool);
    } catch (error) {
      console.error('Failed to run migrations:', error);
    }
  }
});

export default pool;
