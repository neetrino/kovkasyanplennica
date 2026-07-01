import * as dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getCatalogCounts, logCounts } from "./counts";
import { createImportDb } from "./db-client";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
dotenv.config({ path: path.join(rootDir, ".env") });

async function main(): Promise<void> {
  const db = createImportDb();
  try {
    logCounts("Live counts", await getCatalogCounts(db));
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
