#!/usr/bin/env node

/**
 * Runs Prisma generate before build. On Windows, dev server may lock the query engine DLL (EPERM).
 * If generate fails but the client already exists, continue so build can proceed.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../../../packages/db');
const prismaClientDir = path.join(__dirname, '../../../node_modules/.prisma/client');

function clientExists() {
  return (
    fs.existsSync(path.join(prismaClientDir, 'index.js')) ||
    fs.existsSync(path.join(prismaClientDir, 'default.js'))
  );
}

process.chdir(dbPath);

try {
  execSync('npm run db:generate', { stdio: 'inherit' });
  process.exit(0);
} catch (error) {
  if (clientExists()) {
    console.warn(
      '⚠️  Prisma generate skipped (query engine may be locked by `npm run dev`). Using existing client.'
    );
    process.exit(0);
  }
  console.error('❌ Prisma generate failed and no Prisma client found.');
  process.exit(1);
}
