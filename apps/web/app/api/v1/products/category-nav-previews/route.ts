import { NextRequest, NextResponse } from "next/server";
import { CATEGORY_NAV_PREVIEW_MAX_SLUGS_PER_REQUEST } from "@/lib/category-nav-preview-limits";
import { PUBLIC_PAGE_REVALIDATE_SECONDS } from "@/lib/cache/public-cache-ttl";
import { getCategoryNavPreviews } from "@/lib/services/products-nav-preview.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lang = searchParams.get("lang") || "en";
    const slugsParam = searchParams.get("slugs") ?? "";
    const slugs = slugsParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (slugs.length === 0) {
      return NextResponse.json({ data: {} });
    }

    if (slugs.length > CATEGORY_NAV_PREVIEW_MAX_SLUGS_PER_REQUEST) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/bad-request",
          title: "Bad Request",
          detail: `At most ${CATEGORY_NAV_PREVIEW_MAX_SLUGS_PER_REQUEST} category slugs allowed`,
        },
        { status: 400 }
      );
    }

    const data = await getCategoryNavPreviews(lang, slugs);

    return NextResponse.json(
      { data },
      {
        headers: {
          "Cache-Control": `public, s-maxage=${PUBLIC_PAGE_REVALIDATE_SECONDS}, stale-while-revalidate=${PUBLIC_PAGE_REVALIDATE_SECONDS}`,
        },
      }
    );
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("❌ [CATEGORY NAV PREVIEWS]", error);
    return NextResponse.json(
      {
        type: "https://api.shop.am/problems/internal-error",
        title: "Internal Server Error",
        status: 500,
        detail: err.message || "An error occurred",
        instance: req.url,
      },
      { status: 500 }
    );
  }
}
