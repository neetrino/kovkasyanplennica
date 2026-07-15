import { NextRequest, NextResponse } from "next/server";
import { authenticateToken, requireAdminOrHostess } from "@/lib/middleware/auth";
import { adminService } from "@/lib/services/admin.service";

/**
 * GET /api/v1/admin/orders/[id]
 * Get full order details for admin
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateToken(req);
    if (!user || !requireAdminOrHostess(user)) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/forbidden",
          title: "Forbidden",
          status: 403,
          detail: "Admin or hostess access required",
          instance: req.url,
        },
        { status: 403 }
      );
    }

    const { id } = await params;

    const order = await adminService.getOrderById(id);

    return NextResponse.json(order);
  } catch (error: any) {
    console.error("❌ [ADMIN ORDERS] GET Error:", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      code: error?.code,
      meta: error?.meta,
      type: error?.type,
      title: error?.title,
      status: error?.status,
      detail: error?.detail,
      fullError: error,
    });
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

/**
 * PUT /api/v1/admin/orders/[id]
 * Update an order
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateToken(req);
    if (!user || !requireAdminOrHostess(user)) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/forbidden",
          title: "Forbidden",
          status: 403,
          detail: "Admin or hostess access required",
          instance: req.url,
        },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();

    const order = await adminService.updateOrder(id, body);

    return NextResponse.json(order);
  } catch (error: any) {
    console.error("❌ [ADMIN ORDERS] PUT Error:", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      code: error?.code,
      meta: error?.meta,
      type: error?.type,
      title: error?.title,
      status: error?.status,
      detail: error?.detail,
      fullError: error,
    });
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

/**
 * DELETE /api/v1/admin/orders/[id]
 * Delete an order
 * Հեռացնում է պատվերը
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  let orderId: string | undefined;

  try {
    // Ստուգում ենք ավտորիզացիան
    const user = await authenticateToken(req);
    if (!user || !requireAdminOrHostess(user)) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/forbidden",
          title: "Forbidden",
          status: 403,
          detail: "Admin or hostess access required",
          instance: req.url,
        },
        { status: 403 }
      );
    }

    // Ստանում ենք պատվերի ID-ն
    let resolvedParams;
    try {
      resolvedParams = await params;
    } catch (paramsError: any) {
      console.error("❌ [ADMIN ORDERS] DELETE - Params սխալ:", {
        error: paramsError,
        message: paramsError?.message,
        stack: paramsError?.stack,
      });
      throw {
        status: 400,
        type: "https://api.shop.am/problems/bad-request",
        title: "Bad Request",
        detail: "Invalid order ID parameter",
      };
    }

    orderId = resolvedParams?.id;
    
    // Validation
    if (!orderId || typeof orderId !== 'string' || orderId.trim() === '') {
      console.error("❌ [ADMIN ORDERS] DELETE - Invalid orderId:", orderId);
      throw {
        status: 400,
        type: "https://api.shop.am/problems/bad-request",
        title: "Bad Request",
        detail: "Order ID is required and must be a valid string",
      };
    }


    // Հեռացնում ենք պատվերը
    await adminService.deleteOrder(orderId);
    
    const duration = Date.now() - startTime;

    return NextResponse.json({ 
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    // Մանրամասն լոգավորում
    console.error("❌ [ADMIN ORDERS] DELETE Error:", {
      orderId: orderId || "unknown",
      error: {
        name: error?.name,
        message: error?.message,
        code: error?.code,
        meta: error?.meta,
        type: error?.type,
        title: error?.title,
        status: error?.status,
        detail: error?.detail,
      },
      stack: error?.stack?.substring(0, 1000),
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });

    // Ստանդարտ սխալների մշակում
    const statusCode = error?.status || 500;
    const errorResponse = {
      type: error?.type || "https://api.shop.am/problems/internal-error",
      title: error?.title || "Internal Server Error",
      status: statusCode,
      detail: error?.detail || error?.message || "An error occurred while deleting the order",
      instance: req.url,
    };

    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

