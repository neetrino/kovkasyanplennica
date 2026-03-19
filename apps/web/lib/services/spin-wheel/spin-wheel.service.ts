import type {
  CreateSpinWheelPrizeInput,
  SpinAttempt,
  SpinWheelAttemptsSettingValue,
  SpinWheelPrize,
  UpdateSpinWheelPrizeInput,
} from "./spin-wheel.types";
import { DEFAULT_WEIGHT } from "./spin-wheel.constants";
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
    const [prizesStore, attemptsStore] = await Promise.all([
      store.getPrizesStore(),
      store.getAttemptsStore(),
    ]);
    const now = new Date();
    const activePrizes = prizesStore.prizes
      .filter((p) => isPrizeActive(p as SpinWheelPrize, now))
      .map((p) => normalizePrize(p as SpinWheelPrize));
    const eligiblePrizes = activePrizes.filter((p) => isEligibleForPrize(p, userId));
    const eligiblePrizeIds = new Set(eligiblePrizes.map((p) => p.id));
    const userAttempts = attemptsStore.attempts.filter(
      (a) => a.userId === userId && eligiblePrizeIds.has(a.prizeId)
    );
    const maxSpinsPerUser = getUserSpinLimit(eligiblePrizes);

    return {
      prizes: eligiblePrizes,
      meta: {
        hasSpun: userAttempts.length >= maxSpinsPerUser,
        totalSpins: userAttempts.length,
        remainingSpins: Math.max(0, maxSpinsPerUser - userAttempts.length),
        maxSpinsPerUser,
      },
    };
  }

  async spin(userId: string) {
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
}

export const spinWheelService = new SpinWheelService();
