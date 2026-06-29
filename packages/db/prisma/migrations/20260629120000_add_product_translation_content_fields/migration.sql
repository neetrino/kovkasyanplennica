-- AlterTable
ALTER TABLE "product_translations" ADD COLUMN IF NOT EXISTS "ingredients" TEXT;
ALTER TABLE "product_translations" ADD COLUMN IF NOT EXISTS "longDescriptionHtml" TEXT;
