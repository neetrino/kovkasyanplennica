-- AlterTable
ALTER TABLE "table_reservations" ADD COLUMN "bookingGroupId" TEXT;

-- CreateIndex
CREATE INDEX "table_reservations_bookingGroupId_idx" ON "table_reservations"("bookingGroupId");
