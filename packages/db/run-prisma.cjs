/**
 * Բեռնում է արմատի .env-ը և գործարկում Prisma CLI (migrate, studio, push, seed).
 * Օգտագործում է npx prisma — աշխատում է Windows-ում և Unix-ում։
 */
require('./load-env.cjs');
const { spawnSync } = require('child_process');
const args = process.argv.slice(2);
const result = spawnSync('npx', ['prisma', ...args], {
  stdio: 'inherit',
  env: process.env,
  shell: true,
});
process.exit(result.status !== null ? result.status : 0);
