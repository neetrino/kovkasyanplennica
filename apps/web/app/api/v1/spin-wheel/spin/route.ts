import { NextRequest, NextResponse } from "next/server";
import { authenticateToken } from "@/lib/middleware/auth";
import { spinWheelService } from "@/lib/services/spin-wheel/spin-wheel.service";

const SPIN_WHEEL_GUEST_COOKIE = "spin_wheel_guest_id";

function resolveSpinParticipantId(req: NextRequest, userId: string | null) {
  if (userId) {
    return { participantId: userId, guestIdForCookie: null as string | null };
  }
  const existingGuestId = req.cookies.get(SPIN_WHEEL_GUEST_COOKIE)?.value;
  if (existingGuestId) {
    return { participantId: `guest:${existingGuestId}`, guestIdForCookie: null as string | null };
  }
  const newGuestId = crypto.randomUUID();
  return { participantId: `guest:${newGuestId}`, guestIdForCookie: newGuestId };
}

function withGuestCookieIfNeeded(response: NextResponse, guestId: string | null) {
  if (!guestId) return response;
  response.cookies.set(SPIN_WHEEL_GUEST_COOKIE, guestId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
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

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateToken(req);
    const { participantId, guestIdForCookie } = resolveSpinParticipantId(req, user?.id ?? null);
    const result = await spinWheelService.spin(participantId);
    const response = NextResponse.json(result);
    return withGuestCookieIfNeeded(response, guestIdForCookie);
  } catch (error: unknown) {
    const apiError = toApiError(error, req.url);
    return NextResponse.json(apiError, { status: apiError.status });
  }
}
