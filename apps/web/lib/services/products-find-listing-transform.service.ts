import { discountSettingsKey } from "@/lib/cache/redis-keys";
import { CATALOG_REDIS_TTL_SECONDS } from "@/lib/cache/public-cache-ttl";
import { withRedisCache } from "@/lib/cache/with-redis-cache";
import { db } from "@white-shop/db";
import { processImageUrl } from "../utils/image-utils";
import { translations } from "../translations";
import type { ProductListingRow } from "./products-find-query/listing-select";

const getOutOfStockLabel = (lang: string = "ru"): string => {
  const langKey = lang as keyof typeof translations;
  const translation = translations[langKey] || translations.ru;
  return translation.stock.outOfStock;
};

const DISCOUNT_SETTINGS_TTL_SECONDS = CATALOG_REDIS_TTL_SECONDS;

async function fetchDiscountSettings() {
  return db.settings.findMany({
    where: {
      key: {
        in: ["globalDiscount", "categoryDiscounts", "brandDiscounts"],
      },
    },
  });
}

type DiscountSettings = Awaited<ReturnType<typeof fetchDiscountSettings>>;

async function getDiscountSettingsCached(): Promise<DiscountSettings> {
  return withRedisCache(
    discountSettingsKey(),
    DISCOUNT_SETTINGS_TTL_SECONDS,
    fetchDiscountSettings
  );
}

function toPlainTextDescription(
  value: string | null | undefined
): string | null {
  if (!value) return null;
  const plain = value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > 0 ? plain : null;
}

type ListingColorOption = ProductListingRow["variants"][number]["options"][number];

function isColorOption(option: ListingColorOption): boolean {
  if (option.attributeValue?.attribute?.key === "color") {
    return true;
  }
  return option.attributeKey === "color";
}

function resolveColorFromOption(
  option: ListingColorOption,
  lang: string
): { colorValue: string; imageUrl: string | null; colorsHex: string[] | null } | null {
  if (option.attributeValue) {
    const attrTranslation =
      option.attributeValue.translations?.find(
        (translation) => translation.locale === lang
      ) || option.attributeValue.translations?.[0];
    const colorValue =
      attrTranslation?.label || option.attributeValue.value || "";
    const colorsValue = option.attributeValue.colors;
    const colorsHex =
      Array.isArray(colorsValue) &&
      colorsValue.every((color): color is string => typeof color === "string")
        ? colorsValue
        : null;

    if (!colorValue) return null;
    return {
      colorValue: colorValue.trim(),
      imageUrl: option.attributeValue.imageUrl || null,
      colorsHex,
    };
  }

  const colorValue = option.value || "";
  if (!colorValue) return null;
  return {
    colorValue: colorValue.trim(),
    imageUrl: null,
    colorsHex: null,
  };
}

function collectColorsFromVariants(
  variants: ProductListingRow["variants"],
  lang: string
): Array<{ value: string; imageUrl?: string | null; colors?: string[] | null }> {
  const colorMap = new Map<
    string,
    { value: string; imageUrl?: string | null; colors?: string[] | null }
  >();

  variants.forEach((variant) => {
    const colorOptions = variant.options.filter(isColorOption);

    colorOptions.forEach((option) => {
      const resolved = resolveColorFromOption(option, lang);
      if (!resolved) return;

      const normalizedValue = resolved.colorValue.toLowerCase();
      if (
        !colorMap.has(normalizedValue) ||
        (resolved.imageUrl && !colorMap.get(normalizedValue)?.imageUrl)
      ) {
        colorMap.set(normalizedValue, {
          value: resolved.colorValue,
          imageUrl: resolved.imageUrl,
          colors: resolved.colorsHex,
        });
      }
    });

    if (
      colorOptions.length === 0 &&
      variant.attributes &&
      typeof variant.attributes === "object" &&
      !Array.isArray(variant.attributes) &&
      "color" in variant.attributes
    ) {
      const colorAttr = (variant.attributes as { color?: unknown }).color;
      const colorAttributes = Array.isArray(colorAttr)
        ? colorAttr
        : colorAttr
          ? [colorAttr]
          : [];

      colorAttributes.forEach((colorAttrItem: unknown) => {
        const colorValue =
          colorAttrItem &&
          typeof colorAttrItem === "object" &&
          "value" in colorAttrItem
            ? (colorAttrItem as { value?: unknown }).value
            : colorAttrItem;

        if (typeof colorValue !== "string") return;

        const normalizedValue = colorValue.trim().toLowerCase();
        if (!colorMap.has(normalizedValue)) {
          colorMap.set(normalizedValue, {
            value: colorValue.trim(),
            imageUrl: null,
            colors: null,
          });
        }
      });
    }
  });

  return Array.from(colorMap.values());
}

