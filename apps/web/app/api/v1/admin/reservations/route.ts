import { NextRequest, NextResponse } from "next/server";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { db } from "@white-shop/db";
import { logger } from "@/lib/utils/logger";

/**
 * GET /api/v1/admin/reservations
 * Վերադարձնում է բոլոր սեղանի ամրագրումները (admin only)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateToken(req);
    if (!user || !requireAdmin(user)) {
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
 * PATCH /api/v1/admin/reservations
 * Թարմացնում է ամրագրման status-ը (admin only)
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await authenticateToken(req);
    if (!user || !requireAdmin(user)) {
      return NextResponse.json(
        { type: "forbidden", title: "Forbidden", status: 403, detail: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { type: "validation-error", title: "Validation Error", status: 400, detail: "Fields 'id' and 'status' are required" },
        { status: 400 }
      );
    }

    const VALID_STATUSES = ["pending", "confirmed", "cancelled"];
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { type: "validation-error", title: "Validation Error", status: 400, detail: `Status must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
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
    const user = await authenticateToken(req);
    if (!user || !requireAdmin(user)) {
      return NextResponse.json(
        { type: "forbidden", title: "Forbidden", status: 403, detail: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { type: "validation-error", title: "Validation Error", status: 400, detail: "Field 'ids' must be a non-empty array" },
        { status: 400 }
      );
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
