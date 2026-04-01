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
 * GET /api/v1/admin/vacancies
 */
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateToken(req);
    if (!user || !requireAdmin(user)) {
      return forbidden(req);
    }
    const result = await adminService.getVacancies();
    return NextResponse.json(result);
  } catch (error: unknown) {
    const err = error as { status?: number; detail?: string; message?: string };
    console.error("❌ [ADMIN VACANCIES] GET Error:", error);
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
 * POST /api/v1/admin/vacancies
 */
export async function POST(req: NextRequest) {
  try {
    const user = await authenticateToken(req);
    if (!user || !requireAdmin(user)) {
      return forbidden(req);
    }

    let body: Record<string, unknown>;
    try {
      const raw = await req.text();
      if (!raw.trim()) {
        return NextResponse.json(
          {
            type: "https://api.shop.am/problems/validation-error",
            title: "Validation Error",
            status: 400,
            detail: "Request body is required (JSON)",
            instance: req.url,
          },
          { status: 400 }
        );
      }
      body = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail: "Invalid JSON in request body",
          instance: req.url,
        },
        { status: 400 }
      );
    }
    const title = typeof body.title === "string" ? body.title : "";
    const description = typeof body.description === "string" ? body.description : "";

    if (!title.trim() || !description.trim()) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail: "Fields 'title' and 'description' are required",
          instance: req.url,
        },
        { status: 400 }
      );
    }

    const imageUrl =
      typeof body.imageUrl === "string" ? body.imageUrl : undefined;
    const salary = typeof body.salary === "string" ? body.salary : undefined;
    const location = typeof body.location === "string" ? body.location : undefined;
    const contactPhone =
      typeof body.contactPhone === "string" ? body.contactPhone : undefined;
    const published =
      typeof body.published === "boolean" ? body.published : undefined;

    const result = await adminService.createVacancy({
      title,
      description,
      imageUrl,
      salary,
      location,
      contactPhone,
      published,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    const err = error as { status?: number; detail?: string; message?: string };
    console.error("❌ [ADMIN VACANCIES] POST Error:", error);
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
