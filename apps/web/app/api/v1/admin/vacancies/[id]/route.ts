import { NextRequest, NextResponse } from "next/server";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { adminService } from "@/lib/services/admin.service";

function forbidden(req: NextRequest) {
  return NextResponse.json(
    {
      type: "https://api.shop.am/problems/forbidden",
      title: "Forbidden",
      status: 403,
      detail: "Admin access required",
      instance: req.url,
    },
    { status: 403 }
  );
}

/**
 * PUT /api/v1/admin/vacancies/[id]
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateToken(req);
    if (!user || !requireAdmin(user)) {
      return forbidden(req);
    }

    const { id } = await params;
    const body = (await req.json()) as Record<string, unknown>;

    const payload: {
      title?: string;
      description?: string;
      imageUrl?: string | null;
      salary?: string | null;
      location?: string | null;
      contactPhone?: string | null;
      published?: boolean;
    } = {};

    if (typeof body.title === "string") payload.title = body.title;
    if (typeof body.description === "string") payload.description = body.description;
    if (body.imageUrl === null || typeof body.imageUrl === "string") {
      payload.imageUrl = body.imageUrl;
    }
    if (body.salary === null || typeof body.salary === "string") {
      payload.salary = body.salary;
    }
    if (body.location === null || typeof body.location === "string") {
      payload.location = body.location;
    }
    if (body.contactPhone === null || typeof body.contactPhone === "string") {
      payload.contactPhone = body.contactPhone;
    }
    if (typeof body.published === "boolean") payload.published = body.published;

    const result = await adminService.updateVacancy(id, payload);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const err = error as { status?: number; detail?: string; message?: string };
    console.error("❌ [ADMIN VACANCIES] PUT Error:", error);
    return NextResponse.json(
      {
        type: "https://api.shop.am/problems/internal-error",
        title: "Internal Server Error",
        status: err.status || 500,
        detail: err.detail || err.message || "An error occurred",
        instance: req.url,
      },
      { status: err.status || 500 }
    );
  }
}

/**
 * DELETE /api/v1/admin/vacancies/[id]
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateToken(req);
    if (!user || !requireAdmin(user)) {
      return forbidden(req);
    }

    const { id } = await params;
    await adminService.deleteVacancy(id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as { status?: number; detail?: string; message?: string };
    console.error("❌ [ADMIN VACANCIES] DELETE Error:", error);
    return NextResponse.json(
      {
        type: "https://api.shop.am/problems/internal-error",
        title: "Internal Server Error",
        status: err.status || 500,
        detail: err.detail || err.message || "An error occurred",
        instance: req.url,
      },
      { status: err.status || 500 }
    );
  }
}
