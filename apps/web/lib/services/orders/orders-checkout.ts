import { db } from "@white-shop/db";
import type { Prisma } from "@prisma/client";
import type { CheckoutData } from "../../types/checkout";
import type { ResolvedCartItem } from "./orders.types";
import { logger } from "../../utils/logger";
import { getCartItemsForCheckout } from "./orders-cart-items";
import { generateOrderNumber } from "./orders.utils";

export async function runCheckout(data: CheckoutData, userId?: string) {
  const {
    cartId,
    email,
    phone,
    shippingMethod = "pickup",
    shippingAddress,
    shippingAmount: providedShippingAmount,
    paymentMethod = "idram",
  } = data;

  if (!email || !phone) {
    throw {
      status: 400,
      type: "https://api.shop.am/problems/validation-error",
      title: "Validation Error",
      detail: "Email and phone are required",
    };
  }

  const cartItems = await getCartItemsForCheckout(data, userId);
  if (cartItems.length === 0) {
    throw {
      status: 400,
      type: "https://api.shop.am/problems/validation-error",
      title: "Cart is empty",
      detail: "Cannot checkout with an empty cart",
    };
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = 0;
  const shippingAmount = providedShippingAmount !== undefined ? Number(providedShippingAmount) : 0;
  const taxAmount = 0;
  const total = subtotal - discountAmount + shippingAmount + taxAmount;
  const orderNumber = generateOrderNumber();

  try {
    const result = await db.$transaction(async (tx: Prisma.TransactionClient) => {
      const newOrder = await tx.order.create({
        data: {
          number: orderNumber,
          userId: userId || null,
          status: "pending",
          paymentStatus: "pending",
          fulfillmentStatus: "unfulfilled",
          subtotal,
          discountAmount,
          shippingAmount,
          taxAmount,
          total,
          currency: "RUB",
          customerEmail: email,
          customerPhone: phone,
          customerLocale: "ru",
          shippingMethod,
          shippingAddress: shippingAddress ? JSON.parse(JSON.stringify(shippingAddress)) : null,
          billingAddress: shippingAddress ? JSON.parse(JSON.stringify(shippingAddress)) : null,
          items: {
            create: cartItems.map((item) => ({
              variantId: item.variantId,
              productTitle: item.productTitle,
              variantTitle: item.variantTitle,
              sku: item.sku,
              quantity: item.quantity,
              price: item.price,
              total: item.price * item.quantity,
              imageUrl: item.imageUrl,
            })),
          },
          events: {
            create: {
              type: "order_created",
              data: {
                source: userId ? "user" : "guest",
                paymentMethod,
                shippingMethod,
              },
            },
          },
        },
        include: { items: true },
      });

      await updateStockForItems(tx, cartItems);
      const payment = await tx.payment.create({
        data: {
          orderId: newOrder.id,
          provider: paymentMethod,
          method: paymentMethod,
          amount: total,
          currency: "RUB",
          status: "pending",
        },
      });

      if (userId && cartId && cartId !== "guest-cart") {
        await tx.cart.delete({ where: { id: cartId } });
      }

      return { order: newOrder, payment };
    });

    return {
      order: {
        id: result.order.id,
        number: result.order.number,
        status: result.order.status,
        paymentStatus: result.order.paymentStatus,
        total: result.order.total,
        currency: result.order.currency,
      },
      payment: {
        provider: result.payment.provider,
        paymentUrl: null,
        expiresAt: null,
      },
      nextAction:
        paymentMethod === "idram" || paymentMethod === "arca"
          ? "redirect_to_payment"
          : "view_order",
    };
  } catch (error: unknown) {
    const err = error as {
      status?: number;
      type?: string;
      message?: string;
      code?: string;
      name?: string;
      meta?: unknown;
      stack?: string;
    };

    if (err.status && err.type) throw error;

    logger.error("Checkout error", {
      error: {
        name: err?.name,
        message: err?.message,
        code: err?.code,
        meta: err?.meta,
        stack: err?.stack?.substring(0, 500),
      },
    });

    if (err?.code === "P2002") {
      throw {
        status: 409,
        type: "https://api.shop.am/problems/conflict",
        title: "Conflict",
        detail: "Order number already exists, please try again",
      };
    }

    throw {
      status: 500,
      type: "https://api.shop.am/problems/internal-error",
      title: "Internal Server Error",
      detail: err?.message || "An error occurred during checkout",
    };
  }
}

async function updateStockForItems(
  tx: Prisma.TransactionClient,
  cartItems: ResolvedCartItem[]
): Promise<void> {
  logger.debug("Updating stock for variants", { count: cartItems.length });

  for (const item of cartItems) {
    if (!item.variantId) {
      throw {
        status: 400,
        type: "https://api.shop.am/problems/validation-error",
        title: "Validation Error",
        detail: `Missing variantId for item with SKU: ${item.sku}`,
      };
    }

    const variantBefore = await tx.productVariant.findUnique({
      where: { id: item.variantId },
      select: { stock: true, sku: true },
    });

    if (!variantBefore) {
      throw {
        status: 404,
        type: "https://api.shop.am/problems/not-found",
        title: "Variant not found",
        detail: `Variant with id '${item.variantId}' not found`,
      };
    }

    await tx.productVariant.update({
      where: { id: item.variantId },
      data: { stock: { decrement: item.quantity } },
      select: { stock: true, sku: true },
    });
  }

  logger.info("All variant stocks updated successfully");
}
