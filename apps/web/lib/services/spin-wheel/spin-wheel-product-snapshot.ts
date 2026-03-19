import { db } from "@white-shop/db";
import type { SpinWheelPrizeProduct } from "./spin-wheel.types";
import { getProductPrimaryTranslation } from "./spin-wheel-utils";

/** Extract first image URL from media item (string or { url?, src?, value? }). */
function extractImageUrlFromMediaItem(
  item: unknown
): string {
  if (item == null) return "";
  if (typeof item === "string") {
    const trimmed = item.trim();
    return trimmed;
  }
  if (typeof item === "object") {
    const obj = item as { url?: string; src?: string; value?: string };
    const url = obj.url ?? obj.src ?? obj.value ?? "";
    return typeof url === "string" ? url.trim() : "";
  }
  return "";
}

export async function getProductSnapshot(productId: string): Promise<{
  productId: string;
  productTitle: string;
  productSlug: string;
  productImageUrl: string | null;
}> {
  const product = await db.product.findFirst({
    where: { id: productId, deletedAt: null },
    select: {
      id: true,
      media: true,
      translations: { select: { locale: true, title: true, slug: true } },
    },
  });

  if (!product) {
    throw {
      status: 404,
      type: "https://api.shop.am/problems/not-found",
      title: "Product not found",
      detail: `Product with id '${productId}' does not exist`,
    };
  }

  const translation = getProductPrimaryTranslation(product.translations);
  const media = Array.isArray(product.media) ? product.media : [];
  const firstMedia = media[0];
  const firstImageUrl = extractImageUrlFromMediaItem(firstMedia);

  return {
    productId: product.id,
    productTitle: translation?.title ?? "Untitled product",
    productSlug: translation?.slug ?? "",
    productImageUrl: firstImageUrl || null,
  };
}

export async function getProductSnapshots(
  productIds: string[]
): Promise<SpinWheelPrizeProduct[]> {
  const snapshots = await Promise.all(
    productIds.map((id) =>
      getProductSnapshot(id).then((s) => ({
        productId: s.productId,
        productTitle: s.productTitle,
        productSlug: s.productSlug,
        productImageUrl: s.productImageUrl,
      }))
    )
  );
  return snapshots;
}
