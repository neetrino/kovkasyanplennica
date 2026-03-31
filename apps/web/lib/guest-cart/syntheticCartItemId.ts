/**
 * Guest cart lines use synthetic CartItem ids from hydrateGuestCart:
 * `${productId}-${variantId}-${storageIndex}` (see hydrateGuestCart.ts).
 * Server CartItem ids are a single cuid — never this shape.
 */
export function parseSyntheticGuestCartItemId(
  itemId: string,
): { productId: string; variantId: string } | null {
  const parts = itemId.split('-');
  if (parts.length < 3) {
    return null;
  }
  const last = parts[parts.length - 1];
  if (!last || !/^\d+$/.test(last)) {
    return null;
  }
  const productId = parts[0];
  const variantId = parts.slice(1, -1).join('-');
  if (!productId || !variantId) {
    return null;
  }
  return { productId, variantId };
}

export function isSyntheticGuestCartItemId(itemId: string): boolean {
  return parseSyntheticGuestCartItemId(itemId) !== null;
}
