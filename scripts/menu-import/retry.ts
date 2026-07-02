import type { PrismaClient } from "@prisma/client";
import { reconnectImportDb } from "./db-client";

const RETRYABLE_PATTERN =
  /10054|ECONNRESET|Server has closed the connection|connection closed|P1017|PrismaClientInitializationError|ConnectionReset/i;

export type DbRef = {
  getDb: () => PrismaClient;
  setDb: (db: PrismaClient) => void;
};

export let totalRetryCount = 0;

export function resetRetryCount(): void {
  totalRetryCount = 0;
}

function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return RETRYABLE_PATTERN.test(String(error));
  }
  const parts = [error.message, error.name, ...( "code" in error ? [String((error as { code?: unknown }).code)] : [])];
  return RETRYABLE_PATTERN.test(parts.join(" "));
}

export async function withDbRetry<T>(
  operation: string,
  dbRef: DbRef,
  fn: (db: PrismaClient) => Promise<T>,
  maxAttempts = 5
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fn(dbRef.getDb());
    } catch (error) {
      lastError = error;
      if (!isRetryableError(error) || attempt === maxAttempts) {
        throw error;
      }

      totalRetryCount += 1;
      console.warn(
        `[retry ${attempt}/${maxAttempts}] ${operation}: connection reset, reconnecting...`
      );
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      dbRef.setDb(await reconnectImportDb(dbRef.getDb()));
    }
  }

  throw lastError;
}

export function createDbRef(initial: PrismaClient): DbRef {
  let db = initial;
  return {
    getDb: () => db,
    setDb: (next) => {
      db = next;
    },
  };
}
