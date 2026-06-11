import type {
  CreateSpinWheelPrizeInput,
  SpinAttempt,
  SpinWheelAttemptsSettingValue,
  SpinWheelPrize,
  UpdateSpinWheelPrizeInput,
} from "./spin-wheel.types";
import { DEFAULT_WEIGHT } from "./spin-wheel.constants";
import { spinWheelFeatureKey } from "@/lib/cache/redis-keys";
import { SETTINGS_REDIS_TTL_SECONDS } from "@/lib/cache/public-cache-ttl";
import { withRedisCache } from "@/lib/cache/with-redis-cache";
import { cacheService } from "@/lib/services/cache.service";
import * as store from "./spin-wheel-store";
import {
  createId,
  isEligibleForPrize,
  isPrizeActive,
  normalizePrize,
  getUserSpinLimit,
} from "./spin-wheel-utils";
import * as prizeCrud from "./spin-wheel-prize-crud";
import * as wins from "./spin-wheel-wins";
import { getProductSnapshotsSafe } from "./spin-wheel-product-snapshot";

async function getSpinWheelFeatureEnabledCached(): Promise<boolean> {
  return withRedisCache(spinWheelFeatureKey(), SETTINGS_REDIS_TTL_SECONDS, () =>
    store.getSpinWheelFeatureEnabled()
  );
}

async function invalidateSpinWheelFeatureCache(): Promise<void> {
  await cacheService.del(spinWheelFeatureKey());
}

async function hydratePrizesWithProducts(prizes: SpinWheelPrize[]) {
  const productIdsByPrize = prizes.map((prize) => ({
    prize,
    ids: prize.productIds?.length ? prize.productIds : [prize.productId].filter(Boolean),
  }));
  const hydratedProducts = await Promise.all(
    productIdsByPrize.map(({ ids }) => getProductSnapshotsSafe(ids))
  );
  return prizes.map((prize, index) => {
    const fresh = hydratedProducts[index];
    if (fresh.length === 0) {
      return prize;
    }
    const first = fresh[0];
    return {
      ...prize,
      products: fresh,
      productId: first.productId,
      productTitle: first.productTitle,
      productSlug: first.productSlug,
      productImageUrl: first.productImageUrl,
    };
  });
}

class SpinWheelService {
  async getAdminPrizes() {
    const prizesStore = await store.getPrizesStore();
    const sorted = [...prizesStore.prizes].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return { data: sorted.map((p) => normalizePrize(p as SpinWheelPrize)) };
  }

  async createPrize(input: CreateSpinWheelPrizeInput) {
    return prizeCrud.createPrize(input);
  }

  async updatePrize(prizeId: string, input: UpdateSpinWheelPrizeInput) {
    return prizeCrud.updatePrize(prizeId, input);
  }

  async deletePrize(prizeId: string) {
    return prizeCrud.deletePrize(prizeId);
  }

  async getEligibleActivePrizes(userId: string) {
    const featureOn = await getSpinWheelFeatureEnabledCached();
    if (!featureOn) {
      return {
        prizes: [] as SpinWheelPrize[],
        meta: {
          hasSpun: false,
          totalSpins: 0,
          remainingSpins: 0,
          maxSpinsPerUser: 0,
        },
      };
    }

    const { prizesStore, attemptsStore } = await store.getSpinWheelRuntimeSettings();
    const now = new Date();
    const normalizedPrizes = prizesStore.prizes.map((p) => normalizePrize(p as SpinWheelPrize));
    const activePrizes = normalizedPrizes.filter((p) => isPrizeActive(p, now));
    const eligiblePrizes = activePrizes.filter((p) => isEligibleForPrize(p, userId));
    const prizesWithFreshProducts = await hydratePrizesWithProducts(eligiblePrizes);

    const eligiblePrizeIds = new Set(prizesWithFreshProducts.map((p) => p.id));
    const userAttempts = attemptsStore.attempts.filter(
      (a) => a.userId === userId && eligiblePrizeIds.has(a.prizeId)
    );
    const maxSpinsPerUser = getUserSpinLimit(prizesWithFreshProducts);

    return {
      prizes: prizesWithFreshProducts,
      meta: {
        hasSpun: userAttempts.length >= maxSpinsPerUser,
        totalSpins: userAttempts.length,
        remainingSpins: Math.max(0, maxSpinsPerUser - userAttempts.length),
        maxSpinsPerUser,
      },
    };
  }

  async spin(userId: string) {
    const featureOn = await getSpinWheelFeatureEnabledCached();
    if (!featureOn) {
      throw {
        status: 403,
        type: "https://api.shop.am/problems/forbidden",
        title: "Spin wheel disabled",
        detail: "The spin wheel is currently turned off",
      };
    }

    const { prizes, meta } = await this.getEligibleActivePrizes(userId);
    if (prizes.length === 0) {
      throw {
        status: 400,
        type: "https://api.shop.am/problems/validation-error",
        title: "No active prizes",
        detail: "No active prizes are available for this user",
      };
    }
    if (meta.hasSpun) {
      throw {
        status: 409,
        type: "https://api.shop.am/problems/conflict",
        title: "Spin limit reached",
        detail: "User reached the maximum number of spins",
      };
    }

    const weightSum = prizes.reduce(
      (sum, p) => sum + (p.weight > 0 ? p.weight : DEFAULT_WEIGHT),
      0
    );
    const randomValue = Math.random() * weightSum;
    let cumulative = 0;
    let selectedPrize = prizes[0];
    for (const prize of prizes) {
      cumulative += prize.weight > 0 ? prize.weight : DEFAULT_WEIGHT;
      if (randomValue <= cumulative) {
        selectedPrize = prize;
        break;
      }
    }

    const productIds = selectedPrize.productIds ?? [selectedPrize.productId];
    const products = selectedPrize.products ?? [];
    const wonIndex = productIds.length > 1 ? Math.floor(Math.random() * productIds.length) : 0;
    const wonProductId = productIds[wonIndex] ?? selectedPrize.productId;

    const attempt: SpinAttempt = {
      id: createId("spin"),
      userId,
      prizeId: selectedPrize.id,
      productId: wonProductId,
      createdAt: new Date().toISOString(),
    };

    const wonSnapshot = products.find((p) => p.productId === wonProductId) ?? products[0];
    const displayPrize: SpinWheelPrize = {
      ...selectedPrize,
      productId: wonSnapshot.productId,
      productTitle: wonSnapshot.productTitle,
      productSlug: wonSnapshot.productSlug,
      productImageUrl: wonSnapshot.productImageUrl,
    };

    const attemptsStore = await store.getAttemptsStore();
    const updatedStore: SpinWheelAttemptsSettingValue = {
      attempts: [attempt, ...attemptsStore.attempts],
    };
    await store.saveAttemptsStore(updatedStore);

    return {
      success: true,
      data: { prize: displayPrize, attempt },
    };
  }

  async getAdminWins() {
    return wins.getAdminWins();
  }

  async deleteWin(attemptId: string) {
    return wins.deleteWin(attemptId);
  }

  async getSpinWheelFeatureSetting() {
    const enabled = await store.getSpinWheelFeatureEnabled();
    return { enabled };
  }

  async setSpinWheelFeatureEnabled(enabled: boolean) {
    await store.saveSpinWheelFeatureEnabled(enabled);
    await invalidateSpinWheelFeatureCache();
    return { enabled };
  }
}

export const spinWheelService = new SpinWheelService();
