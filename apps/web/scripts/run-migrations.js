#!/usr/bin/env node

/**
 * Deploys Prisma migrations (manual / release step — not part of production build).
 * Production: migrate deploy only; failures exit non-zero. No db push fallback.
 * Non-production: optional db push fallback for local convenience only.
 */

const { execSync } = require('child_process');
const path = require('path');

const dbPath = path.join(__dirname, '../../../packages/db');
const isProduction = process.env.NODE_ENV === 'production';

process.chdir(dbPath);

try {
  console.log('🔄 Deploying migrations...');
  execSync('npm run db:migrate:deploy', { stdio: 'inherit' });
  console.log('✅ Migrations deployed successfully');
  process.exit(0);
} catch (error) {
  if (isProduction) {
    console.error('❌ Migration deploy failed in production. Set DATABASE_URL and fix migration state.');
    process.exit(1);
  }
  console.log('⚠️  Migration deploy failed, trying db:push (non-production only)...');
  try {
    execSync('npm run db:push', { stdio: 'inherit' });
    console.log('✅ Database schema pushed successfully');
    process.exit(0);
  } catch (pushError) {
    console.error('❌ db:push failed.');
    process.exit(1);
  }
}
