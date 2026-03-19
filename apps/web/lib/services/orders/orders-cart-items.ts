import { db } from "@white-shop/db";
import { logger } from "../../utils/logger";
import type { CheckoutData } from "../../types/checkout";
import type { CartItemWithRelations, ResolvedCartItem } from "./orders.types";
import { extractImageUrlFromMedia } from "./orders.utils";

/**
 * Resolve cart items for checkout: from user cart (if cartId + userId) or from guest items.
 * Returns array of ResolvedCartItem or throws validation/not-found errors.
 */
export async function getCartItemsForCheckout(
  data: CheckoutData,
  userId?: string
): Promise<ResolvedCartItem[]> {
  const { cartId, items: guestItems } = data;

  if (userId && cartId && cartId !== "guest-cart") {
    return getCartItemsFromUserCart(cartId, userId);
  }

  if (guestItems && Array.isArray(guestItems) && guestItems.length > 0) {
    return getCartItemsFromGuestItems(guestItems);
  }

  throw {
    status: 400,
    type: "https://api.shop.am/problems/validation-error",
    title: "Cart is empty",
    detail: "Cannot checkout with an empty cart",
  };
}

async function getCartItemsFromUserCart(
  cartId: string,
  userId: string
): Promise<ResolvedCartItem[]> {
  const cart = await db.cart.findFirst({
    where: { id: cartId, userId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: { include: { translations: true } },
              options: true,
            },
          },
          product: { include: { translations: true } },
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    throw {
      status: 400,
      type: "https://api.shop.am/problems/validation-error",
      title: "Cart is empty",
      detail: "Cannot checkout with an empty cart",
    };
  }

  logger.debug("Processing cart items", { count: cart.items.length });

  const cartItems = await Promise.all(
    cart.items.map(async (item: CartItemWithRelations) => {
      const product = item.product;
      const variant = item.variant;

      if (!variant) {
        logger.error("Cart item missing variant", {
          itemId: item.id,
          variantId: item.variantId,
          productId: item.productId,
        });
        throw {
          status: 404,
          type: "https://api.shop.am/problems/not-found",
          title: "Variant not found",
          detail: `Variant ${item.variantId} not found for cart item`,
        };
      }

      const translation = product.translations?.[0];
      const variantTitle = variant.options
        ?.map((opt) => `${opt.attributeKey || ""}: ${opt.value || ""}`)
        .join(", ");
      const imageUrl = extractImageUrlFromMedia(product.media);

      if (variant.stock < item.quantity) {
        throw {
          status: 422,
          type: "https://api.shop.am/problems/validation-error",
          title: "Insufficient stock",
          detail: `Product "${translation?.title || "Unknown"}" - insufficient stock. Available: ${variant.stock}, Requested: ${item.quantity}`,
        };
      }

      return {
        variantId: variant.id,
        productId: product.id,
        quantity: item.quantity,
        price: Number(item.priceSnapshot),
        productTitle: translation?.title || "Unknown Product",
        variantTitle: variantTitle || undefined,
        sku: variant.sku || "",
        imageUrl,
      };
    })
  );

  logger.info("All cart items processed", { count: cartItems.length });
  return cartItems;
}

async function getCartItemsFromGuestItems(
  guestItems: Array<{ productId: string; variantId: string; quantity: number }>
): Promise<ResolvedCartItem[]> {
  return Promise.all(
    guestItems.map(async (item) => {
      const { productId, variantId, quantity } = item;

      if (!productId || !variantId || !quantity) {
        throw {
          status: 400,
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          detail: "Each item must have productId, variantId, and quantity",
        };
      }

      const variant = await db.productVariant.findUnique({
        where: { id: variantId },
        include: {
          product: { include: { translations: true } },
          options: true,
        },
      });

      if (!variant || variant.productId !== productId) {
        throw {
          status: 404,
          type: "https://api.shop.am/problems/not-found",
          title: "Product variant not found",
          detail: `Variant ${variantId} not found for product ${productId}`,
        };
      }

      if (variant.stock < quantity) {
        throw {
          status: 422,
          type: "https://api.shop.am/problems/validation-error",
          title: "Insufficient stock",
          detail: `Insufficient stock. Available: ${variant.stock}, Requested: ${quantity}`,
        };
      }

      const translation = variant.product.translations?.[0];
      const variantTitle = variant.options
        ?.map((opt: { attributeKey?: string | null; value?: string | null }) => `${opt.attributeKey || ""}: ${opt.value || ""}`)
        .join(", ");
      const imageUrl = extractImageUrlFromMedia(variant.product.media);

      return {
        variantId: variant.id,
        productId: variant.product.id,
        quantity,
        price: Number(variant.price),
        productTitle: translation?.title || "Unknown Product",
        variantTitle: variantTitle || undefined,
        sku: variant.sku || "",
        imageUrl,
      };
    })
  );
}
