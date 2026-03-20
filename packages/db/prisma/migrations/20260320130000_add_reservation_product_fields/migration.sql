-- AlterTable
ALTER TABLE "table_reservations" ADD COLUMN IF NOT EXISTS "productTitle" TEXT;
ALTER TABLE "table_reservations" ADD COLUMN IF NOT EXISTS "productImageUrl" TEXT;
