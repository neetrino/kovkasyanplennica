import { discountSettingsKey } from "@/lib/cache/redis-keys";
import { CATALOG_REDIS_TTL_SECONDS } from "@/lib/cache/public-cache-ttl";
import { withRedisCache } from "@/lib/cache/with-redis-cache";
import { db } from "@white-shop/db";

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

export type DiscountSettings = Awaited<ReturnType<typeof fetchDiscountSettings>>;

export async function getDiscountSettingsCached(): Promise<DiscountSettings> {
  return withRedisCache(
    discountSettingsKey(),
    DISCOUNT_SETTINGS_TTL_SECONDS,
    fetchDiscountSettings
  );
}
