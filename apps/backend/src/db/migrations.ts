import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function runMigrations(pool: Pool): Promise<void> {
  try {
    // Check if migrations table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get current migration version
    const result = await pool.query('SELECT MAX(version) as version FROM schema_migrations');
    const currentVersion = result.rows[0]?.version || 0;

    // Read and execute schema.sql if version is 0
    if (currentVersion === 0) {
      const schemaPath = join(__dirname, 'schema.sql');
      const schema = readFileSync(schemaPath, 'utf-8');
      
      // Split by semicolons and execute each statement
      const statements = schema
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.trim()) {
          await pool.query(statement);
        }
      }

      // Record migration
      await pool.query('INSERT INTO schema_migrations (version) VALUES (1)');
      console.log('Database schema initialized successfully');
    }
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}
