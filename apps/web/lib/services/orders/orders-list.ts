import { db } from "@white-shop/db";

export async function listOrders(userId: string) {
  const orders = await db.order.findMany({
    where: { userId },
    include: { items: true, payments: true },
    orderBy: { createdAt: "desc" },
  });

  return {
    data: orders.map((order) => ({
      id: order.id,
      number: order.number,
      status: order.status,
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      total: order.total,
      subtotal: order.subtotal,
      discountAmount: order.discountAmount,
      shippingAmount: order.shippingAmount,
      taxAmount: order.taxAmount,
      currency: order.currency,
      createdAt: order.createdAt,
      itemsCount: order.items.length,
    })),
  };
}