function resolveCategories(
  product: ProductListingRow,
  lang: string,
  categoryByIdMap: Map<
    string,
    { id: string; translations?: Array<{ locale: string; slug: string; title: string }> }
  >
): Array<{ id: string; slug: string; title: string }> {
  const primaryCategoryId = product.primaryCategoryId ?? null;
  const relCategories = Array.isArray(product.categories) ? product.categories : [];
  const ids = Array.isArray(product.categoryIds) ? product.categoryIds : [];

  let list: Array<{ id: string; slug: string; title: string }>;

  if (relCategories.length > 0) {
    list = relCategories.map((category) => {
      const categoryTranslations = Array.isArray(category.translations)
        ? category.translations
        : [];
      const categoryTranslation =
        categoryTranslations.find(
          (translation) => translation.locale === lang
        ) || categoryTranslations[0] || null;
      return {
        id: category.id,
        slug: categoryTranslation?.slug || "",
        title: categoryTranslation?.title || "",
      };
    });
  } else if (ids.length > 0 && categoryByIdMap.size > 0) {
    list = ids
      .map((id) => {
        const category = categoryByIdMap.get(id);
        if (!category) return null;
        const categoryTranslations = Array.isArray(category.translations)
          ? category.translations
          : [];
        const categoryTranslation =
          categoryTranslations.find(
            (translation) => translation.locale === lang
          ) || categoryTranslations[0] || null;
        return {
          id: category.id,
          slug: categoryTranslation?.slug || "",
          title: categoryTranslation?.title || "",
        };
      })
      .filter((category): category is { id: string; slug: string; title: string } =>
        category !== null
      );
  } else {
    return [];
  }

  if (list.length <= 1 || !primaryCategoryId) return list;

  const primaryIndex = list.findIndex((category) => category.id === primaryCategoryId);
  if (primaryIndex <= 0) return list;

  const primary = list[primaryIndex];
  const rest = list.filter((_, index) => index !== primaryIndex);
  return [primary, ...rest];
}

function buildLabels(
  product: ProductListingRow,
  variantStock: number,
  lang: string
) {
  const existingLabels = Array.isArray(product.labels)
    ? product.labels.map((label) => ({
        id: label.id,
        type: label.type,
        value: label.value,
        position: label.position,
        color: label.color,
      }))
    : [];

  const isOutOfStock = variantStock <= 0;
  if (!isOutOfStock) return existingLabels;

  const outOfStockText = getOutOfStockLabel(lang);
  const hasOutOfStockLabel = existingLabels.some(
    (label) =>
      label.value.toLowerCase() === outOfStockText.toLowerCase() ||
      label.value.toLowerCase().includes("out of stock") ||
      label.value.toLowerCase().includes("արտադրված") ||
      label.value.toLowerCase().includes("нет в наличии") ||
      label.value.toLowerCase().includes("არ არის მარაგში")
  );

  if (hasOutOfStockLabel) return existingLabels;

  const topLeftOccupied = existingLabels.some(
    (label) => label.position === "top-left"
  );
  const position = topLeftOccupied ? "top-right" : "top-left";

  existingLabels.push({
    id: `out-of-stock-${product.id}`,
    type: "text",
    value: outOfStockText,
    position: position as "top-left" | "top-right" | "bottom-left" | "bottom-right",
    color: "#6B7280",
  });

  return existingLabels;
}

