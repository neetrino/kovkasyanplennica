import { NextRequest, NextResponse } from "next/server";
import { productsService } from "@/lib/services/products.service";

export const dynamic = "force-dynamic";

function normalizeSlug(slug: string): string {
  const trimmed = slug.trim();
  if (!trimmed) {
    return '';
  }
  try {
    return decodeURIComponent(trimmed);
  } catch {
    return trimmed;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { searchParams } = new URL(req.url);
    const lang = searchParams.get("lang") || "en";
    const { slug: rawSlug } = await params;
    const slug = normalizeSlug(rawSlug);
    if (!slug) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/bad-request",
          title: "Bad Request",
          status: 400,
          detail: "Product slug is required",
          instance: req.url,
        },
        { status: 400 }
      );
    }
    const result = await productsService.findBySlug(slug, lang);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("❌ [PRODUCTS] Error:", error);
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

