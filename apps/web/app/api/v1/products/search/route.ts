import { NextRequest, NextResponse } from "next/server";
import { productsService } from "@/lib/services/products.service";

/**
 * Live product search (Meilisearch + Redis cache, falls back to DB).
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("q") || searchParams.get("search") || "";
    const lang = searchParams.get("lang") || "en";
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!, 10)
      : 10;

    const q = search.trim();
    if (!q) {
      return NextResponse.json({ data: [] });
    }

    const result = await productsService.findAll({
      search: q,
      page: 1,
      limit,
      lang,
      sort: "createdAt",
    });

    return NextResponse.json({ data: result.data ?? [] });
  } catch (error: unknown) {
    const err = error as { status?: number; title?: string; detail?: string; message?: string };
    console.error("❌ [PRODUCTS SEARCH] Error:", error);
    return NextResponse.json(
      {
        type: "https://api.shop.am/problems/internal-error",
        title: err.title || "Internal Server Error",
        status: err.status || 500,
        detail: err.detail || err.message || "An error occurred",
        instance: req.url,
      },
      { status: err.status || 500 }
    );
  }
}
