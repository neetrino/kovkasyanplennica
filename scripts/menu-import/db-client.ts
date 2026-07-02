import { PrismaClient } from "@prisma/client";

function appendQueryParam(url: string, param: string): string {
  return url.includes("?") ? `${url}&${param}` : `${url}?${param}`;
}

function buildDatabaseUrl(rawUrl: string): string {
  if (!rawUrl) return rawUrl;

  let url = rawUrl;
  if (!url.includes("client_encoding")) {
    url = appendQueryParam(url, "client_encoding=UTF8");
  }
  if (url.includes("-pooler.") && !url.includes("pgbouncer")) {
    url = appendQueryParam(url, "pgbouncer=true");
  }
  if (!url.includes("connection_limit")) {
    url = appendQueryParam(url, "connection_limit=1");
  }
  return url;
}

function applyImportDatabaseUrl(): void {
  const raw = process.env.DATABASE_URL?.trim() ?? "";
  if (!raw) return;
  const built = buildDatabaseUrl(raw);
  if (built !== raw) {
    process.env.DATABASE_URL = built;
  }
}

export function createImportDb(): PrismaClient {
  applyImportDatabaseUrl();
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error("DATABASE_URL is missing");
  }
  return new PrismaClient({
    log: ["error", "warn"],
    errorFormat: "pretty",
  });
}

export async function reconnectImportDb(current?: PrismaClient): Promise<PrismaClient> {
  if (current) {
    try {
      await current.$disconnect();
    } catch {
      // ignore disconnect errors on broken connections
    }
  }
  return createImportDb();
}
