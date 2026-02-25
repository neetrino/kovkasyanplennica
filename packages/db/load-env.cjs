/**
 * Բեռնում է monorepo արմատի .env-ը, որպեսզի Prisma CLI (migrate, studio, push) տեսնի DATABASE_URL.
 * Prisma-ն լռելյայն փնտրում է .env միայն packages/db/-ում, իսկ մենք պահում ենք .env արմատում։
 */
const path = require('path');
const rootEnv = path.resolve(__dirname, '../../.env');
require('dotenv').config({ path: rootEnv });
