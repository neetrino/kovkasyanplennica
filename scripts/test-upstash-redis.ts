import "dotenv/config";
import { Redis } from "@upstash/redis";

async function main(): Promise<void> {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) {
    console.error("❌ Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN in .env");
    process.exit(1);
  }

  const redis = new Redis({ url, token });
  const pong = await redis.ping();
  console.log("✅ Upstash ping:", pong);
  await redis.set("shop:health-check", "ok", { ex: 60 });
  console.log("✅ Upstash get:", await redis.get("shop:health-check"));
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("❌ Upstash failed:", message);
  process.exit(1);
});
