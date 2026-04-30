import { NextResponse } from "next/server";
import { getTableReservationSettingsResolved } from "@/lib/reservations/table-reservation-settings";
import { logger } from "@/lib/utils/logger";

/**
 * Public: allowed reservation time slots and booking window (from admin Settings).
 */
export async function GET() {
  try {
    const data = await getTableReservationSettingsResolved();
    return NextResponse.json({ data });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error("Reservation config GET error", { error });
    return NextResponse.json(
      { type: "internal-error", title: "Internal Server Error", status: 500, detail: msg },
      { status: 500 },
    );
  }
}
