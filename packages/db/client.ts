import { PrismaClient } from "@prisma/client";

type GlobalWithPrisma = typeof globalThis & {
  prisma?: PrismaClient;
};

const globalForPrisma = globalThis as GlobalWithPrisma;

function appendQueryParam(url: string, param: string): string {
  return url.includes("?") ? `${url}&${param}` : `${url}?${param}`;
}

function buildDatabaseUrl(rawUrl: string): string {
  if (!rawUrl) {
    return rawUrl;
  }

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

const databaseUrl = process.env.DATABASE_URL ?? "";
const urlWithEncoding = buildDatabaseUrl(databaseUrl);

if (urlWithEncoding && urlWithEncoding !== databaseUrl) {
  process.env.DATABASE_URL = urlWithEncoding;
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
    errorFormat: "pretty",
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
