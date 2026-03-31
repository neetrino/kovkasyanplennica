/**
 * Guest cart line persisted in localStorage (`shop_cart_guest`).
 * Snapshot fields allow instant cart UI without per-line product API calls.
 */
export type StoredGuestCartLine = {
  productId: string;
  productSlug?: string;
  variantId: string;
  quantity: number;
  title?: string;
  image?: string | null;
  price?: number;
  originalPrice?: number | null;
  sku?: string;
  stock?: number;
};
