export type UpstashRestConfig = {
  url: string;
  token: string;
};

export function resolveUpstashRestConfig(): UpstashRestConfig | undefined {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) {
    return undefined;
  }
  return { url, token };
}
