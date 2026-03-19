export type PrizeAudience = "all" | "selected";

/** Single product snapshot within a prize (one prize can have multiple products) */
export interface SpinWheelPrizeProduct {
  productId: string;
  productTitle: string;
  productSlug: string;
  productImageUrl: string | null;
}

export interface SpinWheelPrize {
  id: string;
  /** @deprecated Use productIds and products. Kept for backward compatibility. */
  productId: string;
  /** @deprecated Use products[].productTitle */
  productTitle: string;
  /** @deprecated Use products[].productSlug */
  productSlug: string;
  /** @deprecated Use products[].productImageUrl */
  productImageUrl: string | null;
  /** Product IDs for this prize (1–9). When spinning, one is chosen at random. */
  productIds: string[];
  /** Resolved product snapshots for display and spin result. */
  products: SpinWheelPrizeProduct[];
  startDate: string;
  endDate: string;
  audience: PrizeAudience;
  userIds: string[];
  maxSpinsPerUser: number | null;
  weight: number;
  createdAt: string;
  updatedAt: string;
}

export interface SpinAttempt {
  id: string;
  userId: string;
  prizeId: string;
  productId: string;
  createdAt: string;
}

export interface SpinWheelPrizesSettingValue {
  prizes: SpinWheelPrize[];
}

export interface SpinWheelAttemptsSettingValue {
  attempts: SpinAttempt[];
}

const MAX_PRODUCTS_PER_PRIZE = 9;

export { MAX_PRODUCTS_PER_PRIZE };

export interface CreateSpinWheelPrizeInput {
  /** One or more product IDs (max 9). When user wins, one is chosen at random. */
  productIds: string[];
  startDate: string;
  endDate: string;
  audience: PrizeAudience;
  userIds?: string[];
  maxSpinsPerUser?: number | null;
  weight?: number;
}

export interface UpdateSpinWheelPrizeInput {
  productIds?: string[];
  startDate?: string;
  endDate?: string;
  audience?: PrizeAudience;
  userIds?: string[];
  maxSpinsPerUser?: number | null;
  weight?: number;
}
