import type {
  CreateSpinWheelPrizeInput,
  SpinWheelPrize,
  SpinWheelPrizesSettingValue,
  UpdateSpinWheelPrizeInput,
} from "./spin-wheel.types";
import { MAX_PRODUCTS_PER_PRIZE } from "./spin-wheel.types";
import { DEFAULT_WEIGHT } from "./spin-wheel.constants";
import * as store from "./spin-wheel-store";
import { createId, normalizePrize, parseIsoDate } from "./spin-wheel-utils";
import { getProductSnapshots } from "./spin-wheel-product-snapshot";

export async function createPrize(
  input: CreateSpinWheelPrizeInput
): Promise<{ success: true; data: SpinWheelPrize }> {
  const startDate = parseIsoDate(input.startDate, "startDate");
  const endDate = parseIsoDate(input.endDate, "endDate");
  if (endDate <= startDate) {
    throw {
      status: 400,
      type: "https://api.shop.am/problems/validation-error",
      title: "Validation Error",
      detail: "endDate must be greater than startDate",
    };
  }

  const productIds = Array.isArray(input.productIds) ? input.productIds.filter(Boolean) : [];
  if (productIds.length === 0 || productIds.length > MAX_PRODUCTS_PER_PRIZE) {
    throw {
      status: 400,
      type: "https://api.shop.am/problems/validation-error",
      title: "Validation Error",
      detail: `productIds must contain 1 to ${MAX_PRODUCTS_PER_PRIZE} product IDs`,
    };
  }

  const audience = input.audience;
  const userIds = audience === "selected" ? (input.userIds ?? []).filter(Boolean) : [];
  if (audience === "selected" && userIds.length === 0) {
    throw {
      status: 400,
      type: "https://api.shop.am/problems/validation-error",
      title: "Validation Error",
      detail: "At least one userId is required for selected audience",
    };
  }

  const weight = typeof input.weight === "number" && input.weight > 0 ? input.weight : DEFAULT_WEIGHT;
  const maxSpinsPerUser =
    typeof input.maxSpinsPerUser === "number" && input.maxSpinsPerUser > 0
      ? Math.floor(input.maxSpinsPerUser)
      : null;
  const products = await getProductSnapshots(productIds);
  const first = products[0];
  const nowIso = new Date().toISOString();

  const prize: SpinWheelPrize = {
    id: createId("prize"),
    productId: first.productId,
    productTitle: first.productTitle,
    productSlug: first.productSlug,
    productImageUrl: first.productImageUrl,
    productIds,
    products,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    audience,
    userIds,
    maxSpinsPerUser,
    weight,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const prizesStore = await store.getPrizesStore();
  const updatedStore: SpinWheelPrizesSettingValue = {
    prizes: [prize, ...prizesStore.prizes],
  };
  await store.savePrizesStore(updatedStore);
  return { success: true, data: normalizePrize(prize) };
}

export async function updatePrize(
  prizeId: string,
  input: UpdateSpinWheelPrizeInput
): Promise<{ success: true; data: SpinWheelPrize }> {
  const prizesStore = await store.getPrizesStore();
  const current = prizesStore.prizes.find((item) => item.id === prizeId) as SpinWheelPrize | undefined;
  const currentPrize = current ? normalizePrize(current) : undefined;

  if (!currentPrize) {
    throw {
      status: 404,
      type: "https://api.shop.am/problems/not-found",
      title: "Prize not found",
      detail: `Prize with id '${prizeId}' does not exist`,
    };
  }

  const audience = input.audience ?? currentPrize.audience;
  const userIds =
    audience === "selected"
      ? (input.userIds ?? currentPrize.userIds).filter(Boolean)
      : [];
  if (audience === "selected" && userIds.length === 0) {
    throw {
      status: 400,
      type: "https://api.shop.am/problems/validation-error",
      title: "Validation Error",
      detail: "At least one userId is required for selected audience",
    };
  }

  const startDate = input.startDate
    ? parseIsoDate(input.startDate, "startDate")
    : new Date(currentPrize.startDate);
  const endDate = input.endDate ? parseIsoDate(input.endDate, "endDate") : new Date(currentPrize.endDate);
  if (endDate <= startDate) {
    throw {
      status: 400,
      type: "https://api.shop.am/problems/validation-error",
      title: "Validation Error",
      detail: "endDate must be greater than startDate",
    };
  }

  let productIds = currentPrize.productIds;
  let products = currentPrize.products;
  if (Array.isArray(input.productIds) && input.productIds.length > 0) {
    const ids = input.productIds.filter(Boolean);
    if (ids.length > MAX_PRODUCTS_PER_PRIZE) {
      throw {
        status: 400,
        type: "https://api.shop.am/problems/validation-error",
        title: "Validation Error",
        detail: `productIds may contain at most ${MAX_PRODUCTS_PER_PRIZE} product IDs`,
      };
    }
    productIds = ids;
    products = await getProductSnapshots(ids);
  }

  const first = products[0];
  const updatedPrize: SpinWheelPrize = {
    ...currentPrize,
    productId: first.productId,
    productTitle: first.productTitle,
    productSlug: first.productSlug,
    productImageUrl: first.productImageUrl,
    productIds,
    products,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    audience,
    userIds,
    maxSpinsPerUser:
      typeof input.maxSpinsPerUser === "number"
        ? input.maxSpinsPerUser > 0
          ? Math.floor(input.maxSpinsPerUser)
          : null
        : currentPrize.maxSpinsPerUser,
    weight:
      typeof input.weight === "number"
        ? input.weight > 0
          ? input.weight
          : DEFAULT_WEIGHT
        : currentPrize.weight,
    updatedAt: new Date().toISOString(),
  };

  const updatedStore: SpinWheelPrizesSettingValue = {
    prizes: prizesStore.prizes.map((item) => (item.id === prizeId ? updatedPrize : item)),
  };
  await store.savePrizesStore(updatedStore);
  return { success: true, data: normalizePrize(updatedPrize) };
}

export async function deletePrize(prizeId: string): Promise<{ success: true }> {
  const prizesStore = await store.getPrizesStore();
  const hasPrize = prizesStore.prizes.some((item) => item.id === prizeId);
  if (!hasPrize) {
    throw {
      status: 404,
      type: "https://api.shop.am/problems/not-found",
      title: "Prize not found",
      detail: `Prize with id '${prizeId}' does not exist`,
    };
  }
  const updatedStore = {
    prizes: prizesStore.prizes.filter((item) => item.id !== prizeId),
  };
  await store.savePrizesStore(updatedStore);
  return { success: true };
}
