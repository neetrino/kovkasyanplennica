import { db } from "@white-shop/db";
import { Prisma } from "@prisma/client";
import { CATALOG_REDIS_TTL_SECONDS } from "@/lib/cache/public-cache-ttl";
import {
  filtersCacheKey,
  hashCacheInput,
  normalizeFiltersCacheContext,
  normalizePriceRangeCacheContext,
  priceRangeCacheKey,
} from "@/lib/cache/redis-keys";
import { withRedisCache } from "@/lib/cache/with-redis-cache";
import { buildCatalogContextWhere } from "./products-find-query/catalog-context-where";
import { adminService } from "./admin.service";

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

type ColorFacetEntry = {
  count: number;
  label: string;
  imageUrl?: string | null;
  colors?: string[] | null;
};

type VariantOptionWithRelations = Prisma.ProductVariantOptionGetPayload<{
  include: {
    attributeValue: {
      include: {
        attribute: true;
        translations: true;
      };
    };
  };
}>;

function resolveLang(lang?: string): string {
  return lang || "ru";
}

function parseColorsHex(value: Prisma.JsonValue | null | undefined): string[] | null {
  if (!value || !Array.isArray(value)) {
    return null;
  }
  const hex = value.filter((entry): entry is string => typeof entry === "string");
  return hex.length > 0 ? hex : null;
}

function isColorOption(option: VariantOptionWithRelations): boolean {
  return (
    option.attributeKey === "color" ||
    option.attributeValue?.attribute?.key === "color"
  );
}

function isSizeOption(option: VariantOptionWithRelations): boolean {
  return (
    option.attributeKey === "size" ||
    option.attributeValue?.attribute?.key === "size"
  );
}

function resolveColorValue(
  option: VariantOptionWithRelations,
  lang: string
): { colorValue: string; imageUrl: string | null; colorsHex: string[] | null } {
  if (option.attributeValue) {
    const translation =
      option.attributeValue.translations?.find((t) => t.locale === lang) ||
      option.attributeValue.translations?.[0];
    return {
      colorValue: translation?.label || option.attributeValue.value || "",
      imageUrl: option.attributeValue.imageUrl || null,
      colorsHex: parseColorsHex(option.attributeValue.colors),
    };
  }

  return {
    colorValue: option.value?.trim() || "",
    imageUrl: null,
    colorsHex: null,
  };
}

function resolveSizeValue(option: VariantOptionWithRelations, lang: string): string {
  if (option.attributeValue) {
    const translation =
      option.attributeValue.translations?.find((t) => t.locale === lang) ||
      option.attributeValue.translations?.[0];
    return translation?.label || option.attributeValue.value || "";
  }

  return option.value?.trim() || "";
}

function recordColorOption(
  colorMap: Map<string, ColorFacetEntry>,
  colorValue: string,
  imageUrl: string | null,
  colorsHex: string[] | null
): void {
  if (!colorValue) {
    return;
  }

  const colorKey = colorValue.toLowerCase();
  const existing = colorMap.get(colorKey);
  const preferredLabel = existing
    ? colorValue[0] === colorValue[0].toUpperCase()
      ? colorValue
      : existing.label
    : colorValue;

  colorMap.set(colorKey, {
    count: (existing?.count || 0) + 1,
    label: preferredLabel,
    imageUrl: imageUrl || existing?.imageUrl || null,
    colors: colorsHex || existing?.colors || null,
  });
}

function recordSizeOption(sizeMap: Map<string, number>, sizeValue: string): void {
  if (!sizeValue) {
    return;
  }

  const normalizedSize = sizeValue.trim().toUpperCase();
  sizeMap.set(normalizedSize, (sizeMap.get(normalizedSize) || 0) + 1);
}

function buildFacetMapsFromOptions(
  options: VariantOptionWithRelations[],
  lang: string
): {
  colorMap: Map<string, ColorFacetEntry>;
  sizeMap: Map<string, number>;
} {
  const colorMap = new Map<string, ColorFacetEntry>();
  const sizeMap = new Map<string, number>();

  for (const option of options) {
    if (isColorOption(option)) {
      const { colorValue, imageUrl, colorsHex } = resolveColorValue(option, lang);
      recordColorOption(colorMap, colorValue, imageUrl, colorsHex);
      continue;
    }

    if (isSizeOption(option)) {
      recordSizeOption(sizeMap, resolveSizeValue(option, lang));
    }
  }

  return { colorMap, sizeMap };
}

async function fetchVariantOptionsForContext(
  productWhere: Prisma.ProductWhereInput
): Promise<VariantOptionWithRelations[]> {
  return db.productVariantOption.findMany({
    where: {
      variant: {
        published: true,
        product: productWhere,
      },
      OR: [
        { attributeKey: { in: ["color", "size"] } },
        {
          attributeValue: {
            attribute: { key: { in: ["color", "size"] } },
          },
        },
      ],
    },
    include: {
      attributeValue: {
        include: {
          attribute: true,
          translations: true,
        },
      },
    },
  });
}

