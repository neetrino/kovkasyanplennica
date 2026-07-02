import type { PrismaClient } from "@prisma/client";

export type CatalogCounts = {
  categories: number;
  categoryTranslations: number;
  products: number;
  productTranslations: number;
  variants: number;
  cartItems: number;
  orderItemsWithVariant: number;
};

export async function getCatalogCounts(db: PrismaClient): Promise<CatalogCounts> {
  const [
    categories,
    categoryTranslations,
    products,
    productTranslations,
    variants,
    cartItems,
    orderItemsWithVariant,
  ] = await Promise.all([
    db.category.count(),
    db.categoryTranslation.count(),
    db.product.count(),
    db.productTranslation.count(),
    db.productVariant.count(),
    db.cartItem.count(),
    db.orderItem.count({ where: { variantId: { not: null } } }),
  ]);

  return {
    categories,
    categoryTranslations,
    products,
    productTranslations,
    variants,
    cartItems,
    orderItemsWithVariant,
  };
}

export function logCounts(label: string, counts: CatalogCounts): void {
  console.log(`${label}:`, counts);
}

export function assertCatalogEmpty(counts: CatalogCounts): void {
  if (counts.products > 0 || counts.categories > 0) {
    throw new Error(
      `Cleanup incomplete: products=${counts.products}, categories=${counts.categories}. Aborting import.`
    );
  }
}
