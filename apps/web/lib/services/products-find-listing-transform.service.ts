import { toOptimizedProductCardUrl } from "@/lib/image-optimization";
import { processImageUrl } from "../utils/image-utils";
import { translations } from "../translations";
import type { ProductListingRow } from "./products-find-query/listing-query-executor";
import { getDiscountSettingsCached } from "./products-find-transform-settings";

function toPlainTextDescription(value: string | null | undefined): string | null {
  if (!value) return null;
  const plain = value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > 0 ? plain : null;
}

const getOutOfStockLabel = (lang: string = "ru"): string => {
  const langKey = lang as keyof typeof translations;
  const translation = translations[langKey] || translations.ru;
  return translation.stock.outOfStock;
};

class ProductsFindListingTransformService {
  async transformListingProducts(
    products: ProductListingRow[],
    lang: string = "ru"
  ) {
    const discountSettings = await getDiscountSettingsCached();

    const globalDiscount =
      Number(
        discountSettings.find((s) => s.key === "globalDiscount")?.value
      ) || 0;

    const categoryDiscountsSetting = discountSettings.find(
      (s) => s.key === "categoryDiscounts"
    );
    const categoryDiscounts = categoryDiscountsSetting
      ? ((categoryDiscountsSetting.value as Record<string, number>) || {})
      : {};

    const brandDiscountsSetting = discountSettings.find(
      (s) => s.key === "brandDiscounts"
    );
    const brandDiscounts = brandDiscountsSetting
      ? ((brandDiscountsSetting.value as Record<string, number>) || {})
      : {};

    return products.map((product) => {
      const translation = product.translations[0] ?? null;
      const brandTranslation = product.brand?.translations[0] ?? null;
      const variant = product.variants[0] ?? null;

      const originalPrice = variant?.price || 0;
      let finalPrice = originalPrice;
      const productDiscount = product.discountPercent || 0;

      let appliedDiscount = 0;
      if (productDiscount > 0) {
        appliedDiscount = productDiscount;
      } else if (
        product.primaryCategoryId &&
        categoryDiscounts[product.primaryCategoryId]
      ) {
        appliedDiscount = categoryDiscounts[product.primaryCategoryId];
      } else if (product.brandId && brandDiscounts[product.brandId]) {
        appliedDiscount = brandDiscounts[product.brandId];
      } else if (globalDiscount > 0) {
        appliedDiscount = globalDiscount;
      }

      if (appliedDiscount > 0 && originalPrice > 0) {
        finalPrice = originalPrice * (1 - appliedDiscount / 100);
      }

      const primaryCategoryId = product.primaryCategoryId ?? null;
      const categories = (() => {
        const list = product.categories.map((cat) => {
          const catTranslation = cat.translations[0] ?? null;
          return {
            id: cat.id,
            slug: catTranslation?.slug || "",
            title: catTranslation?.title || "",
          };
        });
        if (list.length <= 1 || !primaryCategoryId) return list;
        const primaryIndex = list.findIndex((c) => c.id === primaryCategoryId);
        if (primaryIndex <= 0) return list;
        const primary = list[primaryIndex];
        const rest = list.filter((_, i) => i !== primaryIndex);
        return [primary, ...rest];
      })();

      const firstImage =
        Array.isArray(product.media) && product.media.length > 0
          ? processImageUrl(
              product.media[0] as string | null | undefined | {
                url?: string;
                src?: string;
                value?: string;
              }
            )
          : null;

      const existingLabels = product.labels.map((label) => ({
        id: label.id,
        type: label.type,
        value: label.value,
        position: label.position,
        color: label.color,
      }));

      const isOutOfStock = (variant?.stock || 0) <= 0;
      if (isOutOfStock) {
        const outOfStockText = getOutOfStockLabel(lang);
        const hasOutOfStockLabel = existingLabels.some(
          (label) =>
            label.value.toLowerCase() === outOfStockText.toLowerCase() ||
            label.value.toLowerCase().includes("out of stock")
        );
        if (!hasOutOfStockLabel) {
          const topLeftOccupied = existingLabels.some(
            (l) => l.position === "top-left"
          );
          existingLabels.push({
            id: `out-of-stock-${product.id}`,
            type: "text",
            value: outOfStockText,
            position: topLeftOccupied ? "top-right" : "top-left",
            color: "#6B7280",
          });
        }
      }

      return {
        id: product.id,
        slug: translation?.slug || "",
        title: translation?.title || "",
        description: toPlainTextDescription(translation?.descriptionHtml),
        defaultVariantId: variant?.id ?? null,
        stock: variant?.stock ?? 0,
        brand: product.brand
          ? {
              id: product.brand.id,
              name: brandTranslation?.name || "",
            }
          : null,
        categories,
        price: finalPrice,
        originalPrice:
          appliedDiscount > 0 ? originalPrice : variant?.compareAtPrice || null,
        compareAtPrice: variant?.compareAtPrice || null,
        discountPercent: appliedDiscount > 0 ? appliedDiscount : null,
        image: firstImage
          ? (toOptimizedProductCardUrl(firstImage) ?? firstImage)
          : null,
        inStock: (variant?.stock || 0) > 0,
        labels: existingLabels,
        colors: [] as Array<{
          value: string;
          imageUrl?: string | null;
          colors?: string[] | null;
        }>,
      };
    });
  }
}

export const productsFindListingTransformService =
  new ProductsFindListingTransformService();
