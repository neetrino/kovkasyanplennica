import { NextRequest, NextResponse } from "next/server";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { db } from "@white-shop/db";
import { logger } from "@/lib/utils/logger";
import { hasReservationConflict, normalizeReservationOccasion } from "@/lib/reservations/availability";

function validationError(detail: string) {
  return NextResponse.json(
    { type: "validation-error", title: "Validation Error", status: 400, detail },
    { status: 400 }
  );
}

async function authenticateAdmin(req: NextRequest) {
  const user = await authenticateToken(req);
  if (!user || !requireAdmin(user)) {
    return null;
  }
  return user;
}

/**
 * GET /api/v1/admin/reservations
 * Վերադարձնում է բոլոր սեղանի ամրագրումները (admin only)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateAdmin(req);
    if (!user) {
      return NextResponse.json(
        { type: "forbidden", title: "Forbidden", status: 403, detail: "Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;
    const status = searchParams.get("status") ?? undefined;

    const where = status ? { status } : {};

    const [reservations, total] = await Promise.all([
      db.tableReservation.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.tableReservation.count({ where }),
    ]);

    return NextResponse.json({
      data: reservations,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error("Admin reservations GET error", { error });
    return NextResponse.json(
      { type: "internal-error", title: "Internal Server Error", status: 500, detail: msg },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/admin/reservations
 * Ստեղծում է նոր ամրագրում admin panel-ից (admin only)
 */
export async function POST(req: NextRequest) {
  try {
    const user = await authenticateAdmin(req);
    if (!user) {
      return NextResponse.json(
        { type: "forbidden", title: "Forbidden", status: 403, detail: "Admin access required" },
        { status: 403 }
      );
    }

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
      occasion,
      productTitle,
      productImageUrl,
      profitCents,
    } = body;

    if (!tableId || typeof tableId !== "string") {
      return validationError("Field 'tableId' is required");
    }
    if (!firstName || typeof firstName !== "string" || firstName.trim().length === 0) {
      return validationError("Field 'firstName' is required");
    }
    if (!lastName || typeof lastName !== "string" || lastName.trim().length === 0) {
      return validationError("Field 'lastName' is required");
    }
    if (!email || typeof email !== "string" || email.trim().length === 0) {
      return validationError("Field 'email' is required");
    }
    if (!phone || typeof phone !== "string" || phone.trim().length === 0) {
      return validationError("Field 'phone' is required");
    }
    if (!date || typeof date !== "string" || date.trim().length === 0) {
      return validationError("Field 'date' is required");
    }
    if (!time || typeof time !== "string" || time.trim().length === 0) {
      return validationError("Field 'time' is required");
    }

    const normalizedOccasion = normalizeReservationOccasion(occasion);
    if (normalizedOccasion == null) {
      return validationError("Field 'occasion' must be one of: birthday, regular");
    }

    const trimmedEmail = email.trim();
    if (
      trimmedEmail.length > 254 ||
      trimmedEmail.indexOf("@") < 1 ||
      trimmedEmail.indexOf("@") === trimmedEmail.length - 1 ||
      !trimmedEmail.slice(trimmedEmail.indexOf("@") + 1).includes(".")
    ) {
      return validationError("Invalid email format");
    }

    const trimmedTableId = tableId.trim();
    const trimmedDate = date.trim();
    const trimmedTime = time.trim();
    const existingReservations = await db.tableReservation.findMany({
      where: {
        tableId: trimmedTableId,
        date: trimmedDate,
        status: { not: "cancelled" },
      },
      select: {
        status: true,
        time: true,
        occasion: true,
      },
    });

    if (hasReservationConflict(trimmedTime, normalizedOccasion, existingReservations)) {
      return NextResponse.json(
        {
          type: "conflict",
          title: "Reservation Conflict",
          status: 409,
          detail: "Selected time is unavailable for this table",
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
        guestCount: Number(guestCount) || 1,
        note: note ? String(note).trim() : null,
        occasion: normalizedOccasion,
        status: "pending",
        productTitle: productTitle != null && typeof productTitle === "string" ? productTitle.trim() || null : null,
        productImageUrl: productImageUrl != null && typeof productImageUrl === "string" ? productImageUrl.trim() || null : null,
        profitCents: typeof profitCents === "number" && Number.isFinite(profitCents) ? Math.round(profitCents) : null,
      },
    });

    return NextResponse.json({ data: reservation }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error("Admin reservations POST error", { error });
    return NextResponse.json(
      { type: "internal-error", title: "Internal Server Error", status: 500, detail: msg },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v1/admin/reservations
 * Թարմացնում է ամրագրման status-ը (admin only)
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await authenticateAdmin(req);
    if (!user) {
      return NextResponse.json(
        { type: "forbidden", title: "Forbidden", status: 403, detail: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return validationError("Fields 'id' and 'status' are required");
    }

    const VALID_STATUSES = ["pending", "confirmed", "cancelled"];
    if (!VALID_STATUSES.includes(status)) {
      return validationError(`Status must be one of: ${VALID_STATUSES.join(", ")}`);
    }

    const reservation = await db.tableReservation.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ data: reservation });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error("Admin reservations PATCH error", { error });
    return NextResponse.json(
      { type: "internal-error", title: "Internal Server Error", status: 500, detail: msg },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/admin/reservations
 * Ջնջում է ամրագրումները (admin only)
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await authenticateAdmin(req);
    if (!user) {
      return NextResponse.json(
        { type: "forbidden", title: "Forbidden", status: 403, detail: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return validationError("Field 'ids' must be a non-empty array");
    }

    const { count } = await db.tableReservation.deleteMany({
      where: { id: { in: ids } },
    });

    return NextResponse.json({ data: { deleted: count } });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error("Admin reservations DELETE error", { error });
    return NextResponse.json(
      { type: "internal-error", title: "Internal Server Error", status: 500, detail: msg },
      { status: 500 }
    );
  }
}
