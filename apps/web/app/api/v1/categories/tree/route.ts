import { NextRequest, NextResponse } from "next/server";
import { CATALOG_REDIS_TTL_SECONDS } from "@/lib/cache/public-cache-ttl";
import { categoriesService } from "@/lib/services/categories.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lang = searchParams.get("lang") || "en";
    const result = await categoriesService.getTree(lang);
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": `public, s-maxage=${CATALOG_REDIS_TTL_SECONDS}, stale-while-revalidate=${CATALOG_REDIS_TTL_SECONDS}`,
      },
    });
  } catch (error: any) {
    console.error("❌ [CATEGORIES] Error:", error);
    return NextResponse.json(
      {
        type: error.type || "https://api.shop.am/problems/internal-error",
        title: error.title || "Internal Server Error",
        status: error.status || 500,
        detail: error.detail || error.message || "An error occurred",
        instance: req.url,
      },
      { status: error.status || 500 }
    );
  }
}

