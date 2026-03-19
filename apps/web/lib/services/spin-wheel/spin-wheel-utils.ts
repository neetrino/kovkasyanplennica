import type { SpinWheelPrize, SpinWheelPrizeProduct } from "./spin-wheel.types";
import { DEFAULT_MAX_SPINS_PER_USER, DEFAULT_WEIGHT } from "./spin-wheel.constants";

interface ProductTranslationSnapshot {
  locale: string;
  title: string;
  slug: string;
}

export function createId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function parseIsoDate(value: string, field: string): Date {
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    throw {
      status: 400,
      type: "https://api.shop.am/problems/validation-error",
      title: "Validation Error",
      detail: `Invalid ${field}`,
    };
  }
  return parsedDate;
}

export function getProductPrimaryTranslation(
  translations: ProductTranslationSnapshot[]
): ProductTranslationSnapshot | null {
  const preferredLocales = ["hy", "ru", "en"];
  for (const locale of preferredLocales) {
    const matched = translations.find((item) => item.locale === locale);
    if (matched) return matched;
  }
  return translations[0] ?? null;
}

export function isPrizeActive(prize: SpinWheelPrize, now: Date): boolean {
  const start = new Date(prize.startDate);
  const end = new Date(prize.endDate);
  return start <= now && now <= end;
}

export function isEligibleForPrize(prize: SpinWheelPrize, userId: string): boolean {
  if (prize.audience === "all") return true;
  return prize.userIds.includes(userId);
}

export function getUserSpinLimit(prizes: SpinWheelPrize[]): number {
  const explicitLimits = prizes
    .map((p) => p.maxSpinsPerUser)
    .filter((v): v is number => typeof v === "number" && v > 0);
  if (explicitLimits.length === 0) return DEFAULT_MAX_SPINS_PER_USER;
  return Math.max(...explicitLimits);
}

function toNormalizedProductSnapshot(
  product: unknown
): SpinWheelPrizeProduct | null {
  if (!product || typeof product !== "object") {
    return null;
  }

  const raw = product as {
    productId?: string;
    id?: string;
    productTitle?: string;
    title?: string;
    productSlug?: string;
    slug?: string;
    productImageUrl?: string | null;
    imageUrl?: string | null;
    image?: string | null;
    url?: string | null;
  };

  const productId = raw.productId ?? raw.id ?? "";
  if (!productId) {
    return null;
  }

  return {
    productId,
    productTitle: raw.productTitle ?? raw.title ?? "",
    productSlug: raw.productSlug ?? raw.slug ?? "",
    productImageUrl: raw.productImageUrl ?? raw.imageUrl ?? raw.image ?? raw.url ?? null,
  };
}

/** Ensure prize has productIds and products (for legacy single-product prizes). */
export function normalizePrize(prize: SpinWheelPrize): SpinWheelPrize {
  const hasNewFormat =
    Array.isArray((prize as { productIds?: string[] }).productIds) &&
    Array.isArray((prize as { products?: SpinWheelPrizeProduct[] }).products);
  if (hasNewFormat) {
    const p = prize as SpinWheelPrize;
    const normalizedProducts = (p.products ?? [])
      .map((product) => toNormalizedProductSnapshot(product))
      .filter((product): product is SpinWheelPrizeProduct => product !== null);
    const firstProduct = normalizedProducts[0];

    return {
      ...p,
      products: normalizedProducts,
      productIds: p.productIds?.length
        ? p.productIds
        : normalizedProducts.map((product) => product.productId),
      productId: p.productId ?? firstProduct?.productId ?? "",
      productTitle: p.productTitle ?? firstProduct?.productTitle ?? "",
      productSlug: p.productSlug ?? firstProduct?.productSlug ?? "",
      productImageUrl: p.productImageUrl ?? firstProduct?.productImageUrl ?? null,
    };
  }
  const legacy = prize as {
    id: string;
    productId: string;
    productTitle: string;
    productSlug: string;
    productImageUrl: string | null;
    startDate: string;
    endDate: string;
    audience: SpinWheelPrize["audience"];
    userIds: string[];
    maxSpinsPerUser: number | null;
    weight: number;
    createdAt: string;
    updatedAt: string;
  };
  const first: SpinWheelPrizeProduct = {
    productId: legacy.productId,
    productTitle: legacy.productTitle,
    productSlug: legacy.productSlug,
    productImageUrl: legacy.productImageUrl,
  };
  return { ...legacy, productIds: [legacy.productId], products: [first] };
}
