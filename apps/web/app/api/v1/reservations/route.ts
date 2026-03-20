import { NextRequest, NextResponse } from "next/server";
import { db } from "@white-shop/db";
import { logger } from "@/lib/utils/logger";

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
      guestCount,
      note,
      productTitle,
      productImageUrl,
      profitCents,
    } = body;

    if (!tableId || typeof tableId !== "string") {
      return NextResponse.json(
        { type: "validation-error", title: "Validation Error", status: 400, detail: "Field 'tableId' is required" },
        { status: 400 }
      );
    }

    if (!firstName || typeof firstName !== "string" || firstName.trim().length === 0) {
      return NextResponse.json(
        { type: "validation-error", title: "Validation Error", status: 400, detail: "Field 'firstName' is required" },
        { status: 400 }
      );
    }

    if (!lastName || typeof lastName !== "string" || lastName.trim().length === 0) {
      return NextResponse.json(
        { type: "validation-error", title: "Validation Error", status: 400, detail: "Field 'lastName' is required" },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || email.trim().length === 0) {
      return NextResponse.json(
        { type: "validation-error", title: "Validation Error", status: 400, detail: "Field 'email' is required" },
        { status: 400 }
      );
    }

    if (!phone || typeof phone !== "string" || phone.trim().length === 0) {
      return NextResponse.json(
        { type: "validation-error", title: "Validation Error", status: 400, detail: "Field 'phone' is required" },
        { status: 400 }
      );
    }

    if (!date || typeof date !== "string" || date.trim().length === 0) {
      return NextResponse.json(
        { type: "validation-error", title: "Validation Error", status: 400, detail: "Field 'date' is required" },
        { status: 400 }
      );
    }

    if (!time || typeof time !== "string" || time.trim().length === 0) {
      return NextResponse.json(
        { type: "validation-error", title: "Validation Error", status: 400, detail: "Field 'time' is required" },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim();
    if (
      trimmedEmail.length > 254 ||
      trimmedEmail.indexOf("@") < 1 ||
      trimmedEmail.indexOf("@") === trimmedEmail.length - 1 ||
      !trimmedEmail.slice(trimmedEmail.indexOf("@") + 1).includes(".")
    ) {
      return NextResponse.json(
        { type: "validation-error", title: "Validation Error", status: 400, detail: "Invalid email format" },
        { status: 400 }
      );
    }

    const reservation = await db.tableReservation.create({
      data: {
        tableId: tableId.trim(),
        tableLabel: (tableLabel ?? "").trim(),
        tableSeats: Number(tableSeats) || 0,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: trimmedEmail,
        phone: phone.trim(),
        date: date.trim(),
        time: time.trim(),
        guestCount: Number(guestCount) || 1,
        note: note ? String(note).trim() : null,
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
