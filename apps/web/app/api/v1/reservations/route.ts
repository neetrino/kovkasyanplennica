import { NextRequest, NextResponse } from "next/server";
import { db } from "@white-shop/db";
import { logger } from "@/lib/utils/logger";
import {
  hasReservationTimeRangeConflict,
  isPastTimeSlotForDate,
  normalizeReservationOccasion,
  reservationIntervalToMinutes,
  type ReservationBusyInterval,
} from "@/lib/reservations/availability";
import { RESERVATION_TIME_SLOTS } from "@/lib/reservations/time-slots";

const SLOT_SET = new Set<string>(RESERVATION_TIME_SLOTS as unknown as string[]);

function reservationValidationError(detail: string) {
  return NextResponse.json(
    { type: "validation-error", title: "Validation Error", status: 400, detail },
    { status: 400 }
  );
}

function isValidSlotPair(time: string, timeEnd: string): boolean {
  if (!SLOT_SET.has(time) || !SLOT_SET.has(timeEnd)) return false;
  return reservationIntervalToMinutes(time, timeEnd) != null;
}

async function getExistingReservations(tableId: string, date: string) {
  return db.tableReservation.findMany({
    where: {
      tableId,
      date,
      status: { not: "cancelled" },
    },
    select: {
      status: true,
      time: true,
      timeEnd: true,
    },
  });
}

function toBusyIntervals(
  rows: readonly { status: string; time: string; timeEnd: string | null }[],
): ReservationBusyInterval[] {
  const out: ReservationBusyInterval[] = [];
  for (const r of rows) {
    if (r.status === "cancelled") continue;
    if (r.timeEnd == null || r.timeEnd.trim() === "") continue;
    if (reservationIntervalToMinutes(r.time, r.timeEnd) == null) continue;
    out.push({ time: r.time, timeEnd: r.timeEnd });
  }
  return out;
}

/**
 * GET /api/v1/reservations?tableId=...&date=...
 * Returns busy [time, timeEnd) intervals for the table on that date.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tableId = searchParams.get("tableId")?.trim() ?? "";
    const date = searchParams.get("date")?.trim() ?? "";

    if (!tableId) {
      return reservationValidationError("Query param 'tableId' is required");
    }
    if (!date) {
      return reservationValidationError("Query param 'date' is required");
    }

    const existingReservations = await getExistingReservations(tableId, date);
    const busyIntervals = toBusyIntervals(existingReservations);

    return NextResponse.json({
      data: { busyIntervals },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error("Reservation availability GET error", { error });
    return NextResponse.json(
      { type: "internal-error", title: "Internal Server Error", status: 500, detail: msg },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/reservations
 * Ստեղծում է սեղանի ամրագրում
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tableId,
      tableLabel,
      tableSeats,
      firstName,
      lastName,
      email,
      phone,
      date,
      time,
      timeEnd,
      guestCount,
      note,
      occasion,
      productTitle,
      productImageUrl,
      profitCents,
    } = body;

    if (!tableId || typeof tableId !== "string") {
      return reservationValidationError("Field 'tableId' is required");
    }

    if (!firstName || typeof firstName !== "string" || firstName.trim().length === 0) {
      return reservationValidationError("Field 'firstName' is required");
    }

    if (!lastName || typeof lastName !== "string" || lastName.trim().length === 0) {
      return reservationValidationError("Field 'lastName' is required");
    }

    if (!email || typeof email !== "string" || email.trim().length === 0) {
      return reservationValidationError("Field 'email' is required");
    }

    if (!phone || typeof phone !== "string" || phone.trim().length === 0) {
      return reservationValidationError("Field 'phone' is required");
    }

    if (!date || typeof date !== "string" || date.trim().length === 0) {
      return reservationValidationError("Field 'date' is required");
    }

    if (!time || typeof time !== "string" || time.trim().length === 0) {
      return reservationValidationError("Field 'time' is required");
    }

    if (!timeEnd || typeof timeEnd !== "string" || timeEnd.trim().length === 0) {
      return reservationValidationError("Field 'timeEnd' is required");
    }

    const trimmedTime = time.trim();
    const trimmedTimeEnd = timeEnd.trim();
    if (!isValidSlotPair(trimmedTime, trimmedTimeEnd)) {
      return reservationValidationError("Invalid time range: use on-the-hour or half-hour slots with end after start");
    }

    const occasionInput = occasion === undefined || occasion === null || occasion === "" ? "regular" : occasion;
    const normalizedOccasion = normalizeReservationOccasion(occasionInput);
    if (normalizedOccasion == null) {
      return reservationValidationError("Field 'occasion' must be one of: birthday, regular");
    }

    const trimmedEmail = email.trim();
    if (
      trimmedEmail.length > 254 ||
      trimmedEmail.indexOf("@") < 1 ||
      trimmedEmail.indexOf("@") === trimmedEmail.length - 1 ||
      !trimmedEmail.slice(trimmedEmail.indexOf("@") + 1).includes(".")
    ) {
      return reservationValidationError("Invalid email format");
    }

    const trimmedTableId = tableId.trim();
    const trimmedDate = date.trim();
    if (isPastTimeSlotForDate(trimmedDate, trimmedTime)) {
      return reservationValidationError("Selected date/time is in the past");
    }
    const existingReservations = await getExistingReservations(trimmedTableId, trimmedDate);
    if (
      hasReservationTimeRangeConflict(trimmedTime, trimmedTimeEnd, existingReservations, RESERVATION_TIME_SLOTS)
    ) {
      return NextResponse.json(
        {
          type: "conflict",
          title: "Reservation Conflict",
          status: 409,
          detail: "Selected time range is unavailable for this table",
        },
        { status: 409 }
      );
    }

    const reservation = await db.tableReservation.create({
      data: {
        tableId: trimmedTableId,
        tableLabel: (tableLabel ?? "").trim(),
        tableSeats: Number(tableSeats) || 0,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: trimmedEmail,
        phone: phone.trim(),
        date: trimmedDate,
        time: trimmedTime,
        timeEnd: trimmedTimeEnd,
        guestCount: Number(guestCount) || 1,
        note: note ? String(note).trim() : null,
        occasion: normalizedOccasion,
        status: "pending",
        productTitle: productTitle != null && typeof productTitle === "string" ? productTitle.trim() || null : null,
        productImageUrl: productImageUrl != null && typeof productImageUrl === "string" ? productImageUrl.trim() || null : null,
        profitCents: typeof profitCents === "number" && Number.isFinite(profitCents) ? Math.round(profitCents) : null,
      },
    });

    logger.info("Table reservation created", { id: reservation.id, tableId: reservation.tableId });

    return NextResponse.json({ data: reservation }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error("Table reservation creation error", { error });
    return NextResponse.json(
      { type: "internal-error", title: "Internal Server Error", status: 500, detail: msg },
      { status: 500 }
    );
  }
}
