ALTER TABLE "table_reservations"
ADD COLUMN IF NOT EXISTS "occasion" TEXT NOT NULL DEFAULT 'regular';
