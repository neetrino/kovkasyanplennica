import type { CheckoutData } from "../../types/checkout";
import { runCheckout } from "./orders-checkout";
import { listOrders } from "./orders-list";
import { findOrderByNumber } from "./orders-find";

class OrdersService {
  async checkout(data: CheckoutData, userId?: string) {
    return runCheckout(data, userId);
  }

  async list(userId: string) {
    return listOrders(userId);
  }

  async findByNumber(orderNumber: string, userId: string) {
    return findOrderByNumber(orderNumber, userId);
  }
}

export const ordersService = new OrdersService();
