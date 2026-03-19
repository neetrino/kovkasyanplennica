import { NextRequest, NextResponse } from "next/server";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { spinWheelService } from "@/lib/services/spin-wheel/spin-wheel.service";

function forbiddenResponse(url: string) {
  return NextResponse.json(
    {
      type: "https://api.shop.am/problems/forbidden",
      title: "Forbidden",
      status: 403,
      detail: "Admin access required",
      instance: url,
    },
    { status: 403 }
  );
}

function toApiError(error: unknown, url: string) {
  if (error && typeof error === "object") {
    const customError = error as {
      type?: string;
      title?: string;
      status?: number;
      detail?: string;
      message?: string;
    };
    return {
      type: customError.type || "https://api.shop.am/problems/internal-error",
      title: customError.title || "Internal Server Error",
      status: customError.status || 500,
      detail: customError.detail || customError.message || "An error occurred",
      instance: url,
    };
  }
  return {
    type: "https://api.shop.am/problems/internal-error",
    title: "Internal Server Error",
    status: 500,
    detail: "An error occurred",
    instance: url,
  };
}

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateToken(req);
    if (!user || !requireAdmin(user)) {
      return forbiddenResponse(req.url);
    }
    const result = await spinWheelService.getAdminWins();
    return NextResponse.json(result);
  } catch (error: unknown) {
    const apiError = toApiError(error, req.url);
    return NextResponse.json(apiError, { status: apiError.status });
  }
}
