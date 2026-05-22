/**
 * Redis cache: Upstash REST (serverless) or ioredis TCP (REDIS_URL).
 */

import type { Redis as IORedis } from "ioredis";
import type { Redis as UpstashRedis } from "@upstash/redis";
import { resolveRedisUrl } from "@/lib/cache/redis-url";
import { resolveUpstashRestConfig } from "@/lib/cache/upstash-config";

type CacheBackend =
  | { kind: "upstash"; client: UpstashRedis }
  | { kind: "ioredis"; client: IORedis };

let backend: CacheBackend | null = null;
let redisAvailable = false;
let connectionAttempted = false;
let errorLogged = false;
let lastErrorTime = 0;
const ERROR_COOLDOWN = 30000;

async function initUpstash(): Promise<boolean> {
  const config = resolveUpstashRestConfig();
  if (!config) {
    return false;
  }

  try {
    const { Redis } = await import("@upstash/redis");
    backend = {
      kind: "upstash",
      client: new Redis({ url: config.url, token: config.token }),
    };
    await backend.client.ping();
    redisAvailable = true;
    console.log("✅ Redis connected (Upstash)");
    return true;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("❌ [CACHE] Upstash Redis failed:", message);
    backend = null;
    return false;
  }
}

async function initIoredis(): Promise<boolean> {
  const redisUrl = resolveRedisUrl();
  if (!redisUrl) {
    return false;
  }

  try {
    const RedisClient = (await import("ioredis")).default;
    const useTls = redisUrl.startsWith("rediss://");
    const client = new RedisClient(redisUrl, {
      retryStrategy: (times: number) => (times > 3 ? null : Math.min(times * 50, 2000)),
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
      enableOfflineQueue: false,
      reconnectOnError: () => false,
      ...(useTls ? { tls: {} } : {}),
    });

    client.on("error", (error: Error) => {
      redisAvailable = false;
      const now = Date.now();
      if (!errorLogged || now - lastErrorTime > ERROR_COOLDOWN) {
        console.error("⚠️  Redis connection error:", error.message);
        errorLogged = true;
        lastErrorTime = now;
      }
    });

    await client.connect();
    backend = { kind: "ioredis", client };
    redisAvailable = true;
    console.log("✅ Redis connected");
    return true;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("❌ [CACHE] ioredis failed:", message);
    backend = null;
    return false;
  }
}

async function initRedis(): Promise<void> {
  if (connectionAttempted) {
    return;
  }
  connectionAttempted = true;

  const upstashOk = await initUpstash();
  if (upstashOk) {
    return;
  }

  const ioredisOk = await initIoredis();
  if (ioredisOk) {
    return;
  }

  console.warn("⚠️  Redis not configured - caching disabled");
  console.warn(
    "💡 Set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN or REDIS_URL in .env"
  );
}

async function cacheGet(key: string): Promise<string | null> {
  if (!backend) {
    return null;
  }
  if (backend.kind === "upstash") {
    const value = await backend.client.get<string>(key);
    return value ?? null;
  }
  return backend.client.get(key);
}

async function cacheSet(key: string, value: string): Promise<void> {
  if (!backend) {
    return;
  }
  if (backend.kind === "upstash") {
    await backend.client.set(key, value);
    return;
  }
  await backend.client.set(key, value);
}

async function cacheSetex(
  key: string,
  seconds: number,
  value: string
): Promise<void> {
  if (!backend) {
    return;
  }
  if (backend.kind === "upstash") {
    await backend.client.set(key, value, { ex: seconds });
    return;
  }
  await backend.client.setex(key, seconds, value);
}

async function cacheDel(key: string): Promise<void> {
  if (!backend) {
    return;
  }
  await backend.client.del(key);
}

async function cacheKeys(pattern: string): Promise<string[]> {
  if (!backend) {
    return [];
  }
  const result = await backend.client.keys(pattern);
  return Array.isArray(result) ? result.map(String) : [];
}

export async function get(key: string): Promise<string | null> {
  if (!redisAvailable) {
    await initRedis();
  }
  if (!redisAvailable || !backend) {
    return null;
  }
  try {
    return await cacheGet(key);
  } catch {
    return null;
  }
}

export async function getJson<T>(key: string): Promise<T | null> {
  const raw = await get(key);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function set(key: string, value: string): Promise<boolean> {
  if (!redisAvailable) {
    await initRedis();
  }
  if (!redisAvailable || !backend) {
    return false;
  }
  try {
    await cacheSet(key, value);
    return true;
  } catch {
    return false;
  }
}

export async function setex(
  key: string,
  seconds: number,
  value: string
): Promise<boolean> {
  if (!redisAvailable) {
    await initRedis();
  }
  if (!redisAvailable || !backend) {
    return false;
  }
  try {
    await cacheSetex(key, seconds, value);
    return true;
  } catch {
    return false;
  }
}

export async function setJson(
  key: string,
  value: unknown,
  ttlSeconds?: number
): Promise<boolean> {
  const serialized = JSON.stringify(value);
  if (ttlSeconds && ttlSeconds > 0) {
    return setex(key, ttlSeconds, serialized);
  }
  return set(key, serialized);
}

export async function del(key: string): Promise<boolean> {
  if (!redisAvailable) {
    await initRedis();
  }
  if (!redisAvailable || !backend) {
    return false;
  }
  try {
    await cacheDel(key);
    return true;
  } catch {
    return false;
  }
}

export async function keys(pattern: string): Promise<string[]> {
  if (!redisAvailable) {
    await initRedis();
  }
  if (!redisAvailable || !backend) {
    return [];
  }
  try {
    return await cacheKeys(pattern);
  } catch {
    return [];
  }
}

export async function deletePattern(pattern: string): Promise<number> {
  if (!redisAvailable) {
    await initRedis();
  }
  if (!redisAvailable || !backend) {
    return 0;
  }
  try {
    const matchingKeys = await cacheKeys(pattern);
    if (matchingKeys.length === 0) {
      return 0;
    }
    if (backend.kind === "upstash") {
      await backend.client.del(...matchingKeys);
    } else {
      await backend.client.del(...matchingKeys);
    }
    return matchingKeys.length;
  } catch {
    return 0;
  }
}

export function isAvailable(): boolean {
  return redisAvailable;
}

export const cacheService = {
  get,
  getJson,
  set,
  setex,
  setJson,
  del,
  keys,
  deletePattern,
  isAvailable,
};
