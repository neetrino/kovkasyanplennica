import { db } from "@white-shop/db";
import { logger } from "../../utils/logger";
import type { OrderItemWithVariant } from "./orders.types";

export async function findOrderByNumber(orderNumber: string, userId: string) {
  const order = await db.order.findFirst({
    where: { number: orderNumber, userId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              options: {
                include: {
                  attributeValue: {
                    include: { attribute: true, translations: true },
                  },
                },
              },
            },
          },
        },
      },
      payments: true,
      events: true,
    },
  });

  if (!order) {
    throw {
      status: 404,
      type: "https://api.shop.am/problems/not-found",
      title: "Order not found",
      detail: `Order with number '${orderNumber}' not found`,
    };
  }

  let shippingAddress = order.shippingAddress;
  if (typeof shippingAddress === "string") {
    try {
      shippingAddress = JSON.parse(shippingAddress);
    } catch {
      shippingAddress = null;
    }
  }

  logger.info("Order found", {
    orderNumber: order.number,
    itemsCount: order.items.length,
    items: order.items.map((item: OrderItemWithVariant) => ({
      variantId: item.variantId,
      productTitle: item.productTitle,
      variant: item.variant
        ? { id: item.variant.id, optionsCount: item.variant.options?.length || 0 }
        : null,
    })),
  });

  return {
    id: order.id,
    number: order.number,
    status: order.status,
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    items: order.items.map((item: OrderItemWithVariant) => mapOrderItem(item)),
    totals: {
      subtotal: Number(order.subtotal),
      discount: Number(order.discountAmount),
      shipping: Number(order.shippingAmount),
      tax: Number(order.taxAmount),
      total: Number(order.total),
      currency: order.currency,
    },
    customer: {
      email: order.customerEmail || undefined,
      phone: order.customerPhone || undefined,
    },
    shippingAddress,
    shippingMethod: order.shippingMethod || "pickup",
    trackingNumber: order.trackingNumber || undefined,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

function mapOrderItem(item: OrderItemWithVariant) {
  const variantOptions =
    item.variant?.options?.map((opt) => {
      if (opt.attributeValue) {
        const translations = opt.attributeValue.translations || [];
        const label = translations.length > 0 ? translations[0].label : opt.attributeValue.value;
        return {
          attributeKey: opt.attributeValue.attribute.key || undefined,
          value: opt.attributeValue.value || undefined,
          label: label || undefined,
          imageUrl: opt.attributeValue.imageUrl || undefined,
          colors: opt.attributeValue.colors || undefined,
        };
      }
      return {
        attributeKey: opt.attributeKey || undefined,
        value: opt.value || undefined,
      };
    }) || [];

  return {
    variantId: item.variantId || "",
    productTitle: item.productTitle,
    variantTitle: item.variantTitle || "",
    sku: item.sku,
    quantity: item.quantity,
    price: Number(item.price),
    total: Number(item.total),
    imageUrl: item.imageUrl || undefined,
    variantOptions,
  };
}
