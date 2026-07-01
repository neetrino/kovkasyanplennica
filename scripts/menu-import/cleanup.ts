import type { PrismaClient } from "@prisma/client";

export async function cleanupMenuCatalog(db: PrismaClient): Promise<void> {
  await db.$transaction(async (tx) => {
    const products = await tx.product.findMany({ select: { id: true } });
    const productIds = products.map((row) => row.id);

    const variants = productIds.length
      ? await tx.productVariant.findMany({
          where: { productId: { in: productIds } },
          select: { id: true },
        })
      : [];
    const variantIds = variants.map((row) => row.id);

    if (variantIds.length > 0) {
      await tx.orderItem.updateMany({
        where: { variantId: { in: variantIds } },
        data: { variantId: null },
      });
      await tx.cartItem.deleteMany({ where: { variantId: { in: variantIds } } });
    }

    if (productIds.length > 0) {
      await tx.cartItem.deleteMany({ where: { productId: { in: productIds } } });
      await tx.productReview.deleteMany({ where: { productId: { in: productIds } } });
      await tx.product.deleteMany({ where: { id: { in: productIds } } });
    }

    await tx.category.deleteMany({});
  }, { timeout: 120_000 });
}
