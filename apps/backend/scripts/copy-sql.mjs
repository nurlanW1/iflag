#!/usr/bin/env node
/**
 * Copy SQL files from src/db → dist/db (and src/db/migrations → dist/db/migrations).
 *
 * Run after `tsc`. Keeps the migration runner working when src/ is not deployed.
 */

import { readdirSync, copyFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const srcDbDir = join(root, 'src', 'db');
const distDbDir = join(root, 'dist', 'db');

function ensureDir(p) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

function copySqlIn(srcDir, destDir) {
  if (!existsSync(srcDir)) return 0;
  ensureDir(destDir);
  let count = 0;
  for (const entry of readdirSync(srcDir)) {
    const srcPath = join(srcDir, entry);
    const st = statSync(srcPath);
    if (st.isFile() && entry.endsWith('.sql')) {
      copyFileSync(srcPath, join(destDir, entry));
      count++;
    }
  }
  return count;
}

const topLevel = copySqlIn(srcDbDir, distDbDir);
const migrations = copySqlIn(join(srcDbDir, 'migrations'), join(distDbDir, 'migrations'));

console.log(
  `[copy-sql] copied ${topLevel} schema file(s) + ${migrations} migration file(s) to dist/db/`
);
