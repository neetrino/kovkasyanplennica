import { db } from "@white-shop/db";
import { deleteProduct, indexProduct } from "./search.service";

export function isMeilisearchConfigured(): boolean {
  const host =
    process.env.MEILI_HOST?.trim() ||
    process.env.MEILISEARCH_HOST?.trim() ||
    "";
  return host.length > 0;
}

/**
 * Sync one product document to Meilisearch (no-op when Meili is not configured).
 */
export async function syncProductSearchIndex(productId: string): Promise<void> {
  if (!isMeilisearchConfigured()) {
    return;
  }

  try {
    const product = await db.product.findUnique({
      where: { id: productId },
      include: {
        translations: true,
        variants: {
          where: { published: true },
        },
        brand: {
          include: { translations: true },
        },
      },
    });

    if (!product || !product.published || product.deletedAt) {
      await deleteProduct(productId);
      return;
    }

    await indexProduct({
      ...product,
      categoryIds: product.categoryIds ?? [],
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn("⚠️ [SEARCH INDEX] Failed to sync product:", productId, message);
  }
}
