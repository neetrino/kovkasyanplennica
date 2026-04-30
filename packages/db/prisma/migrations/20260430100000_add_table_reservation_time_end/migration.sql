-- AlterTable
ALTER TABLE "table_reservations" ADD COLUMN "timeEnd" TEXT;

-- Backfill end time from legacy occasion-based duration (clock time on reservation day)
UPDATE "table_reservations"
SET "timeEnd" = to_char(
  (("date"::date + ("time")::time) + CASE WHEN "occasion" = 'birthday' THEN interval '6 hours' ELSE interval '2 hours' END)::time,
  'HH24:MI'
);

ALTER TABLE "table_reservations" ALTER COLUMN "timeEnd" SET NOT NULL;
