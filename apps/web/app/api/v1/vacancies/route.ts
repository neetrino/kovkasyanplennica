import { NextRequest, NextResponse } from "next/server";
import { adminService } from "@/lib/services/admin.service";

const VACANCIES_CACHE_SECONDS = 60;

/**
 * GET /api/v1/vacancies
 * Public list of published vacancies
 */
export async function GET(req: NextRequest) {
  try {
    const result = await adminService.getPublishedVacancies();
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": `public, s-maxage=${VACANCIES_CACHE_SECONDS}, stale-while-revalidate=120`,
      },
    });
  } catch (error: unknown) {
    const err = error as { status?: number; detail?: string; message?: string };
    console.error("❌ [VACANCIES] GET Error:", error);
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
