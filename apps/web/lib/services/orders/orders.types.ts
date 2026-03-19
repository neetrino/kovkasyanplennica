import type { Prisma } from "@prisma/client";

export type CartItemWithRelations = Prisma.CartItemGetPayload<{
  include: {
    product: { include: { translations: true } };
    variant: { include: { options: true } };
  };
}>;

export type ProductVariantWithProduct = Prisma.ProductVariantGetPayload<{
  include: {
    product: { include: { translations: true } };
    options: true;
  };
}>;

export type OrderItemWithVariant = Prisma.OrderItemGetPayload<{
  include: {
    variant: {
      include: {
        options: {
          include: {
            attributeValue: {
              include: { translations: true; attribute: true };
            };
          };
        };
      };
    };
  };
}>;

export type MediaItem = string | { url?: string; src?: string } | unknown;

/** Resolved cart item used for order creation */
export interface ResolvedCartItem {
  variantId: string;
  productId: string;
  quantity: number;
  price: number;
  productTitle: string;
  variantTitle?: string;
  sku: string;
  imageUrl?: string;
}