async function enrichColorFacetsFromProductAttributes(
  productWhere: Prisma.ProductWhereInput,
  lang: string,
  colorMap: Map<string, ColorFacetEntry>
): Promise<void> {
  const products = await db.product.findMany({
    where: productWhere,
    select: {
      productAttributes: {
        include: {
          attribute: {
            include: {
              values: {
                include: {
                  translations: true,
                },
              },
            },
          },
        },
      },
    },
  });

  for (const product of products) {
    for (const productAttr of product.productAttributes) {
      if (productAttr.attribute?.key !== "color" || !productAttr.attribute.values) {
        continue;
      }

      for (const attrValue of productAttr.attribute.values) {
        const translation =
          attrValue.translations?.find((t) => t.locale === lang) ||
          attrValue.translations?.[0];
        const colorValue = translation?.label || attrValue.value || "";
        if (!colorValue) {
          continue;
        }

        const colorKey = colorValue.toLowerCase();
        const existing = colorMap.get(colorKey);
        const colorsHex = parseColorsHex(attrValue.colors);
        const hasColorsField =
          attrValue.colors !== null && attrValue.colors !== undefined;

        if (attrValue.imageUrl || hasColorsField) {
          colorMap.set(colorKey, {
            count: existing?.count || 0,
            label: existing?.label || colorValue,
            imageUrl: attrValue.imageUrl || existing?.imageUrl || null,
            colors: colorsHex ?? existing?.colors ?? null,
          });
        }
      }
    }
  }
}

function toFiltersResponse(
  colorMap: Map<string, ColorFacetEntry>,
  sizeMap: Map<string, number>
): {
  colors: Array<{
    value: string;
    label: string;
    count: number;
    imageUrl?: string | null;
    colors?: string[] | null;
  }>;
  sizes: Array<{ value: string; count: number }>;
} {
  const colors = Array.from(colorMap.entries())
    .map(([key, data]) => ({
      value: key,
      label: data.label,
      count: data.count,
      imageUrl: data.imageUrl || null,
      colors: data.colors || null,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const sizes = Array.from(sizeMap.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => {
      const aIndex = SIZE_ORDER.indexOf(a.value);
      const bIndex = SIZE_ORDER.indexOf(b.value);
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.value.localeCompare(b.value);
    });

  return { colors, sizes };
}

class ProductsFiltersService {
  async getFilters(filters: {
    category?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    lang?: string;
  }) {
    const cacheKey = filtersCacheKey(
      hashCacheInput(normalizeFiltersCacheContext(filters))
    );
    return withRedisCache(cacheKey, CATALOG_REDIS_TTL_SECONDS, () =>
      this.getFiltersUncached(filters)
    );
  }

  private async getFiltersUncached(filters: {
    category?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    lang?: string;
  }) {
    try {
      const lang = resolveLang(filters.lang);
      const productWhere = await buildCatalogContextWhere({
        lang: filters.lang,
        category: filters.category,
        search: filters.search,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
      });

      const options = await fetchVariantOptionsForContext(productWhere);
      const { colorMap, sizeMap } = buildFacetMapsFromOptions(options, lang);
      await enrichColorFacetsFromProductAttributes(productWhere, lang, colorMap);

      return toFiltersResponse(colorMap, sizeMap);
    } catch (error) {
      console.error("❌ [PRODUCTS FILTERS SERVICE] Error in getFilters:", error);
      return {
        colors: [],
        sizes: [],
      };
    }
  }

  async getPriceRange(filters: { category?: string; lang?: string }) {
    const cacheKey = priceRangeCacheKey(
      hashCacheInput(normalizePriceRangeCacheContext(filters))
    );
    return withRedisCache(cacheKey, CATALOG_REDIS_TTL_SECONDS, () =>
      this.getPriceRangeUncached(filters)
    );
  }

  private async getPriceRangeUncached(filters: {
    category?: string;
    lang?: string;
  }) {
    const productWhere = await buildCatalogContextWhere({
      lang: filters.lang,
      category: filters.category,
    });

    const aggregate = await db.productVariant.aggregate({
      where: {
        published: true,
        product: productWhere,
      },
      _min: { price: true },
      _max: { price: true },
    });

    let minPrice = aggregate._min.price ?? Infinity;
    let maxPrice = aggregate._max.price ?? 0;

    minPrice = minPrice === Infinity ? 0 : Math.floor(minPrice / 1000) * 1000;
    maxPrice = maxPrice === 0 ? 100000 : Math.ceil(maxPrice / 1000) * 1000;

    let stepSize: number | null = null;
    let stepSizePerCurrency: {
      USD?: number;
      AMD?: number;
      RUB?: number;
      GEL?: number;
    } | null = null;

    try {
      const settings = await adminService.getPriceFilterSettings();
      stepSize = settings.stepSize ?? null;

      if (settings.stepSizePerCurrency) {
        stepSizePerCurrency = {
          USD: settings.stepSizePerCurrency.USD ?? undefined,
          AMD: settings.stepSizePerCurrency.AMD ?? undefined,
          RUB: settings.stepSizePerCurrency.RUB ?? undefined,
          GEL: settings.stepSizePerCurrency.GEL ?? undefined,
        };
      }
    } catch (error) {
      console.error(
        "❌ [PRODUCTS FILTERS SERVICE] Error loading price filter settings for price range:",
        error
      );
    }

    return {
      min: minPrice,
      max: maxPrice,
      stepSize,
      stepSizePerCurrency,
    };
  }
}

export const productsFiltersService = new ProductsFiltersService();
