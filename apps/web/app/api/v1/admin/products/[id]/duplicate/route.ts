import { NextRequest, NextResponse } from "next/server";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { adminService } from "@/lib/services/admin.service";

/**
 * POST /api/v1/admin/products/[id]/duplicate
 * Create a copy of the product in draft status with unique title/slug.
 * Returns the new product (201).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateToken(req);
    if (!user || !requireAdmin(user)) {
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

    const { id } = await params;
    const product = await adminService.duplicateProduct(id);
    return NextResponse.json(product, { status: 201 });
  } catch (error: unknown) {
    const err = error as { status?: number; type?: string; title?: string; detail?: string; message?: string };
    console.error("❌ [ADMIN PRODUCTS] POST duplicate Error:", err);
    return NextResponse.json(
      {
        type: err.type || "https://api.shop.am/problems/internal-error",
        title: err.title || "Internal Server Error",
        status: err.status || 500,
        detail: err.detail || err.message || "An error occurred",
        instance: req.url,
      },
      { status: err.status || 500 }
    );
  }
}
