// Seed Admin User Script
// Run this to create the first admin user
// Usage: ts-node src/db/seed-admin.ts

import pool from '../db.js';
import { hashPassword } from '../auth/auth.service.js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function seedAdmin() {
  try {
    // Check if countries table exists, if not, create it
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'countries'
      )
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('Creating countries table...');
      const schemaPath = join(__dirname, 'schema-countries.sql');
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
      console.log('Countries table created successfully');
    }

    // Get admin email from environment or use default
    const adminEmail = process.env.ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456'; // Change this in production!
    const adminName = process.env.ADMIN_NAME || 'Admin User';

    // Check if admin already exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
    if (existing.rows.length > 0) {
      // Update existing user to admin
      const passwordHash = await hashPassword(adminPassword);
      await pool.query(
        'UPDATE users SET role = $1, password_hash = $2 WHERE email = $3',
        ['admin', passwordHash, adminEmail]
      );
      console.log(`Admin user "${adminEmail}" updated successfully`);
      return;
    }

    // Create admin user
    const passwordHash = await hashPassword(adminPassword);
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, role, email_verified, is_active)
       VALUES ($1, $2, $3, 'admin', TRUE, TRUE)
       RETURNING id, email, role`,
      [adminEmail, passwordHash, adminName]
    );

    console.log('Admin user created successfully:');
    console.log(`  Email: ${adminEmail}`);
    console.log(`  Password: ${adminPassword}`);
    console.log(`  Role: ${result.rows[0].role}`);
    console.log('\n⚠️  IMPORTANT: Change the default password after first login!');
  } catch (error) {
    console.error('Error seeding admin user:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedAdmin()
    .then(() => {
      console.log('Seed completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seed failed:', error);
      process.exit(1);
    });
}

export { seedAdmin };
