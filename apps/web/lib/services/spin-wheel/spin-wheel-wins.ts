import { db } from "@white-shop/db";
import type { SpinWheelPrize } from "./spin-wheel.types";
import * as store from "./spin-wheel-store";
import { normalizePrize } from "./spin-wheel-utils";

export async function getAdminWins(): Promise<{
  data: Array<{
    id: string;
    userId: string;
    userEmail: string | null;
    userPhone: string | null;
    userName: string | null;
    userContact: string | null;
    productId: string;
    productTitle: string | null;
    productSlug: string | null;
    prizeId: string;
    createdAt: string;
  }>;
}> {
  const [attemptsStore, prizesStore] = await Promise.all([
    store.getAttemptsStore(),
    store.getPrizesStore(),
  ]);
  const attempts = attemptsStore.attempts;
  const prizeById = new Map(prizesStore.prizes.map((p) => [p.id, p]));

  const userIds = [...new Set(attempts.map((a) => a.userId))];
  type UserRow = {
    id: string;
    email: string | null;
    phone: string | null;
    firstName: string | null;
    lastName: string | null;
  };
  const users: UserRow[] =
    userIds.length > 0
      ? await db.user.findMany({
          where: { id: { in: userIds }, deletedAt: null },
          select: { id: true, email: true, phone: true, firstName: true, lastName: true },
        })
      : [];
  const userById = new Map<string, UserRow>(users.map((u) => [u.id, u]));

  const data = attempts.map((attempt) => {
    const rawPrize = prizeById.get(attempt.prizeId);
    const prize = rawPrize ? normalizePrize(rawPrize as SpinWheelPrize) : null;
    const wonProduct = prize?.products?.find((p) => p.productId === attempt.productId) ?? null;
    const user = userById.get(attempt.userId);
    const userName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || null;
    const userContact = user?.email || user?.phone || null;

    return {
      id: attempt.id,
      userId: attempt.userId,
      userEmail: user?.email ?? null,
      userPhone: user?.phone ?? null,
      userName: userName || null,
      userContact: userContact || attempt.userId,
      productId: attempt.productId,
      productTitle: wonProduct?.productTitle ?? prize?.productTitle ?? null,
      productSlug: wonProduct?.productSlug ?? prize?.productSlug ?? null,
      prizeId: attempt.prizeId,
      createdAt: attempt.createdAt,
    };
  });

  return {
    data: data.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),
  };
}

export async function deleteWin(attemptId: string): Promise<{ success: true }> {
  const attemptsStore = await store.getAttemptsStore();
  const exists = attemptsStore.attempts.some((a) => a.id === attemptId);
  if (!exists) {
    throw {
      status: 404,
      type: "https://api.shop.am/problems/not-found",
      title: "Not found",
      detail: `Spin win with id '${attemptId}' does not exist`,
    };
  }
  const updatedStore = {
    attempts: attemptsStore.attempts.filter((a) => a.id !== attemptId),
  };
  await store.saveAttemptsStore(updatedStore);
  return { success: true };
}