class ProductsFindListingTransformService {
  /** Phase 5C: listing-specific transformer for DB-paginated catalog rows. */
  async transformListingProducts(
    products: ProductListingRow[],
    lang: string = "ru"
  ) {
    const discountSettings = await getDiscountSettingsCached();

    const globalDiscount =
      Number(
        discountSettings.find(
          (setting: { key: string; value: unknown }) =>
            setting.key === "globalDiscount"
        )?.value
      ) || 0;

    const categoryDiscountsSetting = discountSettings.find(
      (setting: { key: string; value: unknown }) =>
        setting.key === "categoryDiscounts"
    );
    const categoryDiscounts = categoryDiscountsSetting
      ? (categoryDiscountsSetting.value as Record<string, number>) || {}
      : {};

    const brandDiscountsSetting = discountSettings.find(
      (setting: { key: string; value: unknown }) =>
        setting.key === "brandDiscounts"
    );
    const brandDiscounts = brandDiscountsSetting
      ? (brandDiscountsSetting.value as Record<string, number>) || {}
      : {};

    const categoryIdsToResolve = new Set<string>();
    products.forEach((product) => {
      const relCategories = Array.isArray(product.categories)
        ? product.categories
        : [];
      const ids = Array.isArray(product.categoryIds) ? product.categoryIds : [];
      if (relCategories.length === 0 && ids.length > 0) {
        ids.forEach((id) => categoryIdsToResolve.add(id));
      }
    });

    const categoryByIdMap = new Map<
      string,
      { id: string; translations?: Array<{ locale: string; slug: string; title: string }> }
    >();

    if (categoryIdsToResolve.size > 0) {
      const categoriesFromDb = await db.category.findMany({
        where: { id: { in: Array.from(categoryIdsToResolve) } },
        select: {
          id: true,
          translations: {
            select: {
              locale: true,
              slug: true,
              title: true,
            },
          },
        },
      });
      categoriesFromDb.forEach((category) => {
        categoryByIdMap.set(category.id, category);
      });
    }

    return products.map((product) => {
      const productTranslations = Array.isArray(product.translations)
        ? product.translations
        : [];
      const translation =
        productTranslations.find(
          (productTranslation) => productTranslation.locale === lang
        ) ||
        productTranslations[0] ||
        null;

      const brandTranslations =
        product.brand && Array.isArray(product.brand.translations)
          ? product.brand.translations
          : [];
      const brandTranslation =
        brandTranslations.length > 0
          ? brandTranslations.find(
              (brandTrans) => brandTrans.locale === lang
            ) || brandTranslations[0]
          : null;

      const variants = Array.isArray(product.variants) ? product.variants : [];
      const variant =
        variants.length > 0
          ? variants.sort((left, right) => left.price - right.price)[0]
          : null;

      const availableColors = collectColorsFromVariants(variants, lang);

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

      const categories = resolveCategories(product, lang, categoryByIdMap);
      const variantStock = variant?.stock ?? 0;

      return {
        id: product.id,
        slug: translation?.slug || "",
        title: translation?.title || "",
        description: toPlainTextDescription(translation?.descriptionHtml),
        defaultVariantId: variant?.id ?? null,
        stock: variantStock,
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
        image: (() => {
          if (!Array.isArray(product.media) || product.media.length === 0) {
            return null;
          }
          const firstImage = processImageUrl(
            product.media[0] as
              | string
              | null
              | undefined
              | { url?: string; src?: string; value?: string }
          );
          return firstImage || null;
        })(),
        inStock: variantStock > 0,
        labels: buildLabels(product, variantStock, lang),
        colors: availableColors,
      };
    });
  }
}

export const productsFindListingTransformService =
  new ProductsFindListingTransformService();
